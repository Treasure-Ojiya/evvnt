import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, finalize } from 'rxjs';
import {
  RegModel,
  RegResult,
  LoginModel,
  LoginResult,
  ForgotPasswordModel,
  ForgotPasswordResult,
  ResetPasswordModel,
  ResetPasswordResult,
  RefreshResult,
} from '../../../app-model/model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}

  private baseUrl = environment.BASE_URL;

  private loggedInSubject = new BehaviorSubject<boolean>(
    !!localStorage.getItem('access_token'),
  );

  isLoggedIn$ = this.loggedInSubject.asObservable();

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  registerUser(user: RegModel): Observable<RegResult> {
    return this.http.post<RegResult>(`${this.baseUrl}/auth/register`, user);
  }

  loginUser(user: LoginModel): Observable<LoginResult> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    return this.http.post<LoginResult>(`${this.baseUrl}/auth/login`, user, {
      headers,
    });
  }

  refreshToken(): Observable<RefreshResult> {
    const refreshToken = localStorage.getItem('refresh_token');

    return this.http.post<RefreshResult>(`${this.baseUrl}/auth/refresh`, {
      refresh_token: refreshToken,
    });
  }

  logoutUser(): Observable<any> {
    const refreshToken = localStorage.getItem('refresh_token');

    return this.http
      .post(`${this.baseUrl}/auth/logout`, {
        refresh_token: refreshToken,
      })
      .pipe(
        finalize(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');

          this.loggedInSubject.next(false);
        }),
      );
  }

  setLoggedIn(): void {
    this.loggedInSubject.next(true);
  }

  forgotPassword(user: ForgotPasswordModel): Observable<ForgotPasswordResult> {
    return this.http.post<ForgotPasswordResult>(
      `${this.baseUrl}/auth/forgot-password`,
      user,
    );
  }

  resetPassword(user: ResetPasswordModel): Observable<ResetPasswordResult> {
    return this.http.patch<ResetPasswordResult>(
      `${this.baseUrl}/auth/reset-password`,
      user,
    );
  }
}
