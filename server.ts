import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

// Safe directory resolution across both ESM (tsx dev) and CJS (production bundle)
const getAppDir = () => {
  if (typeof __dirname !== 'undefined' && __dirname) {
    return __dirname;
  }
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).url) {
      return path.dirname(fileURLToPath((import.meta as any).url));
    }
  } catch {
    // Fallback to current working directory
  }
  return process.cwd();
};

const appDir = getAppDir();

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

// Helper to clean Roman Urdu stopwords while strictly preserving user intent and attributes
function cleanRomanUrduImagePrompt(prompt: string): string {
  let p = prompt.trim();
  let t = p;

  // Remove polite request phrases without touching the actual subject or colors
  t = t.replace(/\b(mjy|mujhe|mujhy|mujy|humko|humein|ap)\b/gi, '');
  t = t.replace(/\b(ik|aik|ek)\b/gi, 'a');
  t = t.replace(/\b(ki|k)\s+(photo|image|tasveer|tasweer|picture|pic)\s+(chay|chahiye|bana\s*k\s*do|bna\s*k\s*do|bna\s*do|bana\s*do|banao|bnayo|create\s*karo|generate\s*karo)\b/gi, '');
  t = t.replace(/\b(ki photo chay|ki photo chahiye|ki image chay|ki image chahiye|chahiye|chay)\b/gi, '');
  t = t.replace(/\b(tasveer|tasweer|photo|image|picture|pic)\s+(bana\s*k\s*do|bna\s*k\s*do|bna\s*do|bana\s*do|banao|bnayo|create\s*karo|generate\s*karo)\b/gi, '');
  t = t.replace(/\b(bana\s*k\s*do|bna\s*k\s*do|bna\s*do|bana\s*do|banao|bnayo|create\s*karo|generate\s*karo|kardo|krdo|kar\s*do|kr\s*do|dikhao|dikhaye)\b/gi, '');
  t = t.replace(/\b(ki|k)\s+(photo|image|tasveer|tasweer|pic)\b/gi, '');
  t = t.replace(/\b(photo|image|tasveer|tasweer|pic)\b/gi, '');

  const translations: Array<[RegExp, string]> = [
    [/\b(riyal|asli|original)\b/gi, 'real authentic'],
    [/\b(gari|gaari)\b/gi, 'car'],
    [/\b(billi|mano)\b/gi, 'cat'],
    [/\b(kutta|kutte)\b/gi, 'dog'],
    [/\b(ghora|ghode)\b/gi, 'horse'],
    [/\b(sher|babbar sher)\b/gi, 'lion'],
    [/\b(cheeta)\b/gi, 'tiger'],
    [/\b(parinda|parinday|chiriya)\b/gi, 'bird'],
    [/\b(machli|machlian)\b/gi, 'fish'],
    [/\b(larka|larke|munda)\b/gi, 'boy'],
    [/\b(larki|larkiyan|kudi)\b/gi, 'girl'],
    [/\b(admi|aadmi|mard)\b/gi, 'man'],
    [/\b(aurat|khatoon)\b/gi, 'woman'],
    [/\b(bacha|bache)\b/gi, 'child'],
    [/\b(pahar|pahad)\b/gi, 'mountain'],
    [/\b(darya|nadi)\b/gi, 'river'],
    [/\b(samandar|samundar)\b/gi, 'ocean sea'],
    [/\b(jheel)\b/gi, 'lake'],
    [/\b(darakht|perh|ped)\b/gi, 'tree'],
    [/\b(jungle|jangal)\b/gi, 'forest'],
    [/\b(bagh|bageecha)\b/gi, 'garden'],
    [/\b(phool|gulab)\b/gi, 'flower rose'],
    [/\b(sarak)\b/gi, 'road'],
    [/\b(shehar)\b/gi, 'city'],
    [/\b(gaon|dehat)\b/gi, 'village'],
    [/\b(ghar|makan)\b/gi, 'house'],
    [/\b(masjid)\b/gi, 'mosque'],
    [/\b(asman|aasman)\b/gi, 'sky'],
    [/\b(suraj)\b/gi, 'sun'],
    [/\b(chand)\b/gi, 'moon'],
    [/\b(sitare|taare)\b/gi, 'stars'],
    [/\b(badal)\b/gi, 'clouds'],
    [/\b(barish)\b/gi, 'rain'],
    [/\b(baraf|barf)\b/gi, 'snow'],
    [/\b(lal|surkh)\b/gi, 'red'],
    [/\b(neela|neeli|neele)\b/gi, 'blue'],
    [/\b(hara|hari|hare|sabz)\b/gi, 'green'],
    [/\b(peela|peeli|zard)\b/gi, 'yellow'],
    [/\b(kala|kali|siyah)\b/gi, 'black'],
    [/\b(safaid|safed|chitta)\b/gi, 'white'],
    [/\b(gulabi)\b/gi, 'pink'],
    [/\b(sunehri|golden)\b/gi, 'golden'],
    [/\b(raat)\b/gi, 'night'],
    [/\b(din)\b/gi, 'daytime'],
    [/\b(subah)\b/gi, 'morning sunrise'],
    [/\b(shaam)\b/gi, 'sunset golden hour'],
    [/\b(khubsurat)\b/gi, 'beautiful'],
    [/\b(motorcycle|bike)\b/gi, 'motorcycle'],
    [/\b(jahaz|tayyara)\b/gi, 'airplane'],
    [/\b(chai)\b/gi, 'tea'],
    [/\b(pani)\b/gi, 'water'],
    [/\b(pe|par)\b/gi, 'on'],
    [/\b(mein|me)\b/gi, 'in'],
    [/\b(k sath|ke sath)\b/gi, 'with'],
    [/\b(samnay)\b/gi, 'in front of'],
    [/\b(pichay)\b/gi, 'behind'],
  ];

  for (const [regex, rep] of translations) {
    t = t.replace(regex, rep);
  }

  t = t.replace(/\b(ki|ka|ke|k)\b/gi, '');
  t = t.replace(/\s+/g, ' ').trim();

  if (t.length > 2) {
    return t;
  }

  return p;
}

// Extract base64 image data from either inline data or URL
async function resolveImagePayload(imageInput: any): Promise<{ data: string; mimeType: string } | null> {
  if (!imageInput) return null;

  if (imageInput.data && imageInput.mimeType) {
    return {
      data: imageInput.data,
      mimeType: imageInput.mimeType,
    };
  }

  const url = imageInput.url || imageInput.previewUrl;
  if (!url || typeof url !== 'string') return null;

  // Data URI format: data:image/png;base64,xxxx
  if (url.startsWith('data:')) {
    const commaIdx = url.indexOf(',');
    if (commaIdx > -1) {
      const mimeMatch = url.match(/data:([^;]+);base64/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      const data = url.substring(commaIdx + 1);
      return { data, mimeType };
    }
  }

  // Remote HTTP(S) URL: fetch and convert to base64
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const arrayBuf = await response.arrayBuffer();
        const data = Buffer.from(arrayBuf).toString('base64');
        const mimeType = response.headers.get('content-type') || 'image/png';
        return { data, mimeType };
      }
    } catch (fetchErr) {
      console.warn('[ERROREN Image API] Remote image fetch failed:', fetchErr);
    }
  }

  return null;
}

// Unified Image Generation & Editing API Handler
async function handleImageGenerationRequest(req: Request, res: Response): Promise<void> {
  const { prompt, effectivePrompt, previousImagePrompt, image, mode, aspectRatio } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ error: 'A prompt describing the image to generate or edit is required.' });
    return;
  }

  const cleanPrompt = prompt.trim();
  const cleanedPrompt = cleanRomanUrduImagePrompt(cleanPrompt);
  const resolvedImage = await resolveImagePayload(image);
  const activeMode: 'generate' | 'edit' | 'reference' = mode || (resolvedImage ? 'edit' : 'generate');

  console.log(`[ERROREN Image API] Mode: ${activeMode} | Prompt: "${cleanPrompt}" | HasImage: ${!!resolvedImage}`);

  // Candidate Gemini Image Models
  const GEMINI_IMAGE_MODELS = [
    'gemini-3.1-flash-lite-image',
    'gemini-3.1-flash-image',
  ];

  // 1. Attempt using official Google Gemini GenAI SDK
  if (canAttemptGemini()) {
    try {
      const ai = getGeminiClient();

      for (const modelName of GEMINI_IMAGE_MODELS) {
        try {
          const parts: any[] = [];

          if (resolvedImage) {
            parts.push({
              inlineData: {
                data: resolvedImage.data,
                mimeType: resolvedImage.mimeType,
              },
            });

            if (activeMode === 'reference') {
              parts.push({
                text: `Use this reference image for visual aesthetic, color harmony, and artistic style. Generate a new original image with this description: ${cleanedPrompt}`,
              });
            } else {
              // Edit mode
              parts.push({
                text: `Carefully edit this image according to the instruction: "${cleanedPrompt}". IMPORTANT: Only modify what is explicitly asked. Preserve all other original subjects, identity, pose, clothing, composition, and colors from the source image.`,
              });
            }
          } else {
            // New image generation
            parts.push({
              text: cleanedPrompt,
            });
          }

          const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts } as any,
            config: {
              imageConfig: {
                aspectRatio: (aspectRatio as any) || '1:1',
              },
            },
          });

          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if ((part as any).inlineData) {
              const mime = (part as any).inlineData.mimeType || 'image/png';
              const b64 = (part as any).inlineData.data;
              const dataUri = `data:${mime};base64,${b64}`;

              res.json({
                url: dataUri,
                imageUrl: dataUri,
                prompt: cleanPrompt,
                revisedPrompt: cleanPrompt !== cleanedPrompt ? cleanedPrompt : undefined,
                mode: activeMode,
                aspectRatio: aspectRatio || '1:1',
                source: 'gemini',
              });
              return;
            }
          }
        } catch (modelErr: any) {
          console.warn(`[ERROREN Image API] Gemini model ${modelName} failed:`, modelErr?.message || modelErr);
          handleGeminiFailure(modelErr);
        }
      }
    } catch (geminiErr: any) {
      handleGeminiFailure(geminiErr);
    }
  }

  // 2. High-Fidelity Secondary Neural Engine Fallback
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
    } else if (safeAspect === '3:4') {
      width = 768;
      height = 1024;
    }

    // Compose visual neural prompt
    let neuralPromptText = effectivePrompt || cleanedPrompt;
    if (!effectivePrompt) {
      if (activeMode === 'edit' && previousImagePrompt) {
        neuralPromptText = `${previousImagePrompt}, with change: ${cleanedPrompt}, photorealistic authentic quality, 8k resolution`;
      } else if (activeMode === 'reference') {
        neuralPromptText = `in the visual artistic style and composition of reference, ${cleanedPrompt}, authentic masterpiece, highly detailed, 8k resolution`;
      } else {
        neuralPromptText = `${cleanedPrompt}, authentic photorealistic 8k photograph, raw capture, 35mm lens, natural lighting, high dynamic range, sharp focus`;
      }
    }

    const seed = Math.floor(Math.random() * 900000) + 100000;
    const encodedPrompt = encodeURIComponent(neuralPromptText);
    const neuralUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true`;

    console.log(`[ERROREN Image API] Rendering via Neural Engine (${activeMode}): ${neuralUrl}`);

    try {
      const response = await fetch(neuralUrl, { signal: AbortSignal.timeout(3500) });
      if (response.ok) {
        const arrayBuf = await response.arrayBuffer();
        const base64Str = Buffer.from(arrayBuf).toString('base64');
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        const dataUri = `data:${mimeType};base64,${base64Str}`;

        res.json({
          url: dataUri,
          imageUrl: dataUri,
          prompt: cleanPrompt,
          revisedPrompt: neuralPromptText !== cleanPrompt ? neuralPromptText : undefined,
          mode: activeMode,
          aspectRatio: safeAspect,
          source: 'neural',
        });
        return;
      }
    } catch (fetchErr) {
      console.warn('[ERROREN Image API] Direct buffer fetch timed out or failed, serving direct image URL');
    }

    // Direct URL fallback
    res.json({
      url: neuralUrl,
      imageUrl: neuralUrl,
      prompt: cleanPrompt,
      revisedPrompt: neuralPromptText !== cleanPrompt ? neuralPromptText : undefined,
      mode: activeMode,
      aspectRatio: safeAspect,
      source: 'neural_url',
    });
  } catch (finalErr: any) {
    console.error('[ERROREN Image API] All image generation methods failed:', finalErr);
    res.status(500).json({
      error: finalErr?.message || 'Could not generate image. Please try a different prompt.',
    });
  }
}

// Register image endpoints
app.post('/api/generate-image', handleImageGenerationRequest);
app.post('/api/image/generate', handleImageGenerationRequest);
app.post('/api/image/edit', handleImageGenerationRequest);

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const cwdDist = path.join(process.cwd(), 'dist');
    const localDist = path.join(appDir, 'dist');
    const distPath = fs.existsSync(cwdDist)
      ? cwdDist
      : fs.existsSync(localDist)
      ? localDist
      : appDir;

    console.log(`[ERROREN Production] Serving static frontend from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('ERROREN frontend dist not found. Please run npm run build.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ERROREN Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
