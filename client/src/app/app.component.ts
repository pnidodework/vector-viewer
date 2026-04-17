import { Component } from '@angular/core';
import { PageSelectedEvent } from './services/viewer-state.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  showExportDialog = false;
  showCrossRefDialog = false;

  openExportDialog(): void {
    this.showExportDialog = true;
  }

  openCrossRefDialog(): void {
    this.showCrossRefDialog = true;
  }

  onPageSelected(event: PageSelectedEvent): void {
    console.log('[AppComponent] Page selected callback:', event);
  }
}
