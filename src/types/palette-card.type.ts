import { Palette } from '@/types/palette.type';

export type PaletteCard = {
  id: Palette;
  name?: string;
  colors: string[];
  segments?: { color: string }[];
};
