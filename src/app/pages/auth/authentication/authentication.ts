import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';

import { AuthService } from '../../../core/services/auth-service/auth-service';
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

  isLogin = true;
  loader = false;

  private authService = inject(AuthService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);

  // --- Login Form ---
  loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // --- Register Form ---
  registerForm = this.formBuilder.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    account_type: ['individual' as AccountType, Validators.required],
    organization: [''],
  });

  registerError = '';

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
    // The organization name is only required for organization accounts.
    this.registerForm.controls.account_type.valueChanges.subscribe((type) =>
      this.syncOrganizationValidator(type),
    );
  }

  get accountType(): AccountType {
    return this.registerForm.controls.account_type.value ?? 'individual';
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

  // --- Switch Tabs ---
  showLoginForm(): void {
    this.isLogin = true;
  }

  showRegisterForm(): void {
    this.isLogin = false;
  }

  // --- LOGIN LOGIC ---
  onLogin(): void {
    console.log('onLogin() called');

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loader = true;

    const loginData = this.loginForm.value as LoginModel;

    this.authService.loginUser(loginData).subscribe({
      next: (res) => {
        this.loader = false;

        console.log('Response from backend:', res);

        if (res.status === 'success') {
          localStorage.setItem('access_token', res.access_token);

          this.authService.setLoggedIn();

          this.router.navigate(['/home']);
        } else {
          console.log('Login failed:', res.message);
        }
      },

      error: (error) => {
        this.loader = false;

        console.error('Login API error:', error);
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

  // --- REGISTER LOGIC ---
  onRegister(): void {
    console.log('🔥 onRegister() FIRED');

    console.log('Form value:', this.registerForm.value);
    console.log('Form valid:', this.registerForm.valid);
    console.log('Form errors:', this.registerForm.errors);

    if (this.registerForm.invalid) {
      console.log('❌ Form is invalid');
      this.registerForm.markAllAsTouched();
      return;
    }

    console.log('✅ Form is valid — calling API');

    this.loader = true;

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

    this.registerError = '';

    console.log('📦 Registration payload:', registerData);

    this.authService.registerUser(registerData).subscribe({
      next: (res) => {
        this.loader = false;
        console.log('✅ Register API response:', res);

        alert('Registration successful! Please verify your email.');
        this.showLoginForm();
      },

      error: (error) => {
        this.loader = false;
        console.error('❌ Registration API error:', error);
        this.registerError = this.errorText(
          error,
          'We could not create your account. Please try again.',
        );
      },
    });
  }
}
