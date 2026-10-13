import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth-service/auth-service';
import { ToastService } from '../../../core/services/toast-service/toast-service';

@Component({
  selector: 'app-reset-password',
  imports: [RouterLink, ReactiveFormsModule],

  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {
  private authService = inject(AuthService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private toastService = inject(ToastService);

  resetToken = '';
  isSubmitting = false;

  resetPasswordForm = this.formBuilder.group({
    new_password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    const navigation = this.router.getCurrentNavigation();

    this.resetToken = navigation?.extras.state?.['resetToken'] ?? '';

    console.log('Reset token:', this.resetToken);
  }

  // The token only travels in navigation state, so a page refresh loses it.
  get hasToken(): boolean {
    return !!this.resetToken;
  }

  onResetPassword() {
    if (this.resetPasswordForm.invalid || this.isSubmitting) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    if (!this.resetToken) {
      console.error('No reset token available');
      this.toastService.show(
        'This reset session has expired. Please request a new token.',
        'warning',
        5000,
      );
      return;
    }

    this.isSubmitting = true;

    const data = {
      token: this.resetToken,
      new_password: this.resetPasswordForm.value.new_password!,
    };

    this.authService.resetPassword(data).subscribe({
      next: (res) => {
        console.log('Password reset response:', res);

        this.isSubmitting = false;
        this.toastService.show(
          'Password reset. You can now sign in.',
          'success',
        );
        this.router.navigate(['/auth/authentication']);
      },

      error: (error) => {
        console.error('Reset password error:', error);

        this.isSubmitting = false;
        this.toastService.show(
          this.errorText(
            error,
            'We could not reset your password. Please try again.',
          ),
          'error',
          5000,
        );
      },
    });
  }

  private errorText(error: any, fallback: string): string {
    const detail = error?.error?.detail;

    if (typeof detail === 'string') {
      return detail;
    }

    return error?.error?.message ?? fallback;
  }
}
