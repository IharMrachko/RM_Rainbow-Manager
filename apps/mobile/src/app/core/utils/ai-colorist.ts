import { marked } from 'marked';
import { AiChatExchange } from '../services/ai-chat-history.service';

export type AiColoristScenario =
  | 'season'
  | 'wardrobe'
  | 'makeup'
  | 'avoid'
  | 'color-check'
  | 'palette-board'
  | 'outfit-look';

const RU_SCENARIOS: Record<AiColoristScenario, string> = {
  season:
    'Проанализируй приложенное фото и определи наиболее вероятные сезоны цветотипа. Сравни минимум два кандидата и объясни вывод через температуру, контраст, яркость и глубину.',
  wardrobe:
    'Составь рекомендации по гардеробу: базовые и акцентные цвета, удачные сочетания и 3 готовых образа. Если цветотип неизвестен, сначала задай уточняющий вопрос.',
  makeup:
    'Подбери рекомендации по макияжу: тон, румяна, губы, тени и металл украшений. Учитывай известный из диалога цветотип.',
  avoid:
    'Объясни, какие цвета могут быть менее удачными для указанного цветотипа, чем их заменить и как носить их вдали от лица.',
  'color-check':
    'Оцени цвет или вещь на фото относительно известного цветотипа. Дай вердикт: подходит, допустимо или лучше заменить, и предложи ближайшую альтернативу.',
  'palette-board':
    'Нарисуй аккуратную палитру-борд для моего цветотипа: 8–12 swatches с HEX-подписями, разделы база / акценты / избегать, чистый fashion lookbook стиль.',
  'outfit-look':
    'Нарисуй реалистичный капсульный образ (full-body outfit) в цветах моего цветотипа: база + акцент, нейтральный фон, без логотипов и текста на одежде.',
};

const EN_SCENARIOS: Record<AiColoristScenario, string> = {
  season:
    'Analyze the attached photo and identify the most likely color seasons. Compare at least two candidates and explain the result through temperature, contrast, chroma, and depth.',
  wardrobe:
    'Create wardrobe recommendations: neutrals, accent colors, combinations, and 3 complete outfits. If the season is unknown, ask one clarifying question first.',
  makeup:
    'Recommend makeup colors for complexion, blush, lips, eyes, and jewelry metal using the season established in this conversation.',
  avoid:
    'Explain which colors may be less flattering for the stated season, what to replace them with, and how to wear them away from the face.',
  'color-check':
    'Evaluate the color or garment in the photo against the established season. Return: match, near match, or replace, with the closest alternative.',
  'palette-board':
    'Generate a clean palette board for my color season: 8–12 swatches with HEX labels, sections for neutrals / accents / avoid, fashion lookbook style.',
  'outfit-look':
    'Generate a realistic full-body capsule outfit in my season colors: neutrals plus one accent, plain background, no logos or text on clothing.',
};

const IMAGE_SCENARIOS = new Set<AiColoristScenario>(['palette-board', 'outfit-look']);

const IMAGE_INTENT_RE =
  /(^|[^\p{L}\p{N}_])(нарисуй|нарисовать|сгенерируй|сгенерировать|создай\s+(картинк|изображен|борд|moodboard|палитр)|moodboard|palette\s*board|outfit\s*look|draw|generate\s+(an?\s+)?(image|picture|outfit|palette)|create\s+(an?\s+)?(image|picture|outfit|palette)|визуализируй|визуализация)(?=$|[^\p{L}\p{N}_])/iu;

export function scenarioPrompt(
  scenario: AiColoristScenario,
  language: 'en' | 'ru',
): string {
  return language === 'en' ? EN_SCENARIOS[scenario] : RU_SCENARIOS[scenario];
}

export function isImageScenario(scenario: AiColoristScenario): boolean {
  return IMAGE_SCENARIOS.has(scenario);
}

export function detectsImageIntent(text: string, scenario?: AiColoristScenario | null): boolean {
  if (scenario && isImageScenario(scenario)) {
    return true;
  }
  return IMAGE_INTENT_RE.test(String(text || '').trim());
}

export function buildAiColoristRequest(
  language: 'en' | 'ru',
  exchanges: AiChatExchange[],
  currentQuestion: string,
): string {
  const isEnglish = language === 'en';
  const instruction = isEnglish
    ? `You are Rainbow Manager's professional personal color analyst. Be practical, respectful, and transparent about uncertainty. A photo can suggest a season but cannot prove skin properties under uncontrolled lighting. Never make medical or identity claims. Use concise Markdown with: conclusion, evidence, color recommendations (include HEX when useful), and next step. Reply in English.`
    : `Ты профессиональный колорист Rainbow Manager. Отвечай практично, уважительно и честно обозначай неопределённость. Фото позволяет предположить сезон, но не доказывает свойства внешности при неконтролируемом освещении. Не делай медицинских выводов и выводов о личности. Используй компактный Markdown со структурой: вывод, аргументы, рекомендации цветов (с HEX, когда уместно) и следующий шаг. Отвечай на русском языке.`;
  const history = exchanges
    .filter((item) => item.state === 'ready' && item.answerMarkdown)
    .slice(-6)
    .map(
      (item) =>
        `${isEnglish ? 'User' : 'Пользователь'}: ${item.ask.slice(0, 1200)}\n${
          isEnglish ? 'Assistant' : 'Ассистент'
        }: ${(item.answerMarkdown || '').slice(0, 2400)}`,
    )
    .join('\n\n');
  const historyBlock = history
    ? `${isEnglish ? 'Conversation context' : 'Контекст диалога'}:\n${history}\n\n`
    : '';
  return `${instruction}\n\n${historyBlock}${
    isEnglish ? 'Current request' : 'Текущий запрос'
  }: ${currentQuestion}`;
}

export function buildAiImageRequest(
  language: 'en' | 'ru',
  exchanges: AiChatExchange[],
  currentQuestion: string,
): string {
  const isEnglish = language === 'en';
  const seasonHint = extractSeasonHint(exchanges, language);
  const instruction = isEnglish
    ? `You are Rainbow Manager's visual colorist assistant. Generate one polished fashion/color image that helps a client understand their season. Prefer clean lookbook styling, accurate color relationships, and readable swatches when showing a palette. Include a short caption with HEX codes when useful. Do not refuse with "paste into another generator" — you can generate the image directly. If the current request is a short follow-up, treat it as a refinement of the previous visual brief from conversation context: keep season, palette, framing, and subject unless the user clearly changes them. Season context: ${
        seasonHint || 'unknown — infer carefully from the request'
      }. Reply in English.`
    : `Ты визуальный ассистент-колорист Rainbow Manager. Сгенерируй одно аккуратное fashion/color изображение, которое помогает клиенту понять свой сезон. Предпочитай чистый lookbook-стиль, точные цветовые отношения и читаемые свотчи для палитры. Добавь короткий caption с HEX, когда уместно. Не отказывайся советом «вставьте промпт в другой генератор» — ты умеешь создать изображение сам. Если текущий запрос — короткое уточнение, считай его правкой предыдущего визуального брифа из контекста диалога: сохрани сезон, палитру, кадр и сюжет, если пользователь явно их не менял. Контекст сезона: ${
        seasonHint || 'неизвестен — аккуратно выведи из запроса'
      }. Отвечай на русском.`;
  const history = exchanges
    .filter((item) => item.state === 'ready' && item.answerMarkdown)
    .slice(-4)
    .map(
      (item) =>
        `${isEnglish ? 'User' : 'Пользователь'}: ${item.ask.slice(0, 800)}\n${
          isEnglish ? 'Assistant' : 'Ассистент'
        }: ${(item.answerMarkdown || '').slice(0, 600)}`,
    )
    .join('\n\n');
  const historyBlock = history
    ? `${isEnglish ? 'Conversation context' : 'Контекст диалога'}:\n${history}\n\n`
    : '';
  return `${instruction}\n\n${historyBlock}${isEnglish ? 'Request' : 'Запрос'}: ${currentQuestion}`;
}

export function safeAiMarkdownHtml(markdown: string): string {
  const raw = marked.parse(markdown, { async: false }) as string;
  const parsed = new DOMParser().parseFromString(raw, 'text/html');
  return Array.from(parsed.body.childNodes)
    .map((node) => sanitizeNode(node))
    .join('');
}

export function appendAiRecommendationHtml(
  existingHtml: string,
  markdown: string,
  heading: string,
  imageDataUrls: string[] = [],
): string {
  const current = existingHtml.trim() || '<p><br></p>';
  const images = imageDataUrls
    .filter((src) => /^data:image\//i.test(src) || /^https?:\/\//i.test(src))
    .map(
      (src) =>
        `<p><img src="${escapeAttr(src)}" alt="" data-lb-rot="0" style="width:100%;max-width:100%;height:auto;display:block;margin:0;float:none;border-radius:12px;" /></p>`,
    )
    .join('');
  return `${current}<h2>${escapeHtml(heading)}</h2>${safeAiMarkdownHtml(
    markdown || '',
  )}${images}<p><br></p>`;
}

function extractSeasonHint(exchanges: AiChatExchange[], language: 'en' | 'ru'): string {
  const blob = exchanges
    .slice(-6)
    .map((item) => `${item.ask}\n${item.answerMarkdown || ''}`)
    .join('\n')
    .toLowerCase();
  const seasons =
    language === 'en'
      ? [
          'soft summer',
          'cool summer',
          'light summer',
          'dark autumn',
          'soft autumn',
          'warm autumn',
          'light spring',
          'bright spring',
          'warm spring',
          'dark winter',
          'cool winter',
          'bright winter',
        ]
      : [
          'мягкое лето',
          'холодное лето',
          'светлое лето',
          'тёмная осень',
          'мягкая осень',
          'тёплая осень',
          'светлая весна',
          'яркая весна',
          'тёплая весна',
          'тёмная зима',
          'холодная зима',
          'яркая зима',
        ];
  return seasons.find((name) => blob.includes(name)) || '';
}

function sanitizeNode(node: Node, skipSwatches = false): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || '';
    return skipSwatches ? escapeHtml(text) : injectColorSwatches(text);
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }
  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();
  if (tag === 'script' || tag === 'style' || tag === 'iframe' || tag === 'object') {
    return '';
  }

  // AI often wraps a lone HEX in backticks → <code>#aabbcc</code>. Still show a swatch.
  if (!skipSwatches && tag === 'code') {
    const plain = (element.textContent || '').trim();
    const css = parseColorToken(plain);
    if (css) {
      return `<code>${escapeHtml(plain)}</code>${swatchHtml(plain, css)}`;
    }
  }

  const nestedSkip = skipSwatches || tag === 'code' || tag === 'pre';
  const children = Array.from(element.childNodes)
    .map((child) => sanitizeNode(child, nestedSkip))
    .join('');
  const normalized = tag === 'h1' ? 'h2' : tag;
  const allowed = new Set([
    'p',
    'h2',
    'h3',
    'strong',
    'b',
    'em',
    'i',
    'ul',
    'ol',
    'li',
    'blockquote',
    'pre',
    'code',
    'br',
  ]);
  if (!allowed.has(normalized)) {
    return children;
  }
  if (normalized === 'br') {
    return '<br>';
  }
  return `<${normalized}>${children}</${normalized}>`;
}

/** Expand #abc → #aabbcc; keep #rrggbb / #rrggbbaa. Returns null if invalid. */
function normalizeHex(raw: string): string | null {
  const match = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.exec(raw.trim());
  if (!match) return null;
  const digits = match[1]!;
  if (digits.length === 3) {
    return `#${digits
      .split('')
      .map((ch) => ch + ch)
      .join('')}`.toLowerCase();
  }
  return `#${digits}`.toLowerCase();
}

/** Parse a single color token: #hex / hex / rgb() / rgba(). */
function parseColorToken(raw: string): string | null {
  const value = String(raw || '').trim();
  if (!value) return null;

  if (/^#?[0-9A-Fa-f]{3}$|^#?[0-9A-Fa-f]{6}$|^#?[0-9A-Fa-f]{8}$/.test(value)) {
    return normalizeHex(value.startsWith('#') ? value : `#${value}`);
  }

  const rgb = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+\s*)?\)$/i.exec(
    value,
  );
  if (rgb) {
    const r = Number(rgb[1]);
    const g = Number(rgb[2]);
    const b = Number(rgb[3]);
    if ([r, g, b].every((n) => n >= 0 && n <= 255)) {
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  return null;
}

function swatchHtml(label: string, cssColor: string): string {
  // Inline styles: Angular emulated encapsulation does not style [innerHTML] nodes.
  const box =
    'display:inline-block;width:14px;height:14px;margin:0 2px 0 5px;border-radius:4px;' +
    'border:1px solid rgba(22,24,42,0.28);vertical-align:-2px;' +
    `background-color:${cssColor}`;
  return `<span class="ai-hex-swatch" style="${box}" data-ai-color="${escapeAttr(cssColor)}" title="${escapeAttr(label)}"></span>`;
}

function injectColorSwatches(text: string): string {
  const re =
    /#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*[\d.]+\s*)?\)/gi;
  let out = '';
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const token = match[0];
    const index = match.index;
    out += escapeHtml(text.slice(last, index));
    const css = parseColorToken(token);
    if (css) {
      out += `${escapeHtml(token)}${swatchHtml(token, css)}`;
    } else {
      out += escapeHtml(token);
    }
    last = index + token.length;
  }
  out += escapeHtml(text.slice(last));
  return out;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}
