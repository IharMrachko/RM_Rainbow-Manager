export interface MaskSegment {
  color: string;
}

export interface MaskCard {
  id: number;
  type: string;
  segments: MaskSegment[];
}
