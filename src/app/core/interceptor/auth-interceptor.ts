import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth-service/auth-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const accessToken = localStorage.getItem('access_token');

  if (
    !accessToken ||
    !req.url.startsWith('https://evvent-api.onrender.com') ||
    req.url.endsWith('/auth/refresh')
  ) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      return authService.refreshToken().pipe(
        switchMap((response) => {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);

          const retryReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${response.access_token}`,
            },
          });

          return next(retryReq);
        }),

        catchError((refreshError) => {
          authService.logoutUser();

          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
