import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth-service/auth-service';
import { ToastService } from '../../../core/services/toast-service/toast-service';
import { ForgotPasswordModel } from '../../../app-model/model';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private authService = inject(AuthService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private toastService = inject(ToastService);

  isSubmitting = false;

  forgotPasswordForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onForgotPassword() {
    if (this.forgotPasswordForm.invalid || this.isSubmitting) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const data = this.forgotPasswordForm.value as ForgotPasswordModel;

    this.authService.forgotPassword(data).subscribe({
      next: (res) => {
        console.log('Forgot password response:', res);

        this.isSubmitting = false;
        this.toastService.show(
          'Reset token sent. Choose a new password.',
          'success',
        );

        this.router.navigate(['/auth/reset-password'], {
          state: {
            resetToken: res.reset_token,
          },
        });
      },

      error: (error) => {
        console.error('Forgot password error:', error);

        this.isSubmitting = false;
        this.toastService.show(
          this.errorText(
            error,
            'We could not send a reset token. Please check the email and try again.',
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
