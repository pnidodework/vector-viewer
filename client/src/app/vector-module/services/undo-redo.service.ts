import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Command } from '../models/command.model';

@Injectable({ providedIn: 'root' })
export class UndoRedoService {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private canUndoSubject = new BehaviorSubject<boolean>(false);
  private canRedoSubject = new BehaviorSubject<boolean>(false);

  canUndo$ = this.canUndoSubject.asObservable();
  canRedo$ = this.canRedoSubject.asObservable();

  execute(command: Command): void {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = [];
    this.updateState();
  }

  undo(): void {
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
      this.updateState();
    }
  }

  redo(): void {
    const command = this.redoStack.pop();
    if (command) {
      command.execute();
      this.undoStack.push(command);
      this.updateState();
    }
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.updateState();
  }

  private updateState(): void {
    this.canUndoSubject.next(this.undoStack.length > 0);
    this.canRedoSubject.next(this.redoStack.length > 0);
  }
}
