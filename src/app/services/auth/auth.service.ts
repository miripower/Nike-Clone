import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface LoginResponse {
  id: number;
  email: string;
  token: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:3000/api';

  userIdSignal = signal<number | null>(null); 
  loginStatus = signal<any>(null);  
  registerStatus = signal<any>(null);  
  roleSignal = signal<string | null>(null);
  private usernameSignal = signal<string | null>(null); 

  constructor(private http: HttpClient) {
    //Comprbación navegador
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('userId');
      const storedRole = localStorage.getItem('role');
      const storedToken = localStorage.getItem('token');
      if (storedRole && storedToken && storedUserId) {
        this.userIdSignal.set(Number(storedUserId));
        this.roleSignal.set(storedRole); 
        this.loginStatus.set({ email: '', token: storedToken, role: storedRole });
      }
    }
  }

  // Registrar un nuevo usuario
  register(email: string, password: string, role: string): void {
    this.http.post(`${this.apiUrl}/register`, { email, password, role }).subscribe({
      next: (response) => {
        this.registerStatus.set(response);
      },
      error: (err) => {
        this.registerStatus.set(err);
      }
    });
  }

  // Login de usuario
  login(email: string, password: string): void {
    this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).subscribe({
      next: (response) => {
        this.loginStatus.set(response);
        this.roleSignal.set(response.role);
        this.usernameSignal.set(response.email); 
        this.userIdSignal.set(response.id); 

        localStorage.setItem('username', response.email);
        localStorage.setItem('userId', response.id.toString());
        localStorage.setItem('role', response.role);
        localStorage.setItem('token', response.token);
      },
      error: (err) => {
        this.loginStatus.set(err);
        this.roleSignal.set(null);
      }
    });
  }

  getUsername() {
    return this.usernameSignal(); 
  }

  getRole() {
    return this.roleSignal();
  }

  getUserId() {
    return this.userIdSignal(); 
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token'); // Verifica si hay un token en el almacenamiento local
    return !!token; // Devuelve true si el token existe, false en caso contrario
  }

  getCurrentUser(): { id: number | null; email: string | null; role: string | null } {
    const userId = this.userIdSignal();
    const email = this.usernameSignal();
    const role = this.roleSignal();

    return {
      id: userId,
      email: email,
      role: role,
    };
  }

  logout(): void {
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('token');

    this.roleSignal.set(null);
    this.loginStatus.set(null);
    this.usernameSignal.set(null);
    this.userIdSignal.set(null);
  }
}