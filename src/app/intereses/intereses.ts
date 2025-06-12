import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { Firebase } from '../services/firebase';

@Component({
  selector: 'app-intereses',
  imports: [
    CommonModule, 
    FormsModule, 
    InputTextModule, 
    ButtonModule
  ],
  templateUrl: './intereses.html',
  styleUrl: './intereses.css'
})
export class Intereses {
  constructor(private router: Router,private firebaseService: Firebase) {}
  
  interests: string[] = [];
  nombresUsuario: string = '';
  apellidosUsuario: string = '';
  puntosUsuario: string = '';

  selectedInterests: number[] = [];

  ngOnInit(): void {
    const nombresCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('nombres='));
  
    const apellidosCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('apellidos='));
  
    const puntosCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('puntos='));
  
    if (nombresCookie) {
      this.nombresUsuario = decodeURIComponent(nombresCookie.split('=')[1]);
    }
  
    if (apellidosCookie) {
      this.apellidosUsuario = decodeURIComponent(apellidosCookie.split('=')[1]);
    }

    if (puntosCookie) {
      this.puntosUsuario = decodeURIComponent(puntosCookie.split('=')[1]);
    }

    this.firebaseService.getIntereses().subscribe(data => {
      this.interests = data.map(item => item.nombre); // Suponiendo que cada documento tiene el campo 'nombre'
    });
  }
  
  toggleInterest(index: number): void {
    const i = this.selectedInterests.indexOf(index);
    if (i > -1) {
      this.selectedInterests.splice(i, 1);
    } else {
      this.selectedInterests.push(index);
    }
  }

  resetInterests(): void {
    this.selectedInterests = [];
  }

  enviarIntereses(): void {
    const usuarioId = localStorage.getItem('usuarioId');
    if (!usuarioId) {
      alert('No se encontró el ID del usuario.');
      return;
    }
  
    const interesesSeleccionados = this.selectedInterests.map(i => this.interests[i]);
    console.log('Intereses seleccionados:', interesesSeleccionados);
  
    this.firebaseService.guardarIntereses(usuarioId, interesesSeleccionados)
      .then(() => {
        this.router.navigate(['/inicio']);
      })
      .catch(error => {
        console.error('Error al guardar intereses:', error);
      });
  }
  
}
