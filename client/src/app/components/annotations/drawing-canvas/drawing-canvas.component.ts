import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-drawing-canvas',
  templateUrl: './drawing-canvas.component.html',
  styleUrls: ['./drawing-canvas.component.css'],
})
export class DrawingCanvasComponent {
  @Input() activeTool = 'select';
  @Input() canvasWidth = 800;
  @Input() canvasHeight = 600;
}
