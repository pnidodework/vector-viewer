import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef,
  AfterViewInit, HostListener
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ViewerStateService, PageSelectedEvent } from '../../services/viewer-state.service';
import { FileService } from '../../services/file.service';
import { AnnotationService } from '../../services/annotation.service';
import { FileInfo } from '../../models/file-info.model';
import { Annotation, AnnotationData } from '../../models/annotation.model';
import { UndoRedoService } from '../../services/undo-redo.service';
import { AutoSaveService } from '../../services/auto-save.service';

declare const UTIF: any;
declare const pdfjsLib: any;

@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.css'],
})
export class ViewerComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('viewerContainer', { static: false }) containerRef!: ElementRef<HTMLElement>;
  @ViewChild('viewerCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('annotationSvg', { static: false }) svgRef!: ElementRef<SVGSVGElement>;

  currentFile: FileInfo | null = null;
  currentPage = 1;
  zoomLevel = 1;
  rotation = 0;
  brightness = 100;
  contrast = 100;
  activeTool = 'select';
  annotations: Annotation[] = [];
  pageAnnotations: Annotation[] = [];

  canvasWidth = 800;
  canvasHeight = 600;
  selectedStamp = 'APPROVED';

  private pdfDoc: any = null;
  private subs: Subscription[] = [];

  // Pan state
  isPanning = false;
  panX = 0;
  panY = 0;
  private panStartX = 0;
  private panStartY = 0;
  private panOffsetX = 0;
  private panOffsetY = 0;

  // Scroll-based page navigation
  private lastPageChangeTime = 0;
  private readonly PAGE_CHANGE_COOLDOWN = 500;
  isPageTransitioning = false;

  // Drawing state
  isDrawing = false;
  drawStartX = 0;
  drawStartY = 0;
  currentDrawPoints: number[] = [];
  tempAnnotation: Partial<Annotation> | null = null;

  constructor(
    public viewerState: ViewerStateService,
    private fileService: FileService,
    private annotationService: AnnotationService,
    private undoRedoService: UndoRedoService,
    private autoSaveService: AutoSaveService
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.viewerState.currentFile$.subscribe((file) => {
        this.currentFile = file;
        if (file) {
          this.loadFile(file);
          this.loadAnnotations(file._id);
        }
      }),
      this.viewerState.currentPage$.subscribe((page) => {
        this.currentPage = page;
        if (this.currentFile) this.renderCurrentPage();
      }),
      this.viewerState.zoomLevel$.subscribe((z) => { this.zoomLevel = z; }),
      this.viewerState.rotation$.subscribe((r) => { this.rotation = r; }),
      this.viewerState.brightness$.subscribe((b) => { this.brightness = b; }),
      this.viewerState.contrast$.subscribe((c) => { this.contrast = c; }),
      this.viewerState.activeTool$.subscribe((t) => { this.activeTool = t; }),
      this.viewerState.selectedStamp$.subscribe((s) => { this.selectedStamp = s; }),
      this.viewerState.annotations$.subscribe((a) => {
        this.annotations = a;
        this.filterPageAnnotations();
      }),
      this.viewerState.pageSelected$.subscribe((event: PageSelectedEvent) => {
        console.log('[ViewerComponent] Page selected:', event);
      })
    );
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  get transformStyle(): string {
    return `scale(${this.zoomLevel}) rotate(${this.rotation}deg) translate(${this.panX}px, ${this.panY}px)`;
  }

  get filterStyle(): string {
    return `brightness(${this.brightness}%) contrast(${this.contrast}%)`;
  }

  private async loadFile(file: FileInfo): Promise<void> {
    this.pdfDoc = null;
    this.panX = 0;
    this.panY = 0;

    if (file.type === 'pdf') {
      await this.loadPdf(file);
    } else if (file.type === 'tiff') {
      await this.loadTiff(file);
    } else if (file.type === 'jpg') {
      await this.loadImage(file);
    }
  }

  private async loadPdf(file: FileInfo): Promise<void> {
    try {
      const url = this.fileService.getFileContentUrl(file._id);
      const loadingTask = pdfjsLib.getDocument(url);
      this.pdfDoc = await loadingTask.promise;
      this.renderCurrentPage();
    } catch (err) {
      console.error('Error loading PDF:', err);
    }
  }

  private async loadTiff(file: FileInfo): Promise<void> {
    try {
      const url = this.fileService.getFileContentUrl(file._id);
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const ifds = UTIF.decode(buffer);
      const pageIndex = Math.min(this.currentPage - 1, ifds.length - 1);
      UTIF.decodeImage(buffer, ifds[pageIndex]);

      const rgba = UTIF.toRGBA8(ifds[pageIndex]);
      const width = ifds[pageIndex].width;
      const height = ifds[pageIndex].height;

      this.canvasWidth = width;
      this.canvasHeight = height;

      setTimeout(() => {
        const canvas = this.canvasRef?.nativeElement;
        if (!canvas) return;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        const imageData = new ImageData(new Uint8ClampedArray(rgba.buffer), width, height);
        ctx.putImageData(imageData, 0, 0);
      });
    } catch (err) {
      console.error('Error loading TIFF:', err);
    }
  }

  private async loadImage(file: FileInfo): Promise<void> {
    const url = this.fileService.getFileContentUrl(file._id);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.canvasWidth = img.width;
      this.canvasHeight = img.height;
      setTimeout(() => {
        const canvas = this.canvasRef?.nativeElement;
        if (!canvas) return;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
      });
    };
    img.src = url;
  }

  private async renderCurrentPage(): Promise<void> {
    if (!this.currentFile) return;

    if (this.currentFile.type === 'pdf' && this.pdfDoc) {
      try {
        const page = await this.pdfDoc.getPage(this.currentPage);
        const viewport = page.getViewport({ scale: 1.5 });
        this.canvasWidth = viewport.width;
        this.canvasHeight = viewport.height;

        setTimeout(async () => {
          const canvas = this.canvasRef?.nativeElement;
          if (!canvas) return;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;
          await page.render({ canvasContext: ctx, viewport }).promise;
        });
      } catch (err) {
        console.error('Error rendering PDF page:', err);
      }
    } else if (this.currentFile.type === 'tiff') {
      await this.loadTiff(this.currentFile);
    }
    this.filterPageAnnotations();
  }

  private loadAnnotations(fileId: string): void {
    this.annotationService.getAnnotations(fileId).subscribe((annotations) => {
      this.viewerState.setAnnotations(annotations);
    });
  }

  private filterPageAnnotations(): void {
    this.pageAnnotations = this.annotations.filter((a) => a.page === this.currentPage);
  }

  // Mouse event handlers for drawing and panning
  onMouseDown(event: MouseEvent): void {
    const rect = this.svgRef?.nativeElement?.getBoundingClientRect();
    if (!rect) return;

    const x = (event.clientX - rect.left) / this.zoomLevel;
    const y = (event.clientY - rect.top) / this.zoomLevel;

    if (this.activeTool === 'pan' || this.activeTool === 'select') {
      this.isPanning = true;
      this.panStartX = event.clientX;
      this.panStartY = event.clientY;
      this.panOffsetX = this.panX;
      this.panOffsetY = this.panY;
      return;
    }

    if (this.activeTool === 'crop') {
      return;
    }

    this.isDrawing = true;
    this.drawStartX = x;
    this.drawStartY = y;
    this.currentDrawPoints = [x, y];

    if (this.activeTool === 'stickyNote') {
      this.addStickyNote(x, y);
      this.isDrawing = false;
    } else if (this.activeTool === 'stamp') {
      this.addStamp(x, y);
      this.isDrawing = false;
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isPanning) {
      this.panX = this.panOffsetX + (event.clientX - this.panStartX) / this.zoomLevel;
      this.panY = this.panOffsetY + (event.clientY - this.panStartY) / this.zoomLevel;
      return;
    }

    if (!this.isDrawing) return;

    const rect = this.svgRef?.nativeElement?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / this.zoomLevel;
    const y = (event.clientY - rect.top) / this.zoomLevel;

    if (this.activeTool === 'freehand' || this.activeTool === 'highlighter') {
      this.currentDrawPoints.push(x, y);
    }

    this.tempAnnotation = this.buildTempAnnotation(x, y);
  }

  onMouseUp(event: MouseEvent): void {
    if (this.isPanning) {
      this.isPanning = false;
      return;
    }

    if (!this.isDrawing) return;
    this.isDrawing = false;

    const rect = this.svgRef?.nativeElement?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / this.zoomLevel;
    const y = (event.clientY - rect.top) / this.zoomLevel;

    this.finalizeAnnotation(x, y);
    this.tempAnnotation = null;
  }

  private buildTempAnnotation(endX: number, endY: number): Partial<Annotation> {
    const data: AnnotationData = {
      x: this.drawStartX,
      y: this.drawStartY,
      color: '#FF0000',
      strokeWidth: 2,
    };

    switch (this.activeTool) {
      case 'arrow':
      case 'line':
        data.endX = endX;
        data.endY = endY;
        break;
      case 'circle':
        data.radius = Math.sqrt(Math.pow(endX - this.drawStartX, 2) + Math.pow(endY - this.drawStartY, 2));
        break;
      case 'highlighter':
        data.points = [...this.currentDrawPoints];
        data.color = '#FFFF00';
        data.opacity = 0.3;
        data.strokeWidth = 20;
        break;
      case 'freehand':
        data.points = [...this.currentDrawPoints];
        break;
    }

    return { type: this.activeTool as any, data, page: this.currentPage };
  }

  private finalizeAnnotation(endX: number, endY: number): void {
    if (!this.currentFile) return;

    const annotation: Annotation = {
      fileId: this.currentFile._id,
      page: this.currentPage,
      type: this.activeTool as any,
      data: this.buildTempAnnotation(endX, endY).data!,
    };

    const prevAnnotations = [...this.annotations];
    this.undoRedoService.execute({
      execute: () => {
        const updated = [...this.annotations, annotation];
        this.viewerState.setAnnotations(updated);
        this.autoSaveService.markDirty(updated);
      },
      undo: () => {
        this.viewerState.setAnnotations(prevAnnotations);
        this.autoSaveService.markDirty(prevAnnotations);
      },
      description: `Add ${this.activeTool}`,
    });
  }

  private addStickyNote(x: number, y: number): void {
    if (!this.currentFile) return;

    const annotation: Annotation = {
      fileId: this.currentFile._id,
      page: this.currentPage,
      type: 'stickyNote',
      data: { x, y, width: 150, height: 100, text: '', color: '#FFEB3B' },
    };

    const prevAnnotations = [...this.annotations];
    this.undoRedoService.execute({
      execute: () => {
        const updated = [...this.annotations, annotation];
        this.viewerState.setAnnotations(updated);
        this.autoSaveService.markDirty(updated);
      },
      undo: () => {
        this.viewerState.setAnnotations(prevAnnotations);
        this.autoSaveService.markDirty(prevAnnotations);
      },
      description: 'Add sticky note',
    });
  }

  private addStamp(x: number, y: number): void {
    if (!this.currentFile) return;

    const annotation: Annotation = {
      fileId: this.currentFile._id,
      page: this.currentPage,
      type: 'stamp',
      data: { x, y, width: 120, height: 40, stampType: this.selectedStamp, color: '#F44336' },
    };

    const prevAnnotations = [...this.annotations];
    this.undoRedoService.execute({
      execute: () => {
        const updated = [...this.annotations, annotation];
        this.viewerState.setAnnotations(updated);
        this.autoSaveService.markDirty(updated);
      },
      undo: () => {
        this.viewerState.setAnnotations(prevAnnotations);
        this.autoSaveService.markDirty(prevAnnotations);
      },
      description: 'Add stamp',
    });
  }

  updateStickyNoteText(index: number, text: string): void {
    const annotation = this.pageAnnotations[index];
    if (!annotation) return;

    const allIdx = this.annotations.indexOf(annotation);
    if (allIdx === -1) return;

    const prevAnnotations = [...this.annotations];
    const updated = [...this.annotations];
    updated[allIdx] = { ...annotation, data: { ...annotation.data, text } };

    this.undoRedoService.execute({
      execute: () => {
        this.viewerState.setAnnotations(updated);
        this.autoSaveService.markDirty(updated);
      },
      undo: () => {
        this.viewerState.setAnnotations(prevAnnotations);
        this.autoSaveService.markDirty(prevAnnotations);
      },
      description: 'Edit sticky note',
    });
  }

  deleteAnnotation(index: number): void {
    const annotation = this.pageAnnotations[index];
    if (!annotation) return;

    const prevAnnotations = [...this.annotations];
    const updated = this.annotations.filter((a) => a !== annotation);
    const deletedIds = annotation._id ? [annotation._id] : [];

    this.undoRedoService.execute({
      execute: () => {
        this.viewerState.setAnnotations(updated);
        this.autoSaveService.markDirty(updated, deletedIds);
      },
      undo: () => {
        this.viewerState.setAnnotations(prevAnnotations);
        this.autoSaveService.markDirty(prevAnnotations);
      },
      description: 'Delete annotation',
    });
  }

  getAnnotationTransform(ann: Annotation): string {
    return `translate(${ann.data.x}, ${ann.data.y})`;
  }

  getSvgPath(points: number[]): string {
    if (!points || points.length < 4) return '';
    let d = `M ${points[0]} ${points[1]}`;
    for (let i = 2; i < points.length; i += 2) {
      d += ` L ${points[i]} ${points[i + 1]}`;
    }
    return d;
  }

  onCropApplied(rect: { x: number; y: number; width: number; height: number }): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(rect.x, rect.y, rect.width, rect.height);
    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;

    setTimeout(() => {
      const c = this.canvasRef?.nativeElement;
      if (!c) return;
      c.width = rect.width;
      c.height = rect.height;
      const newCtx = c.getContext('2d');
      if (newCtx) {
        newCtx.putImageData(imageData, 0, 0);
      }
    });

    this.viewerState.setActiveTool('select');
  }

  onCropCancelled(): void {
    this.viewerState.setActiveTool('select');
  }

  getArrowMarkerUrl(): string {
    return 'url(#arrowhead)';
  }

  onWheel(event: WheelEvent): void {
    if (!this.currentFile || this.currentFile.pageCount <= 1) return;
    if (this.isPageTransitioning) return;

    const container = this.containerRef?.nativeElement;
    if (!container) return;

    const now = Date.now();
    if (now - this.lastPageChangeTime < this.PAGE_CHANGE_COOLDOWN) return;

    const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 2;
    const atTop = container.scrollTop <= 1;

    let nextPage = 0;
    if (event.deltaY > 0 && atBottom && this.currentPage < this.currentFile.pageCount) {
      nextPage = this.currentPage + 1;
    } else if (event.deltaY < 0 && atTop && this.currentPage > 1) {
      nextPage = this.currentPage - 1;
    }

    if (!nextPage) return;

    event.preventDefault();
    this.lastPageChangeTime = now;
    this.isPageTransitioning = true;

    setTimeout(() => {
      this.viewerState.setCurrentPage(nextPage);
      container.scrollTop = nextPage > this.currentPage ? container.scrollHeight : 0;
      setTimeout(() => {
        this.isPageTransitioning = false;
      }, 200);
    }, 100);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey) {
      if (event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        this.undoRedoService.undo();
      } else if ((event.key === 'z' && event.shiftKey) || event.key === 'y') {
        event.preventDefault();
        this.undoRedoService.redo();
      }
    }
  }
}
