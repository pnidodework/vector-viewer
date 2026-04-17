import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExportService {
  private baseUrl = `${environment.apiUrl}/export`;

  constructor(private http: HttpClient) {}

  exportFiles(fileIds: string[], format: string, quality: number = 80): void {
    this.http
      .post(this.baseUrl, { fileIds, format, quality }, { responseType: 'blob' })
      .subscribe((blob) => {
        const ext = format === 'jpg' ? 'jpg' : format === 'tiff' ? 'tiff' : 'pdf';
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `export.${ext}`;
        link.click();
        window.URL.revokeObjectURL(url);
      });
  }
}
