import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PrimeIcons } from 'primeng/api';
import { Router } from '@angular/router';
import { Firebase } from '../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

@Component({
  selector: 'app-login',
  imports: [ 
    CommonModule, 
    FormsModule, 
    InputTextModule, 
    ButtonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  constructor(private router: Router,private firebaseService: Firebase) {}
  correo: string = '';
  password: string = '';

  verPassword: boolean = false;
  irARegistro() {
    this.router.navigate(['/registro']);
  }

  login() {
    const correo = (document.getElementById('correo') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;
    console.log('Correo ingresado:', correo);
    console.log('Password ingresado:', password);
    this.firebaseService.login(correo, password).then(usuario => {
      if (usuario) {
        // Guardar usuario en localStorage o hacer lo que necesites
        document.cookie = `nombres=${usuario.nombres}; path=/`;
        document.cookie = `apellidos=${usuario.apellidos}; path=/`;
        document.cookie = `usuarioId=${usuario.UsuarioId}; path=/`;
        document.cookie = `puntos=${usuario.puntos}; path=/`;
        document.cookie = `password=${usuario.password}; path=/`;
        this.router.navigate(['/inicio']);
      } else {
        alert('Credenciales inválidas');
      }
    });
  }
  
}
