import {
  appendAiRecommendationHtml,
  buildAiColoristRequest,
  buildAiImageRequest,
  detectsImageIntent,
  isImageScenario,
  safeAiMarkdownHtml,
  scenarioPrompt,
} from './ai-colorist';
import { AiChatExchange } from '../services/ai-chat-history.service';

describe('AI colorist utilities', () => {
  it('includes completed conversation context in the next request', () => {
    const context: AiChatExchange[] = [
      {
        id: 1,
        ask: 'Мой сезон — лето?',
        answerMarkdown: 'Вероятнее всего мягкое лето.',
        state: 'ready',
        createdAt: 1,
      },
    ];

    const request = buildAiColoristRequest('ru', context, 'Какие базовые цвета выбрать?');

    expect(request).toContain('Контекст диалога');
    expect(request).toContain('мягкое лето');
    expect(request).toContain('Какие базовые цвета выбрать?');
  });

  it('detects image generation intents and scenarios', () => {
    expect(detectsImageIntent('Нарисуй палитру Soft Summer')).toBeTrue();
    expect(detectsImageIntent('Какие цвета мне носить?')).toBeFalse();
    expect(isImageScenario('palette-board')).toBeTrue();
    expect(detectsImageIntent('anything', 'outfit-look')).toBeTrue();
  });

  it('builds an image prompt that forbids outsourcing generators', () => {
    const request = buildAiImageRequest('ru', [], 'Нарисуй палитру мягкого лета');
    expect(request).toContain('изображение');
    expect(request.toLowerCase()).toContain('генератор');
  });

  it('includes compact conversation context in image requests', () => {
    const context: AiChatExchange[] = [
      {
        id: 1,
        ask: 'Нарисуй капсульный образ в цветах мягкого лета',
        answerMarkdown: 'Образ: база + акцент мягкого лета.',
        state: 'ready',
        createdAt: 1,
        wantsImage: true,
      },
    ];

    const request = buildAiImageRequest('ru', context, 'сделай теплее');

    expect(request).toContain('Контекст диалога');
    expect(request).toContain('мягкого лета');
    expect(request).toContain('сделай теплее');
    expect(request).toContain('уточнение');
  });

  it('provides localized guided prompts', () => {
    expect(scenarioPrompt('season', 'ru')).toContain('фото');
    expect(scenarioPrompt('wardrobe', 'en')).toContain('wardrobe');
    expect(scenarioPrompt('palette-board', 'ru')).toContain('палитру');
  });

  it('removes executable markup from AI markdown', () => {
    const html = safeAiMarkdownHtml(
      '# Result\n\n<strong>Safe</strong><script>alert("x")</script><img src=x onerror=alert(1)>',
    );

    expect(html).toContain('<h2>Result</h2>');
    expect(html).toContain('<strong>Safe</strong>');
    expect(html).not.toContain('script');
    expect(html).not.toContain('alert');
    expect(html).not.toContain('img');
    expect(html).not.toContain('onerror');
  });

  it('injects color swatches next to HEX codes', () => {
    const html = safeAiMarkdownHtml('Try accent #f3f3f3 and short #abc.');

    expect(html).toContain('#f3f3f3');
    expect(html).toContain('class="ai-hex-swatch"');
    expect(html).toContain('background-color:#f3f3f3');
    expect(html).toContain('display:inline-block');
    expect(html).toContain('background-color:#aabbcc');
    expect(html).toContain('#abc');
  });

  it('injects swatches for rgb() colors', () => {
    const html = safeAiMarkdownHtml('Base rgb(120, 80, 200) works too.');
    expect(html).toContain('ai-hex-swatch');
    expect(html).toContain('background-color:rgb(120, 80, 200)');
  });

  it('injects swatches for HEX wrapped in code backticks', () => {
    const html = safeAiMarkdownHtml('Use `#c9a0dc` as accent.');

    expect(html).toContain('<code>');
    expect(html).toContain('#c9a0dc');
    expect(html).toContain('ai-hex-swatch');
    expect(html).toContain('background-color:#c9a0dc');
  });

  it('does not inject swatches inside multi-token code spans', () => {
    const html = safeAiMarkdownHtml('Use `color: #fff` in CSS.');

    expect(html).toContain('<code>');
    expect(html).not.toContain('ai-hex-swatch');
  });

  it('appends a ProseMirror-compatible recommendation section with images', () => {
    const html = appendAiRecommendationHtml(
      '<p>Existing</p>',
      '- Navy\n- Plum',
      'AI advice',
      ['data:image/jpeg;base64,abc'],
    );

    expect(html).toContain('<p>Existing</p><h2>AI advice</h2>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>Navy</li>');
    expect(html).toContain('data:image/jpeg;base64,abc');
    expect(html).toContain('<p><br></p>');
  });
});
