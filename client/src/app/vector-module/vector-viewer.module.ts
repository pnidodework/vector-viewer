import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { VectorViewerPageComponent } from './vector-viewer-page.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { DocumentListComponent } from './components/document-list/document-list.component';
import { ViewerComponent } from './components/viewer/viewer.component';
import { ThumbnailPanelComponent } from './components/thumbnail-panel/thumbnail-panel.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { ExportDialogComponent } from './components/export-dialog/export-dialog.component';
import { CrossRefDialogComponent } from './components/cross-ref-dialog/cross-ref-dialog.component';
import { CropToolComponent } from './components/annotations/crop-tool/crop-tool.component';
import { ImageAdjustComponent } from './components/annotations/image-adjust/image-adjust.component';
import { StickyNoteComponent } from './components/annotations/sticky-note/sticky-note.component';
import { StampSelectorComponent } from './components/annotations/stamp-selector/stamp-selector.component';
import { DrawingCanvasComponent } from './components/annotations/drawing-canvas/drawing-canvas.component';

const routes: Routes = [
  {
    path: '',
    component: VectorViewerPageComponent,
  },
];

@NgModule({
  declarations: [
    VectorViewerPageComponent,
    ToolbarComponent,
    DocumentListComponent,
    ViewerComponent,
    ThumbnailPanelComponent,
    PaginationComponent,
    ExportDialogComponent,
    CrossRefDialogComponent,
    CropToolComponent,
    ImageAdjustComponent,
    StickyNoteComponent,
    StampSelectorComponent,
    DrawingCanvasComponent,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    DragDropModule,
    RouterModule.forChild(routes),
  ],
  exports: [VectorViewerPageComponent],
})
export class VectorViewerModule {}
