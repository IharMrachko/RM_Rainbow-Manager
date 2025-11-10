export function tokenizeTitle(title: string): string[] {
  const result: string[] = [];
  const words = title.toLowerCase().split(/\s+/); // разбиваем по пробелам

  for (const word of words) {
    // префиксы слова
    for (let i = 1; i <= word.length; i++) {
      result.push(word.substring(0, i));
    }

    // побуквенное разбиение
    for (let i = 0; i < word.length; i++) {
      result.push(word[i]);
    }
  }

  return result;
}
