import { ChatMessage, MessageAttachment } from '../types';

export type ImageIntentType = 'none' | 'generate' | 'edit' | 'reference';

export interface ImageIntentResult {
  type: ImageIntentType;
  prompt: string;
  effectivePrompt?: string;
  sourceImage?: {
    url?: string;
    data?: string;
    mimeType?: string;
  };
  previousImagePrompt?: string;
  aspectRatio?: string;
}

// Patterns that strongly indicate a question/informational query rather than generation
const INFORMATIONAL_PREFIXES = [
  /^(what|why|how|who|where|when|which)\s+(is|are|was|were|do|does|did|can|could|should|would)/i,
  /^explain\s+/i,
  /^describe\s+/i,
  /^tell\s+me\s+(about|why|how|what)/i,
  /^can\s+you\s+(explain|tell|describe|clarify)/i,
  /^summarize\s+/i,
  /^write\s+(a\s+)?(code|script|essay|story|poem|paragraph|email|letter|summary)/i,
  /^how\s+to\s+/i,
  /^help\s+me\s+(with|understand|to)/i,
  /^debug\s+/i,
  /^solve\s+/i,
];

// Patterns for explicit new image creation
const GENERATION_PATTERNS = [
  // Slash commands
  /^\/(image|img|draw|photo|generate|paint|render)\b/i,

  // Direct verbs: draw, paint, sketch, illustrate (always visual)
  /^(draw|paint|sketch|illustrate)\s+(a\s+|an\s+|me\s+a\s+|us\s+a\s+)?/i,

  // Direct verbs + image noun
  /^(generate|create|make|produce)\s+(a\s+|an\s+|me\s+a\s+|us\s+a\s+)?(realistic\s+|cinematic\s+|photorealistic\s+|hyperrealistic\s+|4k\s+|high-res\s+|detailed\s+|vibrant\s+|cute\s+|scenic\s+|digital\s+|vintage\s+|anime\s+|oil\s+|watercolor\s+)*(image|photo|picture|graphic|illustration|painting|drawing|artwork|portrait|render|wallpaper|poster|scene|visual)\b/i,

  // "Generate a cute white cat...", "Generate a futuristic car..." (when not requesting code/text)
  /^(generate|render)\s+(a\s+|an\s+|me\s+a\s+)(?!(code|function|class|list|table|summary|report|essay|number|random|password|key|id|uuid|query|sql|api|response|sentence|paragraph|article)\b)/i,

  // "photo of", "picture of", "portrait of", "painting of" at start
  /^(photo|picture|portrait|painting|illustration|drawing|render|artwork|image)\s+of\b/i,

  // "generate an image of ...", "create a picture of ..." anywhere
  /\b(generate|create|make|draw|paint)\s+(a\s+|an\s+|me\s+a\s+)?(realistic\s+|cinematic\s+|photorealistic\s+)?(image|photo|picture|illustration|painting|drawing|portrait)\s+(of|showing|depicting|with)\b/i,

  // Roman Urdu & Urdu patterns
  /\b(photo|image|tasveer|tasweer|picture)\s+(bana\s*o?|bna\s*o?|bna\s*k\s*do|bana\s*k\s*do|bna\s*do|bana\s*do|chahiye|chay|create\s*karo|generate\s*karo)\b/i,
  /\b(mjy|mujhe|mujy|mujhy)\s+(ik\s+|ek\s+|aik\s+)?(photo|image|tasveer|tasweer|pic)\b/i,
];

// Patterns for reference image instructions
const REFERENCE_PATTERNS = [
  /\b(similar\s+to\s+this|like\s+this|based\s+on\s+this|inspired\s+by\s+this|use\s+this\s+as\s+(a\s+)?reference|reference\s+image|something\s+similar|in\s+the\s+style\s+of\s+this)\b/i,
  /\b(is\s+jaisi|is\s+jesi|is\s+tarah\s+ki|iski\s+tarah)\s+(photo|image|tasveer)?\b/i,
];

// Patterns for editing an existing or uploaded image
const EDIT_PATTERNS = [
  // Modifications to background/colors/subjects
  /\b(change|modify|replace|remove|delete|erase|add|put|insert|swap|turn|convert|transform|make|shift|adjust|retouch|filter|style)\b/i,
  /\b(background|foreground|color|sky|lighting|hair|clothes|outfit|face|person|object|weather)\b/i,
  /\b(make\s+it|turn\s+this\s+into|convert\s+this\s+to|change\s+the|remove\s+the|add\s+a|add\s+some|put\s+it\s+on|put\s+it\s+in)\b/i,
  /\b(keep\s+the\s+.*\s+but\s+change|anime\s+style|studio\s+photograph|cinematic\s+look|vintage\s+look|watercolor\s+style)\b/i,
  // Roman Urdu edit patterns
  /\b(color\s+change|background\s+badlo|hata\s*do|hatao|kardo|krdo|is\s+ko|isme|is\s+photo\s+ko|is\s+image\s+ko)\b/i,
];

// Conversational follow-up patterns when a previous image exists in chat
const FOLLOWUP_EDIT_PATTERNS = [
  /^make\s+it\s+([a-z0-9\s\-]+)/i,
  /^make\s+the\s+([a-z0-9\s\-]+)/i,
  /^change\s+(it|the|this)\s+([a-z0-9\s\-]+)/i,
  /^put\s+it\s+(on|in|at|under|behind|next\s+to)\s+([a-z0-9\s\-]+)/i,
  /^remove\s+(the|this|all)\s+([a-z0-9\s\-]+)/i,
  /^add\s+(a|an|some|more)\s+([a-z0-9\s\-]+)/i,
  /^turn\s+(it|this)\s+into\s+([a-z0-9\s\-]+)/i,
  /^now\s+(make|put|add|change|turn)\s+([a-z0-9\s\-]+)/i,
  /^(now\s+in\s+|in\s+)([a-z0-9\s\-]+)(style|lighting|theme|view)/i,
  /^(more|less)\s+(cinematic|realistic|vibrant|dark|bright|colorful|detailed)/i,
  /^keep\s+(the|it)\s+([a-z0-9\s\-]+)\s+but\s+([a-z0-9\s\-]+)/i,
  // Roman Urdu follow ups
  /^(isko|is\s+ko|isey)\s+([a-z0-9\s\-]+)\s*(kardo|krdo|bana\s*do|karo)/i,
  /^(background|color|rang|sky)\s+([a-z0-9\s\-]+)\s*(kardo|badal\s*do|change\s*kardo)/i,
];

/**
 * Extracts aspect ratio from prompt if explicitly requested (e.g. "16:9", "widescreen", "portrait", "square")
 */
export function extractAspectRatio(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('16:9') || t.includes('widescreen') || t.includes('landscape') || t.includes('horizontal') || t.includes('banner')) {
    return '16:9';
  }
  if (t.includes('9:16') || t.includes('vertical') || t.includes('story') || t.includes('reel') || t.includes('tiktok')) {
    return '9:16';
  }
  if (t.includes('4:3')) {
    return '4:3';
  }
  if (t.includes('3:4') || t.includes('portrait')) {
    return '3:4';
  }
  return '1:1';
}

/**
 * Finds the most recent image in the conversation history (either a generated image or user attachment)
 */
export function findLatestConversationImage(messages: ChatMessage[]): {
  url?: string;
  data?: string;
  mimeType?: string;
  prompt?: string;
} | null {
  if (!messages || messages.length === 0) return null;

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === 'assistant' && msg.generatedImage?.url) {
      return {
        url: msg.generatedImage.url,
        prompt: msg.generatedImage.prompt,
      };
    }
    if (msg.role === 'user' && msg.attachment?.previewUrl) {
      return {
        url: msg.attachment.previewUrl,
        data: msg.attachment.data,
        mimeType: msg.attachment.mimeType,
        prompt: msg.content,
      };
    }
  }

  return null;
}

/**
 * Roman Urdu and natural prompt translation and enhancement
 * Ensures "original riyal type" photorealism while faithfully preserving user intent ("same prompt")
 */
export function cleanAndEnhancePrompt(
  rawPrompt: string,
  mode: 'generate' | 'edit' | 'reference' = 'generate',
  previousImagePrompt?: string
): { cleanSubject: string; enhancedPrompt: string; isRealPhotoRequested: boolean } {
  let text = (rawPrompt || '').trim();

  // Strip command prefixes
  text = text.replace(/^\/(image|img|draw|photo|generate|paint|render)\s*/i, '');
  text = text.replace(
    /^(generate|create|make|draw|paint|produce|render|show me)\s+(a\s+|an\s+|me\s+a\s+|us\s+a\s+)?(realistic\s+|cinematic\s+|photorealistic\s+|hyperrealistic\s+|4k\s+|high-res\s+|detailed\s+|vibrant\s+)*(image|photo|picture|graphic|illustration|painting|drawing|artwork|portrait|render|wallpaper)\s+(of|showing|depicting|with)?\s*/i,
    ''
  );
  text = text.replace(/^(photo|picture|portrait|painting|illustration|drawing|render|artwork|image)\s+of\s*/i, '');

  const isRealPhotoRequested = /\b(photo|photograph|tasveer|tasweer|picture|pic|camera|real|riyal|asli|original|realistic|photorealistic|hyperrealistic|portrait|dslr|shot)\b/i.test(
    rawPrompt
  );
  const isStylizedRequested = /\b(anime|cartoon|manga|3d render|animation|pixel art|sketch|line art|watercolor|oil painting|drawing|illustration|vector|cyberpunk|fantasy|chibi)\b/i.test(
    rawPrompt
  );

  // Roman Urdu stopword cleaning and dictionary mapping
  let cleaned = text;

  // 1. Remove polite requests
  cleaned = cleaned.replace(/\b(mjy|mujhe|mujhy|mujy|humko|humein|ap)\b/gi, '');
  cleaned = cleaned.replace(/\b(ik|aik|ek)\b/gi, 'a');
  cleaned = cleaned.replace(/\b(chay|chahiye|chahie|chahye|chaye)\b/gi, '');
  cleaned = cleaned.replace(
    /\b(bana\s*k\s*do|bna\s*k\s*do|bana\s*do|bna\s*do|banao|bnao|bnayo|bana\s*k\s*dena|kardo|krdo|kar\s*do|kr\s*do|kariye|kijiye|dikhao|dikhaye|dikhado)\b/gi,
    ''
  );
  cleaned = cleaned.replace(/\b(ki|k)\s+(photo|image|tasveer|tasweer|picture|pic)\b/gi, '');
  cleaned = cleaned.replace(/\b(photo|image|tasveer|tasweer|picture|pic)\b/gi, '');

  // 2. Vocabulary translations for subjects and attributes
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
    cleaned = cleaned.replace(regex, rep);
  }

  // Remove trailing conjunctions or leftover particles
  cleaned = cleaned.replace(/\b(ki|ka|ke|k)\b/gi, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // If cleaning resulted in an empty string, fallback to original stripped
  const cleanSubject = cleaned.length >= 2 ? cleaned : text;

  // Build the enhanced prompt
  let enhancedPrompt = cleanSubject;

  if (mode === 'edit' && previousImagePrompt) {
    enhancedPrompt = `${previousImagePrompt}, with change: ${cleanSubject}, photorealistic authentic quality, highly detailed`;
  } else if (mode === 'reference') {
    enhancedPrompt = `in the visual composition and style of reference, ${cleanSubject}, authentic masterpiece, 8k resolution`;
  } else {
    if (isStylizedRequested) {
      enhancedPrompt = `${cleanSubject}, high quality, crisp details`;
    } else {
      // Default & "original riyal type": Photorealistic authentic photography
      enhancedPrompt = `${cleanSubject}, authentic photorealistic 8k photograph, raw capture, 35mm lens, natural lighting, high dynamic range, sharp focus`;
    }
  }

  return {
    cleanSubject,
    enhancedPrompt,
    isRealPhotoRequested: isRealPhotoRequested || !isStylizedRequested,
  };
}

/**
 * Core natural language classifier for chat messages
 */
export function classifyImageIntent(
  text: string,
  attachment: MessageAttachment | null | undefined,
  conversationMessages: ChatMessage[] = []
): ImageIntentResult {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const aspectRatio = extractAspectRatio(trimmed);

  // Clean slash commands from prompt
  const cleanPrompt = trimmed.replace(/^\/(image|img|draw|photo|generate|paint|render)\s*/i, '').trim();

  // CASE 1: User attached an image with this message
  if (attachment) {
    // Check if user is asking a purely analytical or informational question about the image
    const isQuestion = INFORMATIONAL_PREFIXES.some(re => re.test(trimmed)) &&
      (lower.includes('what is') || lower.includes('describe') || lower.includes('explain') || lower.includes('identify') || lower.includes('read'));

    if (isQuestion) {
      return {
        type: 'none',
        prompt: trimmed,
      };
    }

    // Check for reference request
    const isReference = REFERENCE_PATTERNS.some(re => re.test(trimmed));
    if (isReference) {
      const { cleanSubject, enhancedPrompt } = cleanAndEnhancePrompt(cleanPrompt || 'Generate a new image inspired by this reference', 'reference');
      return {
        type: 'reference',
        prompt: cleanSubject,
        effectivePrompt: enhancedPrompt,
        sourceImage: {
          data: attachment.data,
          mimeType: attachment.mimeType,
          url: attachment.previewUrl,
        },
        aspectRatio,
      };
    }

    // If attachment is present and text contains editing instruction or style change
    const { cleanSubject, enhancedPrompt } = cleanAndEnhancePrompt(cleanPrompt || 'Edit and enhance this image', 'edit');
    return {
      type: 'edit',
      prompt: cleanSubject,
      effectivePrompt: enhancedPrompt,
      sourceImage: {
        data: attachment.data,
        mimeType: attachment.mimeType,
        url: attachment.previewUrl,
      },
      aspectRatio,
    };
  }

  // CASE 2: No attachment in current message. Check for explicit image generation
  const isExplicitGeneration = GENERATION_PATTERNS.some(re => re.test(trimmed));
  if (isExplicitGeneration) {
    // Double check: if it is an informational question like "What is the history of photography?" do NOT trigger
    const isGeneralInfo = INFORMATIONAL_PREFIXES.some(re => re.test(trimmed)) &&
      !trimmed.match(/\b(generate|create|make|draw|paint)\s+(a\s+|an\s+)?(photo|image|picture)\b/i);

    if (!isGeneralInfo) {
      const { cleanSubject, enhancedPrompt } = cleanAndEnhancePrompt(cleanPrompt || trimmed, 'generate');
      return {
        type: 'generate',
        prompt: cleanSubject,
        effectivePrompt: enhancedPrompt,
        aspectRatio,
      };
    }
  }

  // CASE 3: Check for conversational follow-up edit on an existing image in chat
  const latestImage = findLatestConversationImage(conversationMessages);
  if (latestImage) {
    const isFollowupEdit = FOLLOWUP_EDIT_PATTERNS.some(re => re.test(trimmed)) ||
      (EDIT_PATTERNS.some(re => re.test(trimmed)) && trimmed.split(/\s+/).length <= 15 && !INFORMATIONAL_PREFIXES.some(re => re.test(trimmed)));

    if (isFollowupEdit) {
      const prevPrompt = latestImage.prompt || '';
      const { cleanSubject, enhancedPrompt } = cleanAndEnhancePrompt(trimmed, 'edit', prevPrompt);

      return {
        type: 'edit',
        prompt: cleanSubject,
        effectivePrompt: enhancedPrompt,
        previousImagePrompt: prevPrompt,
        sourceImage: {
          url: latestImage.url,
          data: latestImage.data,
          mimeType: latestImage.mimeType,
        },
        aspectRatio,
      };
    }
  }

  // DEFAULT: Normal text chat
  return {
    type: 'none',
    prompt: trimmed,
  };
}
