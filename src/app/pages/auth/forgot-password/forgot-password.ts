import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth-service/auth-service';
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

  forgotPasswordForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onForgotPassword() {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    const data = this.forgotPasswordForm.value as ForgotPasswordModel;

    this.authService.forgotPassword(data).subscribe({
      next: (res) => {
        console.log('Forgot password response:', res);

        this.router.navigate(['/auth/reset-password'], {
          state: {
            resetToken: res.reset_token,
          },
        });
      },

      error: (error) => {
        console.error('Forgot password error:', error);
      },
    });
  }
}
