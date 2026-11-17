import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PasswordRecoveryService } from '../../../core/services/password-recovery.service';

@Component({
  selector: 'app-password-reset',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './password-reset.html',
})
export class PasswordReset {
  private readonly service = inject(PasswordRecoveryService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly token = new URLSearchParams(this.route.snapshot.fragment ?? '').get('token') ?? '';
  readonly busy = signal(false);
  readonly done = signal(false);
  readonly invalidLink = signal(!this.token);
  readonly error = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(72),
      (control: AbstractControl) => new TextEncoder().encode(control.value ?? '').length > 72 ? { passwordTooLong: true } : null,
      (control: AbstractControl) => control.value?.trim() ? null : { required: true }]],
    confirmPassword: ['', Validators.required],
  }, { validators: (control) => control.get('password')?.value === control.get('confirmPassword')?.value
      ? null : { passwordMismatch: true } });

  submit(): void {
    if (this.busy() || this.invalidLink() || this.done()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.busy.set(true);
    this.error.set('');
    this.service.reset(this.token, this.form.controls.password.value)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => {
          this.done.set(true);
          this.form.reset();
          this.location.replaceState('/redefinir-senha');
        },
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 400
              && error.error?.message === 'Este link é inválido ou expirou. Solicite um novo link.') {
            this.invalidLink.set(true);
            this.form.reset();
            return;
          }
          this.error.set('Não foi possível concluir a redefinição. Tente novamente.');
        },
      });
  }
}
