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

// Lazy initialization or safe fallback for Gemini client
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

// Streaming Chat API
app.post('/api/chat/stream', async (req: Request, res: Response): Promise<void> => {
  const { messages, image, mode, systemPrompt } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required' });
    return;
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    const ai = getGeminiClient();

    const selectedModel = 'gemini-3.8-flash';

    const defaultSystemInstruction =
      'You are ERROREN, a brilliant, helpful, friendly, and highly intelligent AI assistant. ' +
      'You have deep expertise in programming, software engineering, science, philosophy, writing, languages, and general knowledge. ' +
      'You understand and can converse naturally in English, Roman Urdu (e.g., "aap kaisay hain", "mein theek hoon"), formal Urdu (اردو), and other languages based on what the user speaks. ' +
      'Always format code blocks with language identifiers and clean markdown. Provide clear, accurate, and concise explanations with code examples when relevant. ' +
      'Be encouraging and polite.';

    // Format chat history into Gemini contents format
    // Contents structure: array of { role: 'user' | 'model', parts: [{ text: ... }] }
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

    const config: any = {
      systemInstruction: systemPrompt || defaultSystemInstruction,
      temperature: 0.7,
    };

    const responseStream = await ai.models.generateContentStream({
      model: selectedModel,
      contents: contents as any,
      config,
    });

    for await (const chunk of responseStream) {
      const candidateText = (chunk as GenerateContentResponse).text;
      if (candidateText) {
        res.write(`data: ${JSON.stringify({ chunk: candidateText })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Error generating response in /api/chat/stream:', error);
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

  try {
    const ai = getGeminiClient();
    const selectedModel = 'gemini-3.8-flash';

    const defaultSystemInstruction =
      'You are ERROREN, a brilliant, helpful, friendly, and highly intelligent AI assistant. ' +
      'Format responses in clear markdown with code snippets where applicable.';

    const contents: Array<{ role: 'user' | 'model'; parts: Array<any> }> = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const isLast = i === messages.length - 1;
      const role = msg.role === 'user' ? 'user' : 'model';
      const parts: Array<any> = [];

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

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: contents as any,
      config: {
        systemInstruction: systemPrompt || defaultSystemInstruction,
      },
    });

    res.json({ text: response.text || '' });
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
