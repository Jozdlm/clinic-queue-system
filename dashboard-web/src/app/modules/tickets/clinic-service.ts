import { inject, Injectable } from '@angular/core';
import { API_URL } from '../../di-tokens';
import { map, Observable } from 'rxjs';
import { Clinic, ClinicList } from './clinic-dto';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../../api';

@Injectable({
  providedIn: 'root',
})
export class ClinicService {
  private apiUrl = inject(API_URL);
  private http = inject(HttpClient);

  public getClinicList(): Observable<Clinic[]> {
    return this.http
      .get<ApiResponse<ClinicList>>(`${this.apiUrl}/clinics`)
      .pipe(map((res) => res.data.clinics));
  }
}
