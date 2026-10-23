import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError,
  finalize,
  Observable,
  shareReplay,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { AuthService } from '../services/auth-service/auth-service';
import { ToastService } from '../services/toast-service/toast-service';
import { environment } from '../../../environments/environment';

// Shared across all interceptor invocations — one refresh in flight at a time.
let refreshing$: Observable<string> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  const accessToken = localStorage.getItem('access_token');

  if (
    !accessToken ||
    !req.url.startsWith(environment.BASE_URL) ||
    req.url.endsWith('/auth/refresh') ||
    req.url.endsWith('/auth/logout')
  ) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${accessToken}` },
  });

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      // Reuse an in-flight refresh, or start one.
      if (!refreshing$) {
        refreshing$ = authService.refreshToken().pipe(
          switchMap((response) => {
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);
            return [response.access_token];
          }),
          catchError((refreshError) => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            authService.setLoggedOut();

            const currentUrl = router.url;
            if (currentUrl && !currentUrl.startsWith('/auth/')) {
              sessionStorage.setItem('postLoginRedirect', currentUrl);
            }

            toastService.show(
              'Session expired. Please sign in again.',
              'error',
              5000,
            );
            router.navigate(['/auth/authentication']);

            return throwError(() => refreshError);
          }),
          finalize(() => {
            refreshing$ = null;
          }),
          shareReplay(1),
        );
      }

      return refreshing$.pipe(
        take(1),
        switchMap((newToken) =>
          next(
            req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` },
            }),
          ),
        ),
      );
    }),
  );
};
