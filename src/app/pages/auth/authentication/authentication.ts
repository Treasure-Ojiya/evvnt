import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';

import { AuthService } from '../../../core/services/auth-service/auth-service';
import { ToastService } from '../../../core/services/toast-service/toast-service';
import { AccountType, LoginModel, RegModel } from '../../../app-model/model';

@Component({
  selector: 'app-authentication',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './authentication.html',
  styleUrls: ['./authentication.css'],
})
export class Authentication {
  backgroundImage = 'assets/hero-2.jpg';
  backgroundSize = 'cover';
  backgroundPosition = 'center';

  showPassword = false;
  isLoginSubmitting = false;
  isRegisterSubmitting = false;
  isLogin = true;
  loader = false;

  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);

  loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  registerForm = this.formBuilder.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    account_type: ['individual' as AccountType, Validators.required],
    organization: [''],
  });

  readonly accountTypes: { id: AccountType; label: string; hint: string }[] = [
    {
      id: 'individual',
      label: 'Individual',
      hint: 'Find, book and host events',
    },
    {
      id: 'organization',
      label: 'Organization',
      hint: 'Host events as a team or company',
    },
  ];

  constructor() {
    this.registerForm.controls.account_type.valueChanges.subscribe((type) =>
      this.syncOrganizationValidator(type),
    );
  }

  get accountType(): AccountType {
    return this.registerForm.controls.account_type.value ?? 'individual';
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  setAccountType(type: AccountType): void {
    this.registerForm.controls.account_type.setValue(type);
  }

  private syncOrganizationValidator(type: AccountType | null): void {
    const control = this.registerForm.controls.organization;

    if (type === 'organization') {
      control.setValidators(Validators.required);
    } else {
      control.clearValidators();
      control.setValue('');
    }

    control.updateValueAndValidity();
  }

  showLoginForm(): void {
    this.isLogin = true;
  }

  showRegisterForm(): void {
    this.isLogin = false;
  }

  onLogin(): void {
    if (this.loginForm.invalid || this.isLoginSubmitting) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoginSubmitting = true;

    const loginData = this.loginForm.getRawValue() as LoginModel;

    this.authService.loginUser(loginData).subscribe({
      next: (res) => {
        this.isLoginSubmitting = false;

        if (res.status === 'success') {
          localStorage.setItem('access_token', res.access_token);
          this.authService.setLoggedIn();
          this.toastService.show('Signed in successfully.', 'success');
          this.router.navigate(['/home']);
        } else {
          console.error('Login failed:', res.message);
          this.toastService.show(
            res.message || 'Login failed. Please try again.',
            'error',
            5000,
          );
        }
      },

      error: (error) => {
        this.isLoginSubmitting = false;
        console.error('Login API error:', error);
        this.toastService.show(
          this.errorText(
            error,
            'We could not sign you in. Please check your details and try again.',
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

    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((d) => `${(d.loc ?? []).slice(1).join('.') || 'field'}: ${d.msg}`)
        .join(' | ');
    }

    return error?.error?.message ?? fallback;
  }

  onRegister(): void {
    if (this.registerForm.invalid || this.isRegisterSubmitting) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isRegisterSubmitting = true;

    const value = this.registerForm.getRawValue();

    const registerData: RegModel = {
      email: value.email!.trim(),
      first_name: value.first_name!.trim(),
      last_name: value.last_name!.trim(),
      phone: value.phone!.trim(),
      password: value.password!,
      account_type: value.account_type!,
      ...(value.account_type === 'organization'
        ? { organization: value.organization!.trim() }
        : {}),
    };

    this.authService.registerUser(registerData).subscribe({
      next: (res) => {
        this.isRegisterSubmitting = false;

        console.log('Registration response:', res);
        this.toastService.show(
          'Account created! Please verify your email, login.',
          'success',
          6000,
        );
        this.showLoginForm();
      },

      error: (error) => {
        this.isRegisterSubmitting = false;

        console.error('Registration API error:', error);

        this.toastService.show(
          this.errorText(
            error,
            'We could not create your account. Please try again.',
          ),
          'error',
          6000,
        );
      },
    });
  }
}
