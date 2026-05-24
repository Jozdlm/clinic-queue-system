import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from '../../di-tokens';
import { map, Observable } from 'rxjs';
import { ReportByStatus, ReportByClinic, ByClinic, ByStatus } from './report-dto';
import { ApiResponse } from '../../api';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private http = inject(HttpClient);
  private apiUrl = inject(API_URL);
  public chartBgColors = ['#14b8a6', '#f59e0b', '#3b82f6', '#ef4444'];

  public getReportByStatus(): Observable<ByStatus[]> {
    return this.http
      .get<ApiResponse<ReportByStatus>>(`${this.apiUrl}/admin/reports/by-status`)
      .pipe(
        map((res) => res.data.report),
        map((report) =>
          report.map((item, index) => {
            return {
              status: item.status.replace('_', ' '),
              value: item.total,
              color: this.chartBgColors[index],
            };
          }),
        ),
      );
  }

  public getReportByClinic(): Observable<ByClinic[]> {
    return this.http
      .get<ApiResponse<ReportByClinic>>(`${this.apiUrl}/admin/reports/by-clinic`)
      .pipe(
        map((res) => res.data.report),
        map((report) =>
          report.map((item) => {
            return {
              clinic: item.clinic_name,
              tickets: item.total,
            };
          }),
        ),
      );
  }
}
