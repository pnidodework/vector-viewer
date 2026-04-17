import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FileInfo } from '../models/file-info.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FileService {
  private baseUrl = `${environment.apiUrl}/files`;

  constructor(private http: HttpClient) {}

  scanAssets(): Observable<{ message: string; added: number }> {
    return this.http.post<{ message: string; added: number }>(`${this.baseUrl}/scan`, {});
  }

  getFiles(): Observable<FileInfo[]> {
    return this.http.get<FileInfo[]>(this.baseUrl);
  }

  getFile(id: string): Observable<FileInfo> {
    return this.http.get<FileInfo>(`${this.baseUrl}/${id}`);
  }

  getFileContentUrl(id: string): string {
    return `${this.baseUrl}/${id}/content`;
  }

  getThumbnailUrl(id: string, page: number): string {
    return `${this.baseUrl}/${id}/thumbnail/${page}`;
  }

  deleteFile(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  batchDelete(ids: string[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/batch-delete`, { ids });
  }

  reorder(items: { id: string; sortOrder: number }[]): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/reorder`, items);
  }
}
