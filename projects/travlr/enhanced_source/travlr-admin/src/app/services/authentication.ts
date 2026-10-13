import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private apiURL = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  public login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiURL}/login`, credentials);
  }

  public saveToken(token: string): void {
    localStorage.setItem('travlr-token', token);
  }

  public getToken(): string | null {
    return localStorage.getItem('travlr-token');
  }

  public logout(): void {
    localStorage.removeItem('travlr-token');
    window.location.href = '/login';
  }

  public isLoggedIn(): boolean {
    return this.getToken() !== null;
  }
}