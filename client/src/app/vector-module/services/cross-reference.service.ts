import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrossReference } from '../models/cross-reference.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CrossReferenceService {
  private baseUrl = `${environment.apiUrl}/cross-references`;

  constructor(private http: HttpClient) {}

  getCrossReferences(fileId: string): Observable<CrossReference[]> {
    return this.http.get<CrossReference[]>(`${this.baseUrl}/${fileId}`);
  }

  createCrossReference(sourceFileId: string, targetFileId: string, label: string = ''): Observable<CrossReference> {
    return this.http.post<CrossReference>(this.baseUrl, { sourceFileId, targetFileId, label });
  }

  deleteCrossReference(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}
