import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ViewerStateService } from '../../services/viewer-state.service';
import { FileInfo } from '../../models/file-info.model';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css'],
})
export class PaginationComponent implements OnInit, OnDestroy {
  currentPage = 1;
  totalPages = 1;
  goToPageInput = '1';
  zoomLevel = 1;
  currentFile: FileInfo | null = null;

  private subs: Subscription[] = [];

  constructor(private viewerState: ViewerStateService) {}

  ngOnInit(): void {
    this.subs.push(
      this.viewerState.currentFile$.subscribe((file) => {
        this.currentFile = file;
        this.totalPages = file ? Math.min(file.pageCount, 200) : 1;
      }),
      this.viewerState.currentPage$.subscribe((p) => {
        this.currentPage = p;
        this.goToPageInput = String(p);
      }),
      this.viewerState.zoomLevel$.subscribe((z) => (this.zoomLevel = z))
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  firstPage(): void { this.viewerState.setCurrentPage(1); }
  previousPage(): void { this.viewerState.setCurrentPage(this.currentPage - 1); }
  nextPage(): void { this.viewerState.setCurrentPage(this.currentPage + 1); }
  lastPage(): void { this.viewerState.setCurrentPage(this.totalPages); }

  goToPage(): void {
    const page = parseInt(this.goToPageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= this.totalPages) {
      this.viewerState.setCurrentPage(page);
    } else {
      this.goToPageInput = String(this.currentPage);
    }
  }

  get zoomPercent(): number {
    return Math.round(this.zoomLevel * 100);
  }
}
