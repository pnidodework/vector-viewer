import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ViewerStateService } from '../../../services/viewer-state.service';

@Component({
  selector: 'app-image-adjust',
  templateUrl: './image-adjust.component.html',
  styleUrls: ['./image-adjust.component.css'],
})
export class ImageAdjustComponent implements OnInit, OnDestroy {
  brightness = 100;
  contrast = 100;
  private subs: Subscription[] = [];

  constructor(private viewerState: ViewerStateService) {}

  ngOnInit(): void {
    this.subs.push(
      this.viewerState.brightness$.subscribe((b) => (this.brightness = b)),
      this.viewerState.contrast$.subscribe((c) => (this.contrast = c))
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  onBrightnessChange(value: number): void {
    this.viewerState.setBrightness(value);
  }

  onContrastChange(value: number): void {
    this.viewerState.setContrast(value);
  }

  reset(): void {
    this.viewerState.setBrightness(100);
    this.viewerState.setContrast(100);
  }
}
