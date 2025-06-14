import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { TabViewModule } from 'primeng/tabview';
import { Router } from '@angular/router';
import { Firebase } from '../services/firebase';
import { RouterModule } from '@angular/router';

// --- Interfaces para la estructura de datos ---
interface ArticuloApariencia {
  id: string;
  nombre: string;
  categoria: 'head' | 'face' | 'body';
  imagen: string;
}

interface ElementoCanvas {
  id: number;
  tipo: 'personaje';
  cuerpo: ArticuloApariencia;
  cabeza: ArticuloApariencia;
  rostro: ArticuloApariencia;
  mensaje: string;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  zIndex: number;
  direction: 'left' | 'right'; // Added direction property
}

interface Escena {
  fondo: string;
  elementos: ElementoCanvas[];
}

@Component({
  selector: 'app-diagrama',
  standalone: true,
  imports: [ RouterModule, CommonModule, FormsModule, InputTextModule, ButtonModule, PanelModule, TabViewModule ],
  templateUrl: './diagrama.html',
  styleUrls: ['./diagrama.css']
})
export class Diagrama implements OnInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLDivElement>;

  menuOpen = false;
  selectedItem = 'Inicio';
  menuItems = [
    { label: 'Inicio', icon: 'pi pi-home', routerLink: '/inicio' },
    { label: 'Tienda', icon: 'pi pi-shopping-cart',routerLink: '/tienda' },
    { label: 'Diagramas y historietas', icon: 'pi pi-sitemap', routerLink: '/diagrama' },
    { label: 'Chat con IA', icon: 'pi pi-comments', routerLink: '/chat' },
    { label: 'Mi avatar', icon: 'pi pi-user', routerLink: '/avatar'},
    { label: 'Configuraciones', icon: 'pi pi-cog', routerLink: '/configuraciones' },
    { label: 'Cerrar sesión', icon: 'pi pi-sign-out', command: () => this.logout() }
  ];
  // --- Propiedades del constructor ---
  escenas: Escena[] = [];
  escenaActualIndex = 0;
  articulosCabeza: ArticuloApariencia[] = [];
  articulosRostro: ArticuloApariencia[] = [];
  articulosCuerpo: ArticuloApariencia[] = [];
  cabezaSeleccionada: ArticuloApariencia | null = null;
  rostroSeleccionado: ArticuloApariencia | null = null;
  cuerpoSeleccionado: ArticuloApariencia | null = null;
  mensajePersonaje = '';
  fondosDisponibles: string[] = [
    'https://placehold.co/800x600/a2d2ff/ffffff?text=Parque',
    'https://placehold.co/800x600/ffc09f/ffffff?text=Calle',
    'https://placehold.co/800x600/fcf5c7/ffffff?text=Escuela',
    'https://placehold.co/800x600/a0c4ff/ffffff?text=Interior'
  ];

  // --- Propiedades de Interacción ---
  elementoSeleccionado: ElementoCanvas | null = null;
  notificacion = '';
  private notificacionTimeout: any;

  // --- Estado de la Interacción (arrastre y redimension) ---
  private modoInteraccion: 'arrastre' | 'redimension' | null = null;
  private esquinaRedimension: string | null = null;
  private puntoInicioX = 0;
  private puntoInicioY = 0;
  private anchoOriginal = 0;
  private altoOriginal = 0;
  private xOriginal = 0;
  private yOriginal = 0;

  indices = {
    cuerpo: 0,
    cabeza: 0,
    rostro: 0
  };

  constructor(private router: Router,private firebaseService: Firebase) {}

  ngOnInit(): void {
    this.agregarNuevaEscena();
    this.escenaActualIndex = 0;
    this.cargarArticulos();
    const partes = this.router.url.split('/');
    const matchedItem = this.menuItems.find(item => item.routerLink === '/' + partes[partes.length - 1]);
    if (matchedItem) {
      this.selectedItem = matchedItem.label;
    }
  }
  
  // --- Lógica de Carga y Gestión de Escenas ---
  cargarArticulos() {
    this.firebaseService.getArticulosApariencia().subscribe(data => {
      this.articulosCabeza = data.filter(a => a.categoria === 'head');
      this.articulosRostro = data.filter(a => a.categoria === 'face');
      this.articulosCuerpo = data.filter(a => a.categoria === 'body');

      this.cabezaSeleccionada = this.articulosCabeza[0] || null;
      this.rostroSeleccionado = this.articulosRostro[0] || null;
      this.cuerpoSeleccionado = this.articulosCuerpo[0] || null;
    });
  }

  seleccionarEscena(index: number): void {
    this.escenaActualIndex = index;
    this.elementoSeleccionado = null; // Deseleccionar al cambiar de escena
  }

  agregarNuevaEscena(): void {
    const nuevaEscena: Escena = { fondo: this.fondosDisponibles[0], elementos: [] };
    this.escenas.push(nuevaEscena);
    this.seleccionarEscena(this.escenas.length - 1);
  }

  get escenaActual(): Escena {
    return this.escenas[this.escenaActualIndex];
  }
  
  // --- Gestión de Selecciones y Creación ---
  seleccionarFondo(fondoUrl: string): void {
    if(this.escenaActual) this.escenaActual.fondo = fondoUrl;
  }

  seleccionarParte(parte: ArticuloApariencia): void {
    switch(parte.categoria) {
      case 'head': this.cabezaSeleccionada = parte; break;
      case 'face': this.rostroSeleccionado = parte; break;
      case 'body': this.cuerpoSeleccionado = parte; break;
    }
  }

  agregarPersonaje(): void {
    if (!this.cuerpoSeleccionado || !this.cabezaSeleccionada || !this.rostroSeleccionado) {
      this.mostrarNotificacion('Por favor, selecciona cuerpo, cabeza y rostro.');
      return;
    }
    const nuevoPersonaje: ElementoCanvas = {
      id: Date.now(), tipo: 'personaje',
      cuerpo: this.cuerpoSeleccionado, cabeza: this.cabezaSeleccionada, rostro: this.rostroSeleccionado,
      mensaje: this.mensajePersonaje, x: 50, y: 100, ancho: 180, alto: 200,
      zIndex: (this.escenaActual.elementos.length || 0) + 1,
      direction: 'right' // Default direction
    };
    this.escenaActual.elementos.push(nuevoPersonaje);
    this.cuerpoSeleccionado = null; this.cabezaSeleccionada = null; this.rostroSeleccionado = null; this.mensajePersonaje = '';
    this.mostrarNotificacion('¡Personaje añadido con éxito!', 'success');
  }

  // Method to change character direction
  cambiarDireccion(elemento: ElementoCanvas, direccion: 'left' | 'right'): void {
    if (elemento && elemento.tipo === 'personaje') {
      elemento.direction = direccion;
    }
  }

  // --- Lógica de Interacción con Elementos del Canvas ---
  seleccionarElemento(evento: Event, elemento: ElementoCanvas) {
    evento.stopPropagation();
    this.elementoSeleccionado = elemento;
    const maxZIndex = Math.max(...this.escenaActual.elementos.map(e => e.zIndex), 0);
    elemento.zIndex = maxZIndex + 1;
  }

  eliminarElementoSeleccionado() {
    if (!this.elementoSeleccionado) return;
    const index = this.escenaActual.elementos.findIndex(e => e.id === this.elementoSeleccionado!.id);
    if (index > -1) {
      this.escenaActual.elementos.splice(index, 1);
      this.elementoSeleccionado = null;
    }
  }

  deseleccionarTodo(evento: Event) {
    if (evento.target === this.canvasRef.nativeElement) {
      this.elementoSeleccionado = null;
    }
  }

  // --- Gestión de Arrastre y Redimension ---
  private getClientX(evento: MouseEvent | TouchEvent): number {
    return evento instanceof MouseEvent ? evento.clientX : evento.touches[0].clientX;
  }
  private getClientY(evento: MouseEvent | TouchEvent): number {
    return evento instanceof MouseEvent ? evento.clientY : evento.touches[0].clientY;
  }

  iniciarArrastre(evento: MouseEvent | TouchEvent, elemento: ElementoCanvas) {
    evento.stopPropagation();
    this.seleccionarElemento(evento, elemento);
    this.modoInteraccion = 'arrastre';
    const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.puntoInicioX = this.getClientX(evento) - canvasRect.left - elemento.x;
    this.puntoInicioY = this.getClientY(evento) - canvasRect.top - elemento.y;
  }

  iniciarRedimension(evento: MouseEvent | TouchEvent, elemento: ElementoCanvas, esquina: string) {
    evento.stopPropagation();
    this.modoInteraccion = 'redimension';
    this.esquinaRedimension = esquina;
    const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.puntoInicioX = this.getClientX(evento) - canvasRect.left;
    this.puntoInicioY = this.getClientY(evento) - canvasRect.top;
    this.anchoOriginal = elemento.ancho;
    this.altoOriginal = elemento.alto;
    this.xOriginal = elemento.x;
    this.yOriginal = elemento.y;
  }

  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:touchmove', ['$event'])
  manejarMovimiento(evento: MouseEvent | TouchEvent) {
    if (!this.modoInteraccion || !this.elementoSeleccionado) return;
    
    const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();
    const cursorX = this.getClientX(evento) - canvasRect.left;
    const cursorY = this.getClientY(evento) - canvasRect.top;

    if (this.modoInteraccion === 'arrastre') {
      let newX = cursorX - this.puntoInicioX;
      let newY = cursorY - this.puntoInicioY;
      newX = Math.max(0, Math.min(newX, canvasRect.width - this.elementoSeleccionado.ancho));
      newY = Math.max(0, Math.min(newY, canvasRect.height - this.elementoSeleccionado.alto));
      this.elementoSeleccionado.x = newX;
      this.elementoSeleccionado.y = newY;
    } else if (this.modoInteraccion === 'redimension') {
        const diffX = cursorX - this.puntoInicioX;
        const diffY = cursorY - this.puntoInicioY;
        const minSize = 50; // Minimum size

        if (this.esquinaRedimension?.includes('der')) {
            this.elementoSeleccionado.ancho = Math.max(minSize, this.anchoOriginal + diffX);
        }
        if (this.esquinaRedimension?.includes('inf')) {
            this.elementoSeleccionado.alto = Math.max(minSize, this.altoOriginal + diffY);
        }
        if (this.esquinaRedimension?.includes('izq')) {
            const nuevoAncho = Math.max(minSize, this.anchoOriginal - diffX);
            this.elementoSeleccionado.x = this.xOriginal + this.anchoOriginal - nuevoAncho;
            this.elementoSeleccionado.ancho = nuevoAncho;
        }
        if (this.esquinaRedimension?.includes('sup')) {
            const nuevoAlto = Math.max(minSize, this.altoOriginal - diffY);
            this.elementoSeleccionado.y = this.yOriginal + this.altoOriginal - nuevoAlto;
            this.elementoSeleccionado.alto = nuevoAlto;
        }
    }
  }

  @HostListener('document:mouseup', ['$event'])
  @HostListener('document:touchend', ['$event'])
  finalizarInteraccion(evento: Event) {
    this.modoInteraccion = null;
    this.esquinaRedimension = null;
  }

  // --- Sistema de Notificaciones ---
  mostrarNotificacion(mensaje: string, tipo: 'error' | 'success' = 'error') {
    if (this.notificacionTimeout) clearTimeout(this.notificacionTimeout);
    this.notificacion = mensaje;
    this.notificacionTimeout = setTimeout(() => { this.notificacion = ''; }, 3000);
  }

  cambiarIndice(tipo: 'cuerpo' | 'cabeza' | 'rostro', cambio: number) {
    let lista: any[] = [];
  
    switch (tipo) {
      case 'cuerpo': lista = this.articulosCuerpo; break;
      case 'cabeza': lista = this.articulosCabeza; break;
      case 'rostro': lista = this.articulosRostro; break;
    }
  
    const nuevoIndice = (this.indices[tipo] + cambio + lista.length) % lista.length;
    this.indices[tipo] = nuevoIndice;
    this.seleccionarParte(lista[nuevoIndice]);
  }

  logout() {
    localStorage.clear(); // o lo que uses para manejar sesion
    this.router.navigate(['/login']);
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
}
