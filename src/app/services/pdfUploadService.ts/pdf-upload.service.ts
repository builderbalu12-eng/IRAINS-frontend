import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environment/environment';

@Injectable({
  providedIn: 'root'
})
export class PdfUploadService {

  private baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) { }

  uploadPdf(userId: number, pdfName: string, pdfType: string, pdfFile: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('userId', userId.toString());
    formData.append('document_name', pdfName);
    formData.append('document_type', pdfType);
    formData.append('pdfFile', pdfFile, pdfFile.name);

    return this.http.post(`${this.baseUrl}/api/v1/uploadPdf`, formData).pipe(
      catchError((error) => {
        console.error('Upload failed', error);
        return throwError(() => error);
      })
    );
  }

  // Fetch the actual PDF file by ID
  fetchPdf(documentId: number): void {
    const pdfUrl = `${this.baseUrl}/api/v1/getPdf/${documentId}`;
    this.http.get(pdfUrl, { responseType: 'blob' }).subscribe(
      (response) => {
        const blob = new Blob([response], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        window.open(url);
      },
      (error) => {
        console.error('Error fetching PDF:', error);
      }
    );
  }

  // 🔹 Fetch list of PDFs by document_type for dropdown
  fetchPdfsByType(documentType: string): Observable<any[]> {
    console.log('function')
    return this.http
      .get<any[]>(`${this.baseUrl}/api/v1/getPdfsByType?document_type=${encodeURIComponent(documentType)}`)
      .pipe(
        catchError((error) => {
          console.error('Error fetching PDFs by type:', error);
          return throwError(() => error);
        })
      );
  }


  getDocumentTypes(): Observable<any[]> {
    const url = `${this.baseUrl}/api/v1/getDocumentTypesAndNames`;
    return this.http.get<any>(url);
  }
}
