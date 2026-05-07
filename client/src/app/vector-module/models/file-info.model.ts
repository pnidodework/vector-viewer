export interface FileInfo {
  _id: string;
  filename: string;
  displayName: string;
  type: 'pdf' | 'tiff' | 'jpg';
  path: string;
  pageCount: number;
  sortOrder: number;
  size: number;
  createdAt: string;
  updatedAt: string;
}
