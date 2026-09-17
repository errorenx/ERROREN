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
// gemini-3.1-flash-lite offers high throughput, lowest latency (~2s), and avoids high-demand queues.
// gemini-3.5-flash and gemini-3.6-flash serve as secondary resilience layers.
const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
];

const DEFAULT_SYSTEM_INSTRUCTION =
  'You are ERROREN AI, a brilliant, super-helpful, friendly, and lightning-fast AI companion. ' +
  'You provide accurate, articulate, and well-structured answers for any question, whether it involves programming, debugging, math, science, creative writing, business, or everyday conversation. ' +
  'You naturally match the user’s language: if the user writes in Roman Urdu (e.g. "aap kaise hain", "mujhe code samjha dein", "kya chal raha hai"), reply warmly and respectfully in natural Roman Urdu. ' +
  'If the user writes in English, reply in English. If in Urdu (اردو), reply in Urdu. ' +
  'Format all responses cleanly with Markdown, including bullet points, numbered lists, and syntax-highlighted code blocks with proper language identifiers. ' +
  'Keep your responses friendly, encouraging, and complete with no unnecessary robotic filler.';

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

    if (msg.text && typeof msg.text === 'string' && msg.text.trim()) {
      parts.push({ text: msg.text.trim() });
    }

    if (parts.length > 0) {
      contents.push({ role, parts });
    }
  }

  // Ensure conversation starts with 'user' turn (Gemini API requirement)
  while (contents.length > 0 && contents[0].role !== 'user') {
    contents.shift();
  }

  if (contents.length === 0) {
    contents.push({
      role: 'user',
      parts: [{ text: 'Hello ERROREN' }],
    });
  }

  // Merge consecutive turns with identical roles to prevent multi-turn errors
  const merged: Array<{ role: 'user' | 'model'; parts: Array<any> }> = [];
  for (const item of contents) {
    const prev = merged[merged.length - 1];
    if (prev && prev.role === item.role) {
      prev.parts.push(...item.parts);
    } else {
      merged.push({ role: item.role, parts: [...item.parts] });
    }
  }

  return merged;
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

  res.on('close', () => {
    if (!res.writableEnded) {
      clientDisconnected = true;
    }
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
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // If streaming had issues but nothing was sent yet, attempt non-streaming fallback
    if (!streamSucceeded && !clientDisconnected) {
      console.log('[ERROREN] Attempting non-streaming fallback with gemini-3.1-flash-lite...');
      try {
        const directRes = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: contents as any,
          config,
        });
        if (directRes.text) {
          res.write(`data: ${JSON.stringify({ chunk: directRes.text })}\n\n`);
          (res as any).flush?.();
          streamSucceeded = true;
        }
      } catch (fallbackErr: any) {
        console.warn('[ERROREN] Direct fallback also encountered error:', fallbackErr?.message || fallbackErr);
        lastError = fallbackErr || lastError;
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
      'Main is waqt thoda busy hoon ya connection issue hai. Baraye meherbani thori dair baad dobara koshish karein.';
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

// Image Generation & Editing API Endpoint
app.post('/api/generate-image', async (req: Request, res: Response): Promise<void> => {
  const { prompt, image, aspectRatio } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ error: 'A prompt describing the image to generate or edit is required.' });
    return;
  }

  const cleanPrompt = prompt.trim();
  console.log(`[ERROREN Image API] Request received for prompt: "${cleanPrompt}", hasImage: ${!!image?.data}`);

  // 1. First attempt with Gemini Nano/Flash image generation model if key is configured
  try {
    const ai = getGeminiClient();
    const parts: any[] = [];

    if (image?.data) {
      parts.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType || 'image/png',
        },
      });
      parts.push({
        text: cleanPrompt || 'Edit and transform this image according to user instructions.',
      });
    } else {
      parts.push({ text: cleanPrompt });
    }

    // Try Gemini image model
    const geminiImgRes = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: { parts } as any,
      config: {
        imageConfig: {
          aspectRatio: (aspectRatio as any) || '1:1',
        },
      },
    });

    for (const part of geminiImgRes.candidates?.[0]?.content?.parts || []) {
      if ((part as any).inlineData) {
        const mime = (part as any).inlineData.mimeType || 'image/png';
        const b64 = (part as any).inlineData.data;
        console.log('[ERROREN Image API] Successfully generated with Gemini Imagen model!');
        res.json({
          imageUrl: `data:${mime};base64,${b64}`,
          prompt: cleanPrompt,
          source: 'gemini',
        });
        return;
      }
    }
  } catch (geminiErr: any) {
    console.warn('[ERROREN Image API] Gemini direct image model unavailable or error:', geminiErr?.message || geminiErr);
  }

  // 2. High-Fidelity Neural Fallback Pipeline
  try {
    const safeAspect = aspectRatio || '1:1';
    let width = 1024;
    let height = 1024;
    if (safeAspect === '16:9') {
      width = 1280;
      height = 720;
    } else if (safeAspect === '9:16') {
      width = 720;
      height = 1280;
    } else if (safeAspect === '4:3') {
      width = 1024;
      height = 768;
    }

    const seed = Math.floor(Math.random() * 900000) + 100000;
    const encodedPrompt = encodeURIComponent(cleanPrompt);
    const neuralUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

    console.log(`[ERROREN Image API] Generating via Neural Engine: ${neuralUrl}`);

    // Try fetching and converting to base64 for persistent, self-contained rendering
    try {
      const response = await fetch(neuralUrl);
      if (response.ok) {
        const arrayBuf = await response.arrayBuffer();
        const base64Str = Buffer.from(arrayBuf).toString('base64');
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        res.json({
          imageUrl: `data:${mimeType};base64,${base64Str}`,
          prompt: cleanPrompt,
          source: 'neural',
        });
        return;
      }
    } catch (fetchErr) {
      console.warn('[ERROREN Image API] Direct fetch buffer failed, falling back to URL:', fetchErr);
    }

    // Direct URL fallback if fetch times out
    res.json({
      imageUrl: neuralUrl,
      prompt: cleanPrompt,
      source: 'neural_url',
    });
  } catch (finalErr: any) {
    console.error('[ERROREN Image API] All image generation methods failed:', finalErr);
    res.status(500).json({
      error: finalErr?.message || 'Could not generate image. Please try a different prompt.',
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
