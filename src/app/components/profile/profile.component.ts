import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ModalComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  updateMessage: string | null = null;
  showModal: boolean = false;
  user: { email: string } | null = null;
  currentPasswordError: string | null = null;

  constructor(private authService: AuthService, private http: HttpClient) {
    this.profileForm = new FormGroup({
      email: new FormControl('', [Validators.email]),
      password: new FormControl('', [Validators.minLength(6)]),
      currentPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
    });
  }

  ngOnInit(): void {
    const userId = this.authService.getUserId();

    if (!userId) {
      console.error('Usuario no autenticado.');
      return;
    }

    this.http.get<{ email: string }>(`http://localhost:3000/api/users/${userId}`).subscribe({
      next: (response) => {
        if (response.email) {
          this.user = response; 
          this.profileForm.patchValue({
            email: response.email,
          });
        }
      },
      error: (err) => {
        console.error('Error al obtener los datos del usuario:', err);
      },
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      const { email, password, currentPassword } = this.profileForm.value;
      const userId = this.authService.getUserId();
  
      // Crear un objeto con los campos que el usuario desea actualizar
      const updateData: any = { currentPassword }; // La contraseña actual siempre es obligatoria
      if (email?.trim()) updateData.email = email; // Solo incluir si no está vacío
      if (password?.trim()) updateData.password = password; // Solo incluir si no está vacío
  
      console.log('Datos enviados al servidor:', { ...updateData, userId });
  
      this.http.put('http://localhost:3000/api/users/profile', updateData, {
        headers: { userid: userId?.toString() || '' }
      }).subscribe({
        next: (response) => {
          console.log('Respuesta del servidor:', response);
          this.updateMessage = 'Perfil actualizado con éxito.';
          this.currentPasswordError = null;
          this.showModal = true;
  
          // Limpiar los campos de contraseña después de la actualización
          this.profileForm.get('password')?.reset();
          this.profileForm.get('currentPassword')?.reset();
        },
        error: (err) => {
          console.error('Error al actualizar el perfil:', err);
          if (err.status === 401 && err.error?.error === 'La contraseña actual es incorrecta.') {
            this.currentPasswordError = 'La contraseña actual es incorrecta.';
          } else {
            this.updateMessage = 'Error al actualizar el perfil.';
            this.showModal = true;
          }
          this.profileForm.get('currentPassword')?.reset();
        },
      });
    } else {
      this.updateMessage = 'Por favor, corrige los errores en el formulario.';
      this.showModal = true;
  
      this.profileForm.get('password')?.reset();
      this.profileForm.get('currentPassword')?.reset();
    }
  }

  closeModal(): void {
    this.showModal = false;
  }
}