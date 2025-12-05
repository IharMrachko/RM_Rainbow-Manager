import { MaskType } from '@/types/mask.type';
import { FrameColorSegmentType } from '@/types/frame-color-segment.type';

export type MaskCard = {
  id?: number;
  segments: FrameColorSegmentType[];
  type: MaskType;
  name?: string;
};
