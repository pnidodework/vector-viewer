import { FileInfo } from './file-info.model';

export interface CrossReference {
  _id: string;
  sourceFileId: string | FileInfo;
  targetFileId: string | FileInfo;
  label: string;
  createdAt: string;
}
