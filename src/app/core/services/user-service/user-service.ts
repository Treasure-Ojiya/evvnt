import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserModel } from '../../../app-model/model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = environment.BASE_URL;

  constructor(private http: HttpClient) {}

  getUser(): Observable<UserModel> {
    return this.http.get<UserModel>(`${this.baseUrl}/auth/me`);
  }
}
