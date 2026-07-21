import { GalleryImage } from '../services/gallery.service';
import {
  LookbookTemplateCopy,
  LookbookTemplateId,
  LookbookTemplatePhoto,
} from './lookbook-page-templates';
import { buildLookbookTemplateHtml } from '../../shared/lookbook-pm/template-html';

interface DemoTemplate {
  kind: LookbookTemplateId;
  photoCount: number;
  copy?: LookbookTemplateCopy;
  caption?: string;
}

const DEMO_TEMPLATES: DemoTemplate[] = [
  {
    kind: 'cover',
    photoCount: 1,
    copy: {
      eyebrow: 'ПЕРСОНАЛЬНЫЙ LOOKBOOK',
      heading: 'Гармония цвета и характера',
      body: 'Коллекция образов, собранная вокруг естественной красоты, мягкого света и выразительных деталей.',
    },
  },
  {
    kind: 'article-left',
    photoCount: 1,
    copy: {
      eyebrow: 'ИСТОРИЯ ОБРАЗА',
      heading: 'Лёгкость утреннего света',
      subheading: 'Спокойная база и деликатные цветовые акценты',
      body: 'В основе образа — чистые линии, натуральные фактуры и оттенки, которые поддерживают природный колорит внешности.',
      body2: 'Мягкий свет раскрывает тон кожи, а небольшие контрастные детали делают композицию живой и современной.',
      bullet: 'Сохраняйте воздух между акцентами',
    },
  },
  {
    kind: 'article-right',
    photoCount: 1,
    copy: {
      eyebrow: 'ДЕТАЛИ СТИЛЯ',
      heading: 'Выразительный акцент',
      subheading: 'Когда одна деталь задаёт настроение всему комплекту',
      body: 'Глубокий оттенок рядом с лицом усиливает выразительность глаз и собирает образ, не перегружая его.',
      body2: 'Остальные элементы остаются нейтральными: так главный цвет звучит уверенно, а силуэт выглядит цельным.',
      bullet: 'Повторите акцент в одном небольшом аксессуаре',
    },
  },
  {
    kind: 'overlay-3',
    photoCount: 3,
    copy: {
      eyebrow: 'ТРИ РАКУРСА',
      heading: 'Образ в движении',
      subheading: 'Общий план, портрет и важная деталь',
      body: 'Серия показывает, как цвет и фактура работают при разном освещении и с разных точек съёмки.',
      body2: 'Крупный кадр раскрывает характер, а дополнительные фотографии помогают увидеть образ целиком.',
      bullet: 'Соединяйте кадры одной цветовой температурой',
    },
  },
  {
    kind: 'fan-3',
    photoCount: 3,
    caption: 'Три последовательных кадра передают настроение, движение ткани и характер образа.',
  },
  {
    kind: 'text-photo',
    photoCount: 1,
    copy: {
      eyebrow: 'ЦВЕТОВАЯ ФОРМУЛА',
      heading: 'Тёплая природная палитра',
      subheading: 'Терракота, сливочный и приглушённый зелёный',
      body: 'Палитра строится на близких по насыщенности оттенках. Они легко сочетаются и создают спокойное впечатление.',
      body2: 'Светлый фон добавляет свежести, а тёплый акцент делает лицо визуально ярче.',
      bullet: 'Избегайте слишком холодного белого рядом с лицом',
    },
  },
  {
    kind: 'text-photo-right',
    photoCount: 1,
    copy: {
      eyebrow: 'ВЕЧЕРНИЙ ВАРИАНТ',
      heading: 'Глубина без лишней тяжести',
      subheading: 'Более насыщенные оттенки при сохранении мягких линий',
      body: 'Для вечернего выхода достаточно усилить контраст и добавить одну выразительную фактуру.',
      body2: 'Матовые поверхности оставляют образ благородным, а небольшой блеск работает как точка света.',
      bullet: 'Выберите один главный блестящий акцент',
    },
  },
  {
    kind: 'collage-text-4',
    photoCount: 4,
    copy: {
      eyebrow: 'КАПСУЛА',
      heading: 'Четыре сочетания на каждый день',
      subheading: 'Единая палитра — разные задачи и настроение',
      body: 'Все комплекты объединены общей температурой цвета, поэтому вещи легко переходят из одного образа в другой.',
      body2: 'Меняя аксессуары и степень контраста, можно получить спокойный дневной или более собранный вечерний вариант.',
    },
  },
  {
    kind: 'collage-text-3',
    photoCount: 3,
    copy: {
      eyebrow: 'ФОКУС НА ДЕТАЛЯХ',
      heading: 'Фактуры, которые поддерживают цвет',
      subheading: 'Матовая база, мягкий объём и точечный блеск',
      body: 'Три кадра помогают сравнить материалы и увидеть, как каждый из них взаимодействует со светом.',
      body2: 'Повторение одной фактуры в разных элементах делает комплект продуманным и завершённым.',
    },
  },
  {
    kind: 'collage-2',
    photoCount: 2,
    caption: 'Сравнение двух решений: мягкий повседневный вариант и более контрастная вечерняя интерпретация.',
  },
  {
    kind: 'collage-4',
    photoCount: 4,
    caption: 'Галерея деталей: макияж, аксессуары, фактура ткани и общий силуэт в единой визуальной истории.',
  },
  {
    kind: 'photo',
    photoCount: 1,
    caption: 'Финальный кадр фиксирует цельный образ и завершает историю коллекции.',
  },
  {
    kind: 'text-1col',
    photoCount: 0,
    copy: {
      eyebrow: 'ИТОГОВЫЕ РЕКОМЕНДАЦИИ',
      heading: 'Формула гармоничного образа',
      subheading: 'Цвет поддерживает внешность, а детали раскрывают индивидуальность',
      body: 'Начинайте с комфортной базовой палитры и постепенно добавляйте выразительные оттенки. Сохраняйте баланс между цветом, фактурой и масштабом деталей.',
      body2: 'Лучший комплект не маскирует человека, а помогает ему выглядеть уверенно, естественно и узнаваемо в любой ситуации.',
    },
  },
];

function caption(text: string): string {
  return `<p style="margin:0.35em 0 1.1em;text-align:center;color:#5c6178;font-size:14px;font-style:italic;">${text}</p>`;
}

function buildEditorShowcaseHtml(): string {
  return `
<hr>
<h1 style="text-align:center;color:#8a4fa0;">Возможности текстового редактора</h1>
<p style="text-align:center;color:#5c6178;">Примеры всех вариантов оформления, доступных на панели инструментов.</p>

<h2>Начертание и комбинации</h2>
<p>
  <strong>Жирный текст</strong> помогает выделить главный вывод,
  <em>курсив</em> подходит для мягкого комментария,
  <u>подчёркивание</u> фиксирует важную деталь, а
  <s>зачёркивание</s> показывает исключённый вариант.
</p>
<p><strong><em><u>Начертания можно сочетать между собой</u></em></strong> и применять только к выбранной части текста.</p>

<h2>Шрифты</h2>
<p>
  <span style="font-family:Georgia, serif;">Georgia — спокойный редакционный стиль.</span><br>
  <span style="font-family:'Times New Roman', Times, serif;">Times New Roman — классическая подача.</span><br>
  <span style="font-family:Arial, Helvetica, sans-serif;">Arial — нейтральный и компактный.</span><br>
  <span style="font-family:Verdana, Geneva, sans-serif;">Verdana — хорошо читается на экране.</span><br>
  <span style="font-family:'Trebuchet MS', sans-serif;">Trebuchet — современный мягкий характер.</span><br>
  <span style="font-family:'Courier New', monospace;">Courier New — выразительный моноширинный акцент.</span>
</p>

<h2>Размер текста</h2>
<p>
  <span style="font-size:12px;">12 px — подпись</span> ·
  <span style="font-size:14px;">14 px — примечание</span> ·
  <span style="font-size:16px;">16 px — основной текст</span> ·
  <span style="font-size:18px;">18 px — вступление</span><br>
  <span style="font-size:20px;">20 px</span> ·
  <span style="font-size:24px;">24 px</span> ·
  <span style="font-size:28px;">28 px</span> ·
  <span style="font-size:32px;">32 px</span>
</p>

<h2>Цвет текста и выделение</h2>
<p>
  <span style="color:#8a4fa0;"><strong>Фиолетовый акцент</strong></span> ·
  <span style="color:#c0392b;">Красный</span> ·
  <span style="color:#e67e22;">Оранжевый</span> ·
  <span style="color:#27ae60;">Зелёный</span> ·
  <span style="color:#2980b9;">Синий</span>
</p>
<p>
  <span style="background-color:#fff3bf;color:#16182a;"> Жёлтое выделение </span>
  <span style="background-color:#fce4ec;color:#880e4f;"> Розовое выделение </span>
  <span style="background-color:#e3f2fd;color:#0d47a1;"> Голубое выделение </span>
  <span style="background-color:#e8f5e9;color:#1b5e20;"> Зелёное выделение </span>
</p>

<h1>Заголовок H1</h1>
<h2>Заголовок H2</h2>
<h3>Заголовок H3</h3>
<p>Обычный абзац P используется для основного описания образа и рекомендаций.</p>

<blockquote>
  <p><em>«Цвет становится выразительным, когда поддерживает характер человека, а не спорит с ним».</em></p>
</blockquote>

<h2>Маркированный список</h2>
<ul>
  <li>базовый оттенок рядом с лицом;</li>
  <li>один основной цветовой акцент;
    <ul>
      <li>вложенный пункт демонстрирует увеличение отступа;</li>
      <li>его можно вернуть кнопкой уменьшения отступа.</li>
    </ul>
  </li>
  <li>повтор цвета в аксессуаре.</li>
</ul>

<h2>Нумерованный список</h2>
<ol>
  <li>Оценить природный контраст.</li>
  <li>Выбрать базовую палитру.</li>
  <li>Добавить фактуру и финальный акцент.</li>
</ol>

<h2>Выравнивание</h2>
<p style="text-align:left;">Текст по левому краю — для основного чтения.</p>
<p style="text-align:center;">Текст по центру — для заголовков и коротких подписей.</p>
<p style="text-align:right;">Текст по правому краю — для заметок и авторских комментариев.</p>

<hr>
<p>Обычный текст без оформления показывает результат команды очистки формата. В демо также используются вставка фотографий, шаблоны, горизонтальные линии и история изменений редактора.</p>
`.trim();
}

/** Build a showcase document containing every available page template. */
export function buildDemoLookbookHtml(photos: GalleryImage[]): string {
  const available = photos.filter((photo) => !!photo.src);
  if (!available.length) {
    return '<p>Добавьте фотографии в галерею, чтобы создать демонстрационный lookbook.</p>';
  }

  let photoIndex = 0;
  const takePhotos = (count: number): LookbookTemplatePhoto[] => {
    const result: LookbookTemplatePhoto[] = [];
    for (let i = 0; i < count; i++) {
      const source = available[photoIndex % available.length]!;
      photoIndex += 1;
      result.push({
        src: source.src,
        alt: source.title?.trim() || source.coloristicType || `Образ ${photoIndex}`,
      });
    }
    return result;
  };

  const parts: string[] = [];
  for (const template of DEMO_TEMPLATES) {
    parts.push(buildLookbookTemplateHtml(template.kind, takePhotos(template.photoCount), template.copy));
    if (template.caption) {
      parts.push(caption(template.caption));
    }
  }
  parts.push(buildEditorShowcaseHtml());
  parts.push(
    '<p style="text-align:center;color:#8a4fa0;font-size:13px;"><b>Rainbow Manager</b> · персональный lookbook</p>',
  );
  return parts.join('\n');
}
