import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { AppComponent } from './app.component';
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

@NgModule({
  declarations: [
    AppComponent,
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
    BrowserModule,
    HttpClientModule,
    FormsModule,
    DragDropModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
