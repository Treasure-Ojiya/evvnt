import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';

import { AuthService } from '../../../core/services/auth-service/auth-service';
import { LoginModel, RegModel } from '../../../app-model/model';

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
  });

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

    const registerData = this.registerForm.value as RegModel;

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
      },
    });
  }
}
