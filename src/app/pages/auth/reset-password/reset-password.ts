import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth-service/auth-service';

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

  resetToken = '';

  resetPasswordForm = this.formBuilder.group({
    new_password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    const navigation = this.router.getCurrentNavigation();

    this.resetToken = navigation?.extras.state?.['resetToken'] ?? '';

    console.log('Reset token:', this.resetToken);
  }

  onResetPassword() {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    if (!this.resetToken) {
      console.error('No reset token available');
      return;
    }

    const data = {
      token: this.resetToken,
      new_password: this.resetPasswordForm.value.new_password!,
    };

    this.authService.resetPassword(data).subscribe({
      next: (res) => {
        console.log('Password reset response:', res);

        this.router.navigate(['/auth/authentication']);
      },

      error: (error) => {
        console.error('Reset password error:', error);
      },
    });
  }
}
