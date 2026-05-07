import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AnnotationService } from './annotation.service';
import { ViewerStateService } from './viewer-state.service';
import { Annotation } from '../models/annotation.model';

@Injectable({ providedIn: 'root' })
export class AutoSaveService implements OnDestroy {
  private changeSubject = new Subject<void>();
  private subscription: Subscription;
  private dirtyAnnotations: Annotation[] = [];
  private deletedIds: string[] = [];

  constructor(
    private annotationService: AnnotationService,
    private viewerState: ViewerStateService
  ) {
    this.subscription = this.changeSubject
      .pipe(debounceTime(5000))
      .subscribe(() => this.save());
  }

  markDirty(annotations: Annotation[], deletedIds: string[] = []): void {
    this.dirtyAnnotations = [...annotations];
    this.deletedIds = [...deletedIds];
    this.changeSubject.next();
  }

  save(): void {
    if (this.dirtyAnnotations.length === 0 && this.deletedIds.length === 0) return;

    this.annotationService
      .batchSave(this.dirtyAnnotations, this.deletedIds)
      .subscribe({
        next: () => {
          this.dirtyAnnotations = [];
          this.deletedIds = [];
        },
        error: (err) => console.error('Auto-save failed:', err),
      });
  }

  ngOnDestroy(): void {
    this.save();
    this.subscription.unsubscribe();
  }
}
