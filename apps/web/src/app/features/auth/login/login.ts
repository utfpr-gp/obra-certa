import {Component, inject} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Auth} from '../../../core/services/auth';
import { LucideEye, LucideEyeOff } from '@lucide/angular';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideEye,
    LucideEyeOff
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private authService = inject(Auth);
  readonly sessionExpired = toSignal(inject(ActivatedRoute).queryParamMap.pipe(
    map((params) => params.get('reason') === 'session-expired'),
  ), { initialValue: false });

  isLoading = false;
  errorMessage = '';
  showPassword = false;

  form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  togglePassword():void {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.form.invalid || this.isLoading)
      return;

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.form.value;

    this.authService.login(email!, password!).subscribe({
      next: () => this.router.navigate(['/home']),
      error: () => {
        this.errorMessage = 'E-mail ou senha inválida';
        this.isLoading = false;
      }
    });
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }
}
