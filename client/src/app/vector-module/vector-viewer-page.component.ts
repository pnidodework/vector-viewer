import { Component } from '@angular/core';
import { PageSelectedEvent } from './services/viewer-state.service';

@Component({
  selector: 'app-vector-viewer-page',
  templateUrl: './vector-viewer-page.component.html',
  styleUrls: ['./vector-viewer-page.component.css'],
})
export class VectorViewerPageComponent {
  showExportDialog = false;
  showCrossRefDialog = false;

  openExportDialog(): void {
    this.showExportDialog = true;
  }

  openCrossRefDialog(): void {
    this.showCrossRefDialog = true;
  }

  onPageSelected(event: PageSelectedEvent): void {
    console.log('[VectorViewerPageComponent] Page selected callback:', event);
  }
}
