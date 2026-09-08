import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Lazy initialization for Gemini client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    name: 'ERROREN AI',
    timestamp: new Date().toISOString(),
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Candidate models in order of priority & reliability.
// gemini-3.8-flash is the primary model for text tasks;
// gemini-3.1-flash-lite offers high-throughput low-latency fallback;
// gemini-flash-latest and gemini-3.6-flash provide backup resilience.
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.6-flash',
];

const DEFAULT_SYSTEM_INSTRUCTION =
  'You are ERROREN, a brilliant, helpful, friendly, and highly intelligent AI assistant. ' +
  'You have deep expertise in programming, software engineering, science, philosophy, writing, languages, and general knowledge. ' +
  'You understand and can converse naturally in English, Roman Urdu (e.g., "aap kaisay hain", "mein theek hoon"), formal Urdu (اردو), and other languages based on what the user speaks. ' +
  'Always format code blocks with language identifiers and clean markdown. Provide clear, accurate, and concise explanations with code examples when relevant. ' +
  'Be encouraging and polite.';

function formatContents(messages: any[], image: any) {
  const contents: Array<{ role: 'user' | 'model'; parts: Array<any> }> = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isLast = i === messages.length - 1;
    const role = msg.role === 'user' ? 'user' : 'model';

    const parts: Array<any> = [];

    // If last user message and has attached image
    if (isLast && role === 'user' && image?.data && image?.mimeType) {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      });
    }

    if (msg.text) {
      parts.push({ text: msg.text });
    }

    if (parts.length > 0) {
      contents.push({ role, parts });
    }
  }

  return contents;
}

// Streaming Chat API with automated model fallback on 503 / high demand errors
app.post('/api/chat/stream', async (req: Request, res: Response): Promise<void> => {
  const { messages, image, systemPrompt } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required' });
    return;
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const contents = formatContents(messages, image);
  const config = {
    systemInstruction: systemPrompt || DEFAULT_SYSTEM_INSTRUCTION,
    temperature: 0.7,
  };

  let streamSucceeded = false;
  let lastError: any = null;
  let clientDisconnected = false;

  req.on('close', () => {
    clientDisconnected = true;
  });

  try {
    const ai = getGeminiClient();

    // Iterate through candidate models if 503, 429, or capacity issues arise
    for (const modelName of CANDIDATE_MODELS) {
      if (clientDisconnected) break;

      try {
        console.log(`[ERROREN] Attempting streaming generation with model: ${modelName}`);

        const responseStream = await ai.models.generateContentStream({
          model: modelName,
          contents: contents as any,
          config,
        });

        for await (const chunk of responseStream) {
          if (clientDisconnected) break;
          const candidateText = (chunk as GenerateContentResponse).text;
          if (candidateText) {
            res.write(`data: ${JSON.stringify({ chunk: candidateText })}\n\n`);
            (res as any).flush?.();
            streamSucceeded = true;
          }
        }

        if (streamSucceeded) {
          console.log(`[ERROREN] Successfully finished stream with model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[ERROREN] Model ${modelName} stream failed:`, err?.message || err);

        // If we already sent chunks to the client, we cannot cleanly switch models mid-stream
        if (streamSucceeded || clientDisconnected) {
          break;
        }

        // Delay briefly before fallback attempt to relieve transient concurrency
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log(`[ERROREN] Attempting fallback model...`);
      }
    }

    if (streamSucceeded) {
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // If all models failed
    console.error('All model attempts failed in /api/chat/stream:', lastError);
    let userMessage =
      'The AI service is momentarily experiencing high demand. Please try again in a few moments.';
    if (lastError?.message && typeof lastError.message === 'string') {
      try {
        const parsed = JSON.parse(lastError.message);
        if (parsed?.error?.message) {
          userMessage = parsed.error.message;
        }
      } catch {
        userMessage = lastError.message;
      }
    }

    res.write(`data: ${JSON.stringify({ error: userMessage })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Fatal error in /api/chat/stream:', error);
    const errorMessage = error?.message || 'An unexpected error occurred while communicating with ERROREN AI.';
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// Non-streaming Chat API (Fallback)
app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  const { messages, image, systemPrompt } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required' });
    return;
  }

  const contents = formatContents(messages, image);
  const config = {
    systemInstruction: systemPrompt || DEFAULT_SYSTEM_INSTRUCTION,
  };

  try {
    const ai = getGeminiClient();
    let lastError: any = null;

    for (const modelName of CANDIDATE_MODELS) {
      try {
        console.log(`[ERROREN non-stream] Attempting with model: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents as any,
          config,
        });

        if (response.text) {
          res.json({ text: response.text });
          return;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[ERROREN non-stream] Model ${modelName} failed:`, err?.message || err);
      }
    }

    res.status(503).json({
      error: lastError?.message || 'AI service currently unavailable across all model endpoints.',
    });
  } catch (error: any) {
    console.error('Error generating response in /api/chat:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate response.',
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ERROREN Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
