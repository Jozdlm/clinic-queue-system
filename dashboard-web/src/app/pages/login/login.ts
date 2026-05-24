import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideLock, LucideMail } from '@lucide/angular';
import { AuthService } from '../../modules/auth/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, LucideLock, LucideMail],
  templateUrl: './login.html',
  styles: ``,
})
export class Login {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  public loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.min(6)]],
  });

  public handleSubmit() {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;
    if (!email || !password) return;

    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/app']);
        }
      },
      error: (error) => {
        console.error(error);
      },
    });
  }
}
