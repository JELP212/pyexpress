import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { Firebase } from '../services/firebase';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-formulario',
  imports: [
    CommonModule, 
    FormsModule, 
    InputTextModule, 
    ButtonModule
  ],
  templateUrl: './formulario.html',
  styleUrl: './formulario.css'
})
export class Formulario {
  constructor(private router: Router,private firebaseService: Firebase,private cookieService: CookieService) {}

  preguntas = [
    {
      texto: '¿Te resulta difícil iniciar o mantener una conversación con otras personas?',
      opciones: ['Nunca', 'Frecuentemente', 'A veces', 'Siempre']
    },
    {
      texto: '¿Evita o tiene poco contacto visual durante una interacción?',
      opciones: ['Nunca', 'A veces', 'Frecuentemente', 'Siempre']
    },
    {
      texto: '¿Tiene dificultades para expresar o entender emociones en sí mismo o en los demás?',
      opciones: ['Nunca', 'A veces', 'Frecuentemente', 'Siempre']
    },
    {
      texto: '¿Suele interpretar literalmente frases o bromas?',
      opciones: ['Nunca', 'A veces', 'Frecuentemente', 'Siempre']
    },
    {
      texto: '¿Prefiere estar solo antes de participar en actividades sociales?',
      opciones: ['Nunca', 'A veces', 'Frecuentemente', 'Siempre']
    },
    {
      texto: '¿Tiende a hablar mucho sobre un tema de interés, sin notar si a los demás les interesa?',
      opciones: ['Nunca', 'A veces', 'Frecuentemente', 'Siempre']
    },
    {
      texto: '¿Repite frecuentemente movimientos como aleteo, balanceo o girar objetos?',
      opciones: ['Nunca', 'A veces', 'Frecuentemente', 'Siempre']
    },
    {
      texto: '¿Se altera facilmente cuando hay cambios en su rutina?',
      opciones: ['Nunca', 'A veces', 'Frecuentemente', 'Siempre']
    },
    {
      texto: '¿Tiene un interés muy intenso y muy específico en un tema o actividad?',
      opciones: ['Nunca', 'A veces', 'Frecuentemente', 'Siempre']
    },
    {
      texto: '¿Reacciona de forma exagerada a sonidos, luces o texturas?',
      opciones: ['Nunca', 'A veces', 'Frecuentemente', 'Siempre']
    },
    {
      texto: '¿Tiene dificultad para cambiar de una actividad a otra?',
      opciones: ['Nunca', 'A veces', 'Frecuentemente', 'Siempre']
    } 
    
  ];
  
  preguntaActualIndex = 0;
  opcionSeleccionada = '';
  respuestas: string[] = [];
  
  get preguntaActual() {
    return this.preguntas[this.preguntaActualIndex];
  }
  
  seleccionarOpcion(opcion: string) {
    this.opcionSeleccionada = opcion;
  }
  
  continuar() {
    this.respuestas.push(this.opcionSeleccionada);
    this.opcionSeleccionada = '';
  
    if (this.preguntaActualIndex < this.preguntas.length - 1) {
      this.preguntaActualIndex++;
    } else {
      // 🔢 Calcular nivel antes de guardar
      const resultado = this.calcularNivel();
      console.log('Puntaje total:', resultado.total);
      console.log('Nivel:', resultado.nivel);
      alert(`Puntaje total: ${resultado.total}\n${resultado.nivel}`);
  
      // 💾 Guardar en Firestore
      const usuarioId = this.cookieService.get('usuarioId');
      if (usuarioId) {
        this.firebaseService.guardarFormulario(usuarioId, this.respuestas, resultado.nivel)
          .then(() => {
            console.log('Formulario guardado con éxito');
            this.router.navigate(['/intereses']);
          })
          .catch(error => {
            console.error('Error al guardar formulario:', error);
          });
      } else {
        alert('No se encontró el ID del usuario');
      }
    }
  }  
  

  regresar() {
    if (this.preguntaActualIndex > 0) {
      this.preguntaActualIndex--;
      this.opcionSeleccionada = this.respuestas[this.preguntaActualIndex];
      this.respuestas.pop();
    }
  }

  esUltimaPregunta(): boolean {
    return this.preguntaActualIndex === this.preguntas.length - 1;
    
  }

  calcularNivel() {
    // Mapeo: respuesta textual → puntaje numérico
    const mapaPuntajes: { [clave: string]: number } = {
      'Nunca': 0,
      'A veces': 1,
      'Frecuentemente': 2,
      'Siempre': 3
    };
  
    // Sumar puntajes
    const puntajes = this.respuestas.map(r => mapaPuntajes[r] ?? 0);
    const total = puntajes.reduce((suma, valor) => suma + valor, 0);
  
    // Evaluar nivel
    let nivel = '';
    if (total >= 8 && total <= 14) {
      nivel = 'Nivel 1';
    } else if (total >= 15 && total <= 22) {
      nivel = 'Nivel 2';
    } else if (total >= 23 && total <= 33) {
      nivel = 'Nivel 3';
    } else {
      nivel = 'Sin nivel asignado'; // Por si está fuera de los rangos
    }
  
    // Mostrar en consola o usar en tu interfaz
    console.log('Total:', total);
    console.log('Nivel:', nivel);
  
    return { total, nivel };
  }
  
}
