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
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Production-ready CORS for Appwrite hosting & decoupled deployment
app.use((req: Request, res: Response, next) => {
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

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
// gemini-3.8-flash is the primary recommended model.
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
];

// Circuit breaker to avoid spamming failed Gemini requests when project quota or permissions are denied
let geminiQuotaOrAccessBlocked = false;
let geminiNextCheckTime = 0;

function canAttemptGemini(): boolean {
  if (!process.env.GEMINI_API_KEY) return false;
  if (geminiQuotaOrAccessBlocked) {
    if (Date.now() > geminiNextCheckTime) {
      // Cooldown elapsed; allow a single test probe
      return true;
    }
    return false;
  }
  return true;
}

function handleGeminiFailure(err: any): void {
  const errMsg = String(err?.message || err || '');
  const is403 = errMsg.includes('403') || errMsg.includes('PERMISSION_DENIED') || errMsg.includes('denied access');
  const is429 = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota');

  if (is403 || is429) {
    geminiQuotaOrAccessBlocked = true;
    // 10-minute cooldown before probing again
    geminiNextCheckTime = Date.now() + 10 * 60 * 1000;
  }
}

async function streamNeuralFallback(
  messages: any[],
  systemPrompt: string | undefined,
  res: Response,
  isDisconnected: () => boolean
): Promise<boolean> {
  try {
    const neuralMessages = [
      {
        role: 'system',
        content: `${systemPrompt || DEFAULT_SYSTEM_INSTRUCTION}\n\nCRITICAL MULTI-LINGUAL DIRECTIVE:
1. You are ERROREN AI, a world-class, highly knowledgeable synthetic intelligence.
2. You understand and speak ALL languages with native fluency: English, Roman Urdu (e.g. "aap kaise hain", "mjy code samjhao", "kya haal hai"), Urdu (اردو), Hindi, Arabic, Spanish, etc.
3. ALWAYS reply in the EXACT language and script that the user spoke. If the user writes in Roman Urdu, reply fluently in natural, respectful Roman Urdu. If in English, reply in English. If in Urdu script, reply in Urdu.
4. Provide complete, accurate, technically sound, and deeply helpful answers with clean Markdown formatting, bullet points, and syntax-highlighted code blocks.`,
      },
      ...messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text || m.content || '',
      })),
    ];

    const neuralRes = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: neuralMessages,
        model: 'openai',
        seed: 42,
      }),
    });

    if (neuralRes.ok) {
      const fullText = await neuralRes.text();
      if (fullText && fullText.trim()) {
        const words = fullText.split(/(\s+)/);
        let buffer = '';
        for (let i = 0; i < words.length; i++) {
          if (isDisconnected()) break;
          buffer += words[i];
          if (i % 3 === 0 || i === words.length - 1) {
            res.write(`data: ${JSON.stringify({ chunk: buffer })}\n\n`);
            (res as any).flush?.();
            buffer = '';
            await new Promise(r => setTimeout(r, 20));
          }
        }
        return true;
      }
    }
  } catch {
    // Graceful fallback
  }
  return false;
}

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
    if (canAttemptGemini()) {
      try {
        const ai = getGeminiClient();
        for (const modelName of CANDIDATE_MODELS) {
          if (clientDisconnected) break;

          try {
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
              break;
            }
          } catch (err: any) {
            handleGeminiFailure(err);
            break;
          }
        }
      } catch (clientErr: any) {
        handleGeminiFailure(clientErr);
      }
    }

    // Seamlessly stream via Multi-Lingual Neural Engine if Gemini is unavailable, denied, or quota-limited
    if (!streamSucceeded && !clientDisconnected) {
      streamSucceeded = await streamNeuralFallback(
        messages,
        systemPrompt,
        res,
        () => clientDisconnected
      );
    }

    if (streamSucceeded) {
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // If stream did not succeed
    const userMessage =
      'Main is waqt connection issue me hoon. Baraye meherbani thori dair baad dobara koshish karein ya naya sawal poochein.';
    res.write(`data: ${JSON.stringify({ error: userMessage })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
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
    if (canAttemptGemini()) {
      try {
        const ai = getGeminiClient();
        for (const modelName of CANDIDATE_MODELS) {
          try {
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
            handleGeminiFailure(err);
            break;
          }
        }
      } catch (err) {
        handleGeminiFailure(err);
      }
    }

    // Multi-lingual Neural engine fallback
    try {
      const neuralMessages = [
        {
          role: 'system',
          content: `${systemPrompt || DEFAULT_SYSTEM_INSTRUCTION}\n\nCRITICAL MULTI-LINGUAL DIRECTIVE:
1. You are ERROREN AI, an advanced AI Assistant.
2. You understand all languages fluently: English, Roman Urdu, Urdu (اردو), Hindi, Arabic, Spanish, French, German, Chinese, etc.
3. ALWAYS reply in the exact language the user wrote in (Roman Urdu for Roman Urdu, Urdu for Urdu, English for English).
4. Provide comprehensive, accurate, high-quality answers with clean Markdown formatting, bullet points, and code blocks.`,
        },
        ...messages.map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.text || m.content || '',
        })),
      ];

      const neuralRes = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: neuralMessages,
          model: 'openai',
          seed: 42,
        }),
      });

      if (neuralRes.ok) {
        const text = await neuralRes.text();
        if (text && text.trim()) {
          res.json({ text: text.trim() });
          return;
        }
      }
    } catch {
      // Fallback failed
    }

    res.status(503).json({
      error: 'AI service currently experiencing high traffic. Please try again in a few moments.',
    });
  } catch (error: any) {
    res.status(500).json({
      error: error?.message || 'Failed to generate response.',
    });
  }
});

// Helper to translate & optimize multi-lingual / Roman Urdu image prompts
function enhanceImagePrompt(prompt: string): string {
  let p = prompt.trim();
  const lower = p.toLowerCase();

  const isRomanUrdu =
    /mjy|mujhe|mujhy|mujy|chay|chahiye|isky|iski|iske|bna|bana|tasveer|tasweer|bagh|gari|gaari/i.test(lower);

  if (isRomanUrdu) {
    let t = p;
    // Map common Roman Urdu phrases
    t = t.replace(/mjy|mujhe|mujhy|mujy/gi, '');
    t = t.replace(/\bik\b|\baik\b|\bek\b/gi, 'a');
    t = t.replace(/ki photo chay|ki photo chahiye|ki image chay|ki image chahiye|\bchahiye\b|\bchay\b/gi, '');
    t = t.replace(/\bjo ik\b|\bjo ek\b|\bjo\b/gi, 'in');
    t = t.replace(/garden my ho|garden me ho|bagh me ho|garden mai ho/gi, 'in a lush green garden');
    t = t.replace(/isky sath|iski sath|iske sath/gi, 'and next to it');
    t = t.replace(/ik bike ho|ek bike ho|\bbike ho\b/gi, 'a stylish motorbike');
    t = t.replace(/gari|gaari/gi, 'car');
    t = t.replace(/tasveer|tasweer|photo|image|picture/gi, '');
    t = t.replace(/bana k do|bna k do|bna do|bana do|banao|bnayo|create karo|generate karo/gi, '');
    t = t.replace(/\s+/g, ' ').trim();

    if (t.length > 2) {
      return `${t}, photorealistic, vibrant cinematic lighting, highly detailed 4k`;
    }
  }

  return p;
}

// Image Generation & Editing API Endpoint
app.post('/api/generate-image', async (req: Request, res: Response): Promise<void> => {
  const { prompt, image, aspectRatio } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ error: 'A prompt describing the image to generate or edit is required.' });
    return;
  }

  const cleanPrompt = prompt.trim();
  const effectivePrompt = enhanceImagePrompt(cleanPrompt);
  console.log(`[ERROREN Image API] Request received for prompt: "${cleanPrompt}", effective: "${effectivePrompt}", hasImage: ${!!image?.data}`);

  // 1. First attempt with Gemini image generation model if key is configured and available
  if (canAttemptGemini()) {
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
          text: effectivePrompt || 'Edit and transform this image according to user instructions.',
        });
      } else {
        parts.push({ text: effectivePrompt });
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
          const dataUri = `data:${mime};base64,${b64}`;
          res.json({
            url: dataUri,
            imageUrl: dataUri,
            prompt: cleanPrompt,
            revisedPrompt: effectivePrompt !== cleanPrompt ? effectivePrompt : undefined,
            source: 'gemini',
          });
          return;
        }
      }
    } catch (geminiErr: any) {
      handleGeminiFailure(geminiErr);
    }
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
    const encodedPrompt = encodeURIComponent(effectivePrompt);
    const neuralUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

    console.log(`[ERROREN Image API] Generating via Neural Engine: ${neuralUrl}`);

    // Try fetching and converting to base64 for persistent, self-contained rendering
    try {
      const response = await fetch(neuralUrl);
      if (response.ok) {
        const arrayBuf = await response.arrayBuffer();
        const base64Str = Buffer.from(arrayBuf).toString('base64');
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        const dataUri = `data:${mimeType};base64,${base64Str}`;
        res.json({
          url: dataUri,
          imageUrl: dataUri,
          prompt: cleanPrompt,
          revisedPrompt: effectivePrompt !== cleanPrompt ? effectivePrompt : undefined,
          source: 'neural',
        });
        return;
      }
    } catch (fetchErr) {
      console.warn('[ERROREN Image API] Direct fetch buffer failed, falling back to URL:', fetchErr);
    }

    // Direct URL fallback if fetch times out
    res.json({
      url: neuralUrl,
      imageUrl: neuralUrl,
      prompt: cleanPrompt,
      revisedPrompt: effectivePrompt !== cleanPrompt ? effectivePrompt : undefined,
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
