import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { FileInfo } from '../models/file-info.model';
import { Annotation } from '../models/annotation.model';

export interface PageSelectedEvent {
  page: number;
  fileId: string;
  fileName: string;
  fileType: string;
  pageCount: number;
  annotations: Annotation[];
}

export type ActiveTool =
  | 'select'
  | 'stickyNote'
  | 'stamp'
  | 'arrow'
  | 'circle'
  | 'line'
  | 'highlighter'
  | 'freehand'
  | 'crop'
  | 'pan';

@Injectable({ providedIn: 'root' })
export class ViewerStateService {
  private currentFileSubject = new BehaviorSubject<FileInfo | null>(null);
  private currentPageSubject = new BehaviorSubject<number>(1);
  private zoomLevelSubject = new BehaviorSubject<number>(1);
  private rotationSubject = new BehaviorSubject<number>(0);
  private activeToolSubject = new BehaviorSubject<ActiveTool>('select');
  private brightnessSubject = new BehaviorSubject<number>(100);
  private contrastSubject = new BehaviorSubject<number>(100);
  private annotationsSubject = new BehaviorSubject<Annotation[]>([]);
  private filesSubject = new BehaviorSubject<FileInfo[]>([]);
  private selectedStampSubject = new BehaviorSubject<string>('APPROVED');
  private pageSelectedSubject = new Subject<PageSelectedEvent>();

  currentFile$ = this.currentFileSubject.asObservable();
  currentPage$ = this.currentPageSubject.asObservable();
  zoomLevel$ = this.zoomLevelSubject.asObservable();
  rotation$ = this.rotationSubject.asObservable();
  activeTool$ = this.activeToolSubject.asObservable();
  brightness$ = this.brightnessSubject.asObservable();
  contrast$ = this.contrastSubject.asObservable();
  annotations$ = this.annotationsSubject.asObservable();
  files$ = this.filesSubject.asObservable();
  selectedStamp$ = this.selectedStampSubject.asObservable();
  pageSelected$ = this.pageSelectedSubject.asObservable();

  get currentFile(): FileInfo | null { return this.currentFileSubject.value; }
  get currentPage(): number { return this.currentPageSubject.value; }
  get zoomLevel(): number { return this.zoomLevelSubject.value; }
  get rotation(): number { return this.rotationSubject.value; }
  get activeTool(): ActiveTool { return this.activeToolSubject.value; }
  get brightness(): number { return this.brightnessSubject.value; }
  get contrast(): number { return this.contrastSubject.value; }
  get annotations(): Annotation[] { return this.annotationsSubject.value; }
  get files(): FileInfo[] { return this.filesSubject.value; }
  get selectedStamp(): string { return this.selectedStampSubject.value; }

  setCurrentFile(file: FileInfo | null): void {
    this.currentFileSubject.next(file);
    this.currentPageSubject.next(1);
    this.rotationSubject.next(0);
    this.brightnessSubject.next(100);
    this.contrastSubject.next(100);
  }

  setFiles(files: FileInfo[]): void {
    this.filesSubject.next(files);
  }

  setCurrentPage(page: number): void {
    const file = this.currentFile;
    if (file && page >= 1 && page <= file.pageCount) {
      this.currentPageSubject.next(page);
      const pageAnnotations = this.annotations.filter(a => a.page === page);
      this.pageSelectedSubject.next({
        page,
        fileId: file._id,
        fileName: file.displayName,
        fileType: file.type,
        pageCount: file.pageCount,
        annotations: pageAnnotations,
      });
    }
  }

  setZoomLevel(zoom: number): void {
    this.zoomLevelSubject.next(Math.max(0.1, Math.min(5, zoom)));
  }

  zoomIn(): void { this.setZoomLevel(this.zoomLevel + 0.25); }
  zoomOut(): void { this.setZoomLevel(this.zoomLevel - 0.25); }
  fitToScreen(): void { this.setZoomLevel(1); }
  actualSize(): void { this.setZoomLevel(1); }

  setRotation(degrees: number): void {
    this.rotationSubject.next(degrees % 360);
  }

  rotate90(): void { this.setRotation(this.rotation + 90); }
  rotate180(): void { this.setRotation(this.rotation + 180); }
  rotate270(): void { this.setRotation(this.rotation + 270); }

  setActiveTool(tool: ActiveTool): void {
    this.activeToolSubject.next(tool);
  }

  setBrightness(value: number): void {
    this.brightnessSubject.next(Math.max(0, Math.min(200, value)));
  }

  setContrast(value: number): void {
    this.contrastSubject.next(Math.max(0, Math.min(200, value)));
  }

  setSelectedStamp(stamp: string): void {
    this.selectedStampSubject.next(stamp);
  }

  setAnnotations(annotations: Annotation[]): void {
    this.annotationsSubject.next(annotations);
  }

  navigateToNextDocument(): void {
    const files = this.files;
    const current = this.currentFile;
    if (!current || files.length <= 1) return;
    const idx = files.findIndex(f => f._id === current._id);
    if (idx < files.length - 1) this.setCurrentFile(files[idx + 1]);
  }

  navigateToPreviousDocument(): void {
    const files = this.files;
    const current = this.currentFile;
    if (!current || files.length <= 1) return;
    const idx = files.findIndex(f => f._id === current._id);
    if (idx > 0) this.setCurrentFile(files[idx - 1]);
  }
}
