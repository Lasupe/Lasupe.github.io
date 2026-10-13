import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthenticationService } from '../services/authentication';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  credentials = {
    email: '',
    password: ''
  };

  message = '';

  constructor(private authService: AuthenticationService) {}

  onSubmit(): void {
    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        this.authService.saveToken(response.token);
        this.message = 'Login successful!';
        window.location.href = '/';
      },
      error: (err) => {
        console.error(err);
        this.message = 'Login failed. Please check your email and password.';
      }
    });
  }
}