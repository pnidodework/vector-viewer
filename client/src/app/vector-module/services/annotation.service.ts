import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Annotation } from '../models/annotation.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AnnotationService {
  private baseUrl = `${environment.apiUrl}/annotations`;

  constructor(private http: HttpClient) {}

  getAnnotations(fileId: string): Observable<Annotation[]> {
    return this.http.get<Annotation[]>(`${this.baseUrl}/${fileId}`);
  }

  createAnnotation(annotation: Annotation): Observable<Annotation> {
    return this.http.post<Annotation>(this.baseUrl, annotation);
  }

  updateAnnotation(id: string, annotation: Partial<Annotation>): Observable<Annotation> {
    return this.http.put<Annotation>(`${this.baseUrl}/${id}`, annotation);
  }

  deleteAnnotation(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  batchSave(upserts: Annotation[], deletes: string[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/batch`, { upserts, deletes });
  }
}
