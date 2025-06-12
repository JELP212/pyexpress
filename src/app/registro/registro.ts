import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { Firebase } from '../services/firebase';

@Component({
  selector: 'app-registro',
  imports: [
    CommonModule, 
    FormsModule, 
    InputTextModule, 
    ButtonModule
  ],
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

  constructor(private router: Router,private firebaseService: Firebase) {}
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
      alert('Por favor completa todos los campos.');
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
  
         // Guardar en cookie
        document.cookie = `usuarioId=${usuarioId}; path=/`;
        document.cookie = `nombres=${encodeURIComponent(this.nombres)}; path=/`;
        document.cookie = `apellidos=${encodeURIComponent(this.apellidos)}; path=/`;
        document.cookie = `puntos=${encodeURIComponent(this.puntos)}; path=/`;
        
        alert('Usuario registrado correctamente.');
  
        // Limpiar campos 
        this.nombres = '';
        this.apellidos = '';
        this.correo = '';
        this.password = '';
        this.edad = '';
        this.carreraSeleccionadaId = '';
        this.puntos= 0;
  
        // Navegar al formulario
        this.router.navigate(['/formulario']);
      })
      .catch((error) => {
        console.error('Error al registrar:', error);
      });
  }  

}
