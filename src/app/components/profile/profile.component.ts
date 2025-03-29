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

  constructor(private authService: AuthService, private http: HttpClient) {
    this.profileForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    });
  }

  ngOnInit(): void {
    // Cargar los datos del usuario actual
    const user = this.authService.getCurrentUser();
    if (user && user.email) {
      this.profileForm.patchValue({
        email: user.email,
      });
    }
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      const { email, password } = this.profileForm.value;
      const userId = this.authService.getUserId(); // Obtén el userId desde AuthService
  
      console.log('Datos enviados al servidor:', { email, password, userId });
  
      this.http.put('/api/users/profile', { email, password }, {
        headers: { userid: userId?.toString() || '' } // Incluye el userId en los encabezados
      }).subscribe({
        next: (response) => {
          console.log('Respuesta del servidor:', response);
          this.updateMessage = 'Perfil actualizado con éxito.';
          this.showModal = true; // Mostrar el modal al completar la acción
        },
        error: (err) => {
          console.error('Error al actualizar el perfil:', err);
          this.updateMessage = 'Error al actualizar el perfil.';
          this.showModal = true; // Mostrar el modal en caso de error
        },
      });
    } else {
      this.updateMessage = 'Por favor, corrige los errores en el formulario.';
      this.showModal = true; // Mostrar el modal si el formulario no es válido
    }
  }

  closeModal(): void {
    this.showModal = false; // Cerrar el modal
  }
}