import { Component, inject } from '@angular/core';
import { Location, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Auth } from '../../../core/services/auth';
import { LucideEye, LucideEyeOff, LucideArrowLeft } from '@lucide/angular';

function passwordMatchValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, NgClass, LucideEye, LucideEyeOff, LucideArrowLeft],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private location = inject(Location);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private authService = inject(Auth);

  isLoading = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  form = this.formBuilder.group(
    {
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator },
  );

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.form.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { name, email, password } = this.form.value;

    this.authService.register(name!, email!, password!).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => {
        const message = err.error?.message;
        this.errorMessage =
          err.status === 409 && typeof message === 'string' && message.trim()
            ? message
            : 'Erro ao registrar usuário. Tente novamente.';
        this.isLoading = false;
      },
    });
  }

  goBack(): void {
    this.location.back();
  }
}
