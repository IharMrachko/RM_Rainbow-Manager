import { AiChatHistoryService } from './ai-chat-history.service';
import { AuthService } from './auth.service';

describe('AiChatHistoryService', () => {
  let service: AiChatHistoryService;

  beforeEach(() => {
    localStorage.clear();
    service = new AiChatHistoryService({
      whenReady: async () => undefined,
      userId: null,
    } as AuthService);
  });

  it('creates an empty session', () => {
    const session = service.create('Season analysis');
    expect(session.title).toBe('Season analysis');
    expect(session.exchanges).toEqual([]);
    expect(session.id).toContain('ai-');
  });

  it('cleans a completed chat without image blobs or html', () => {
    const session = service.create('Season analysis');
    session.exchanges.push({
      id: 1,
      ask: 'Analyze my photo',
      answerMarkdown: '**Soft Summer**',
      answerHtml: '<strong>Soft Summer</strong>',
      state: 'ready',
      createdAt: 1,
      imageAttached: true,
      imagePreview: 'data:image/jpeg;base64,very-large-data',
      generatedImages: ['data:image/jpeg;base64,abc'],
      generatedImageUrls: ['https://example.com/ai.jpg'],
      hasGeneratedImage: true,
    });

    const cleaned = service.cleanSession(session);

    expect(cleaned.title).toBe('Season analysis');
    expect(cleaned.exchanges[0].answerMarkdown).toContain('Soft Summer');
    expect(cleaned.exchanges[0].imageAttached).toBeTrue();
    expect(cleaned.exchanges[0].imagePreview).toBeUndefined();
    expect(cleaned.exchanges[0].answerHtml).toBeUndefined();
    expect(cleaned.exchanges[0].generatedImages).toBeUndefined();
    expect(cleaned.exchanges[0].generatedImageUrls).toEqual(['https://example.com/ai.jpg']);
    expect(cleaned.exchanges[0].hasGeneratedImage).toBeTrue();
    expect(Object.prototype.hasOwnProperty.call(cleaned.exchanges[0], 'errorKey')).toBeFalse();
  });

  it('dedupes generated image URLs when cleaning', () => {
    const session = service.create('Dupes');
    session.exchanges.push({
      id: 5,
      ask: 'Draw outfit',
      answerMarkdown: 'Done',
      state: 'ready',
      createdAt: 5,
      hasGeneratedImage: true,
      generatedImageUrls: [
        'https://example.com/a.jpg',
        'https://example.com/a.jpg',
        'https://example.com/b.jpg',
      ],
    });

    const cleaned = service.cleanSession(session);
    expect(cleaned.exchanges[0].generatedImageUrls).toEqual([
      'https://example.com/a.jpg',
      'https://example.com/b.jpg',
    ]);
  });

  it('dedupes storage URLs that differ only by token', () => {
    expect(
      AiChatHistoryService.uniqueHttpUrls([
        'https://firebasestorage.googleapis.com/v0/b/app/o/ai%2Fx.jpg?alt=media&token=aaa',
        'https://firebasestorage.googleapis.com/v0/b/app/o/ai%2Fx.jpg?alt=media&token=bbb',
      ]),
    ).toEqual([
      'https://firebasestorage.googleapis.com/v0/b/app/o/ai%2Fx.jpg?alt=media&token=aaa',
    ]);
  });

  it('does not keep an unfinished response', () => {
    const session = service.create();
    session.exchanges.push({
      id: 2,
      ask: 'Question',
      answerMarkdown: null,
      state: 'loading',
      createdAt: 2,
    });

    expect(service.cleanSession(session).exchanges).toEqual([]);
  });

  it('saves and lists locally when signed out', async () => {
    const session = service.create('Local chat');
    session.exchanges.push({
      id: 3,
      ask: 'Hello',
      answerMarkdown: 'Hi',
      state: 'ready',
      createdAt: 3,
    });

    const saved = await service.save(session);
    expect(saved.length).toBe(1);
    expect(saved[0].title).toBe('Local chat');

    const listed = await service.listMine();
    expect(listed[0].exchanges[0].ask).toBe('Hello');
  });

  it('keeps attached image URL when cleaning', () => {
    const session = service.create('With photo');
    session.exchanges.push({
      id: 4,
      ask: 'What season?',
      answerMarkdown: 'Soft Autumn',
      state: 'ready',
      createdAt: 4,
      imageAttached: true,
      imagePreview: 'data:image/jpeg;base64,abc',
      attachedImageUrl: 'https://example.com/ask.jpg',
    });

    const cleaned = service.cleanSession(session);
    expect(cleaned.exchanges[0].attachedImageUrl).toBe('https://example.com/ask.jpg');
    expect(cleaned.exchanges[0].imageAttached).toBeTrue();
    expect(cleaned.exchanges[0].imagePreview).toBeUndefined();
  });
});
