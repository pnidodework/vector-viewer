import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { ViewerStateService, PageSelectedEvent } from '../../services/viewer-state.service';
import { FileService } from '../../services/file.service';
import { FileInfo } from '../../models/file-info.model';

declare const pdfjsLib: any;

const THUMB_SCALE = 0.3;

@Component({
  selector: 'app-thumbnail-panel',
  templateUrl: './thumbnail-panel.component.html',
  styleUrls: ['./thumbnail-panel.component.css'],
})
export class ThumbnailPanelComponent implements OnInit, OnDestroy {
  @ViewChild('thumbnailList') thumbnailList!: ElementRef<HTMLElement>;
  @Output() pageSelected = new EventEmitter<PageSelectedEvent>();

  currentFile: FileInfo | null = null;
  currentPage = 1;
  pages: number[] = [];
  pdfThumbnails: Map<number, string> = new Map();
  private pdfDoc: any = null;
  private subs: Subscription[] = [];

  constructor(
    private viewerState: ViewerStateService,
    private fileService: FileService
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.viewerState.currentFile$.subscribe((file) => {
        this.currentFile = file;
        this.pdfThumbnails = new Map();
        this.pdfDoc = null;
        this.pages = file ? Array.from({ length: file.pageCount }, (_, i) => i + 1) : [];
        if (file && file.type === 'pdf') {
          this.loadPdfThumbnails(file);
        }
      }),
      this.viewerState.currentPage$.subscribe((p) => {
        this.currentPage = p;
        this.scrollToActiveThumbnail();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  goToPage(page: number): void {
    this.viewerState.setCurrentPage(page);
    if (this.currentFile) {
      this.pageSelected.emit({
        page,
        fileId: this.currentFile._id,
        fileName: this.currentFile.displayName,
        fileType: this.currentFile.type,
        pageCount: this.currentFile.pageCount,
        annotations: this.viewerState.annotations.filter(a => a.page === page),
      });
    }
  }

  getThumbnailUrl(page: number): string {
    if (!this.currentFile) return '';
    return this.fileService.getThumbnailUrl(this.currentFile._id, page - 1);
  }

  getPdfThumbUrl(page: number): string | null {
    return this.pdfThumbnails.get(page) || null;
  }

  private scrollToActiveThumbnail(): void {
    setTimeout(() => {
      const list = this.thumbnailList?.nativeElement;
      if (!list) return;
      const item = list.querySelector('.thumbnail-item.active') as HTMLElement;
      if (item) {
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  private async loadPdfThumbnails(file: FileInfo): Promise<void> {
    try {
      const url = this.fileService.getFileContentUrl(file._id);
      const loadingTask = pdfjsLib.getDocument(url);
      this.pdfDoc = await loadingTask.promise;

      for (let i = 1; i <= Math.min(file.pageCount, 200); i++) {
        await this.renderPdfPageThumb(i);
      }
    } catch (err) {
      console.error('Error loading PDF thumbnails:', err);
    }
  }

  private async renderPdfPageThumb(pageNum: number): Promise<void> {
    if (!this.pdfDoc) return;
    try {
      const page = await this.pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: THUMB_SCALE });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      this.pdfThumbnails.set(pageNum, canvas.toDataURL('image/jpeg', 0.6));
    } catch (err) {
      console.error(`Error rendering PDF thumb page ${pageNum}:`, err);
    }
  }
}
