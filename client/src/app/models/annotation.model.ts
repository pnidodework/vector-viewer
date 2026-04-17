export type AnnotationType =
  | 'stickyNote'
  | 'stamp'
  | 'arrow'
  | 'circle'
  | 'line'
  | 'highlighter'
  | 'freehand'
  | 'crop'
  | 'text';

export interface AnnotationData {
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  stampType?: string;
  stampImageUrl?: string;
  points?: number[];
  endX?: number;
  endY?: number;
  radius?: number;
  fontSize?: number;
  opacity?: number;
}

export interface Annotation {
  _id?: string;
  fileId: string;
  page: number;
  type: AnnotationType;
  data: AnnotationData;
  createdAt?: string;
  updatedAt?: string;
}
