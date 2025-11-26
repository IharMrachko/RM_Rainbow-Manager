export function parseDDMMYYYY(str: string): Date | null {
  if (!str || typeof str !== 'string') return null;

  // строгая проверка формата: два цифры, разделитель, две цифры, разделитель, четыре цифры
  const m = str.trim().match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  if (!m) return null;

  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);

  // базовые диапазоны
  if (y < 1000 || y > 9999) return null;
  if (mo < 1 || mo > 12) return null;
  if (d < 1 || d > 31) return null;

  // создаём дату и проверяем, что компоненты совпадают (ловит 31/02, 29/02 в невисокосный и т.п.)
  const date = new Date(y, mo - 1, d);

  if (Number.isNaN(date.getTime())) return null;
  if (date.getFullYear() !== y) return null;
  if (date.getMonth() + 1 !== mo) return null;
  if (date.getDate() !== d) return null;

  return date;
}
