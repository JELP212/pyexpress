import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SidebarModule } from 'primeng/sidebar'
import { MenuModule } from 'primeng/menu';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-asistente',
  imports: [
    CommonModule, 
    FormsModule, 
    InputTextModule, 
    ButtonModule,
    SidebarModule,
    MenuModule,
    RouterModule
  ],
  templateUrl: './asistente.html',
  styleUrl: './asistente.css'
})
export class Asistente {
  constructor(private router: Router, private zone: NgZone) {
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
    localStorage.clear(); // o lo que uses para manejar sesión
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
  
    // Leer la descripción desde localStorage
    const descripcionAgente = localStorage.getItem('descripcionAgente') || 'un asistente especializado';
  
    // Crear mensaje inicial con contexto
    const mensajeConContexto = `Te comunicarás con una persona que tiene TDA, entonces ayúdalo. Eres ${descripcionAgente}. ${textoUsuario}`;
  
    const headers = {
      'Content-Type': 'application/json',
    };
  
    const body = {
      model: "gpt-4",
      messages: [
        { role: "system", content: "Eres un asistente amigable." },
        { role: "user", content: mensajeConContexto }
      ]
    };
  
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
    }
  }

  hablar(texto: string) {
    const speech = new SpeechSynthesisUtterance();
    speech.text = texto;
    speech.lang = 'es-PE'; // Puedes usar 'es-ES' si deseas español neutro
    speech.pitch = 1;
    speech.rate = 1;
    window.speechSynthesis.speak(speech);
  }
  
}
