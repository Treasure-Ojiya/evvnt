import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  RegModel,
  RegResult,
  LoginModel,
  LoginResult,
  UserModel,
  UserResult,
  ForgotPasswordModel,
  ForgotPasswordResult,
  ResetPasswordModel,
  ResetPasswordResult,
} from '../../../app-model/model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}

  private authRegUrl = environment.AUTH_REG_URL;
  private authLoginUrl = environment.AUTH_LOGIN_URL;
  private userUrl = environment.USER_URL;
  private forgotPasswordUrl = environment.FORGOT_PASSWORD;
  private resetPasswordUrl = environment.RESET_PASSWORD;

  private loggedInSubject = new BehaviorSubject<boolean>(
    !!localStorage.getItem('access_token'),
  );

  isLoggedIn$ = this.loggedInSubject.asObservable();

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  registerUser(user: RegModel): Observable<RegResult> {
    return this.http.post<RegResult>(this.authRegUrl, user);
  }

  loginUser(user: LoginModel): Observable<LoginResult> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    return this.http.post<LoginResult>(this.authLoginUrl, user, { headers });
  }

  logoutUser(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');

    this.loggedInSubject.next(false);
  }

  setLoggedIn(): void {
    this.loggedInSubject.next(true);
  }

  getUser(): Observable<UserModel> {
    return this.http.get<UserModel>(this.userUrl);
  }

  forgotPassword(user: ForgotPasswordModel): Observable<ForgotPasswordResult> {
    return this.http.post<ForgotPasswordResult>(this.forgotPasswordUrl, user);
  }

  resetPassword(user: ResetPasswordModel): Observable<ResetPasswordResult> {
    return this.http.patch<ResetPasswordResult>(this.resetPasswordUrl, user);
  }
}
