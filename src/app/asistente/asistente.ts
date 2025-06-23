import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SidebarModule } from 'primeng/sidebar'
import { MenuModule } from 'primeng/menu';
import { RouterModule } from '@angular/router';
import { Firebase } from '../services/firebase';
import { CookieService } from 'ngx-cookie-service';
import { MessagesModule } from 'primeng/messages';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-asistente',
  imports: [
    CommonModule, 
    FormsModule, 
    InputTextModule, 
    ButtonModule,
    SidebarModule,
    MenuModule,
    RouterModule,MessagesModule,ToastModule
  ],
  providers: [MessageService],
  templateUrl: './asistente.html',
  styleUrl: './asistente.css'
})
export class Asistente {

  audio = new Audio();
  audioEnReproduccion: string | null = null;
  estaPausado = false;
  estaEscribiendo = false;


  constructor(private router: Router, private zone: NgZone,private firebaseService: Firebase, private cookieService: CookieService,private messageService: MessageService) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'es-ES';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onresult = (event: any) => {
        const result = event.results[0][0].transcript;
        this.zone.run(() => {
          this.mensaje += ' ' + result;
        });
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event);
      };
    } else {
      alert('Tu navegador no soporta reconocimiento de voz.');
    }
  }

  ngOnInit(): void {
    const partes = this.router.url.split('/');
    const matchedItem = this.menuItems.find(item => item.routerLink === '/' + partes[partes.length - 1]);
    if (matchedItem) {
      this.selectedItem = matchedItem.label;
    }
  }
  
  menuOpen = false;
  selectedItem = 'Inicio'
  mensajes: { tipo: 'usuario' | 'chatgpt'; texto: string }[] = [];
  mensaje: string = '';
  recognition: any;
  
  menuItems = [
    { label: 'Inicio', icon: 'pi pi-home', routerLink: '/inicio' },
    { label: 'Tienda', icon: 'pi pi-shopping-cart',routerLink: '/tienda' },
    { label: 'Diagramas y historietas', icon: 'pi pi-sitemap', routerLink: '/diagrama' },
    { label: 'Chat con IA', icon: 'pi pi-comments', routerLink: '/chat' },
    { label: 'Mi avatar', icon: 'pi pi-user', routerLink: '/avatar'},
    { label: 'Configuraciones', icon: 'pi pi-cog', routerLink: '/configuraciones' },
    { label: 'Cerrar sesión', icon: 'pi pi-sign-out', command: () => this.logout() }
  ];
  
  logout() {
    localStorage.clear();
    this.cookieService.deleteAll('/');
    this.router.navigate(['/login']);
  }
  
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  selectMenuItem(label: string) {
    this.selectedItem = label;
    this.menuOpen = false;
  }

  startListening() {
    if (this.recognition) {
      this.recognition.start();
    }
  }
  
  async enviarMensaje() {
    const textoUsuario = this.mensaje.trim();
    if (!textoUsuario) return;
  
    this.mensajes.push({ tipo: 'usuario', texto: textoUsuario });
    this.mensaje = '';
  
    // ✅ VERIFICAR SI ES EL PRIMER MENSAJE DEL USUARIO
    const mensajesUsuario = this.mensajes.filter(m => m.tipo === 'usuario');
    if (mensajesUsuario.length === 1) {
      const usuarioId = this.cookieService.get('usuarioId');
      const puntosActuales = Number(this.cookieService.get('puntos')) || 0;
      const nuevosPuntos = puntosActuales + 2;
  
      // ✅ ACTUALIZAR COOKIES Y FIREBASE
      this.cookieService.set('puntos', nuevosPuntos.toString());
      if (usuarioId) {
        await this.firebaseService.actualizarPuntosUsuario(usuarioId, nuevosPuntos);
      }
    }
  
    // Leer la descripción desde localStorage
    const descripcionAgente = localStorage.getItem('descripcionAgente') || 'un asistente especializado';
  
    // Construir resumen del historial reciente de la conversación
    const historial = this.mensajes
      .slice(-6)
      .map(msg => `${msg.tipo === 'usuario' ? 'Usuario' : 'Asistente'}: ${msg.texto}`)
      .join('\n');
  
    const mensajeConContexto = `Te comunicarás con una persona que tiene TDA, entonces ayúdalo. Eres ${descripcionAgente}.
  Este es el historial reciente de la conversación:
  ${historial}
  
  El usuario acaba de decir: "${textoUsuario}"
  Responde de forma directa al usuario. No generes imágenes, videos ni otro tipo de multimedia. Máximo 500 caracteres.`;
  
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer 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'
    };
  
    const body = {
      model: "gpt-4.1-nano-2025-04-14",
      messages: [
        { role: "system", content: "Eres un asistente amigable que ayuda con claridad y paciencia." },
        { role: "user", content: mensajeConContexto }
      ]
    };
  
    this.estaEscribiendo = true;
  
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
  
      const data = await res.json();
      const respuesta = data.choices[0]?.message?.content || 'Sin respuesta';
      this.mensajes.push({ tipo: 'chatgpt', texto: respuesta });
  
    } catch (err) {
      console.error(err);
      this.mensajes.push({ tipo: 'chatgpt', texto: 'Error al contactar a OpenAI.' });
  
    } finally {
      this.estaEscribiendo = false;
    }
  }
  
  
  hablar(texto: string) {
    const synth = window.speechSynthesis;
  
    // Si ya está hablando, detenerlo o pausarlo
    if (synth.speaking) {
      synth.cancel();
      return;
    }
  
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-PE'; // Español Perú o usa 'es-ES' o 'es-MX' según tu preferencia
    synth.speak(utterance);
  }
  
}
