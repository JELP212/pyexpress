import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { Firebase } from '../services/firebase';
import { MessagesModule } from 'primeng/messages';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
@Component({
  selector: 'app-registro',
  imports: [
    CommonModule, 
    FormsModule, 
    InputTextModule, 
    ButtonModule,MessagesModule,ToastModule
  ],
  providers: [MessageService],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {

  carreras: any[] = [];
  correo = '';
  password = '';
  carreraSeleccionada: string = '';
  nombres = '';
  apellidos = '';

  edad = '';
  carreraSeleccionadaId = '';

  constructor(private router: Router,private firebaseService: Firebase,private messageService: MessageService) {}
  ngOnInit(): void {
    this.firebaseService.getCarreras().subscribe((data) => {
      this.carreras = data;
    });
  }

  verPassword: boolean = false;
  puntos: number = 0;
  
  irAFormulario() {
    this.router.navigate(['/formulario']);
  }
  
  registrarUsuario(): void {
    if (
      !this.nombres || !this.apellidos || !this.correo || !this.password ||
      !this.edad || !this.carreraSeleccionadaId
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos incompletos',
        detail: 'Por favor completa todos los campos.',
        life: 3000
      });
      return;
    }
  
    const nuevoUsuario = {
      nombres: this.nombres,
      apellidos: this.apellidos,
      correo: this.correo,
      password: this.password,
      edad: this.edad,
      carreraId: this.carreraSeleccionadaId,
      puntos: this.puntos
    };
  
    this.firebaseService.crearUsuario(nuevoUsuario)
      .then((docRef) => {
        const usuarioId = docRef.id;
  
        // Guardar en cookies
        document.cookie = `usuarioId=${usuarioId}; path=/`;
        document.cookie = `nombres=${encodeURIComponent(this.nombres)}; path=/`;
        document.cookie = `apellidos=${encodeURIComponent(this.apellidos)}; path=/`;
        document.cookie = `puntos=${encodeURIComponent(this.puntos)}; path=/`;
        document.cookie = `password=${encodeURIComponent(this.password)}; path=/`;
  
        this.messageService.add({
          severity: 'success',
          summary: 'Registro exitoso',
          detail: 'Usuario registrado correctamente 🎉',
          life: 3000
        });
  
        // Limpiar campos
        this.nombres = '';
        this.apellidos = '';
        this.correo = '';
        this.password = '';
        this.edad = '';
        this.carreraSeleccionadaId = '';
        this.puntos = 0;
  
        // Esperar un poco para que el mensaje se muestre antes de redirigir
        setTimeout(() => {
          this.router.navigate(['/formulario']);
        }, 1000);
      })
      .catch((error) => {
        console.error('Error al registrar:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ocurrió un error al registrar el usuario.',
          life: 3000
        });
      });
  }
  
}
