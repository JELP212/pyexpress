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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { CookieService } from 'ngx-cookie-service';

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
  @ViewChild('escenaRef', { static: false }) escenaRef!: ElementRef;
  isExporting = false;

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
    'https://media.istockphoto.com/id/1481024454/es/vector/parque-infantil-para-el-concepto-de-juego-infantil-ilustraci%C3%B3n-de-dise%C3%B1o-gr%C3%A1fico-vectorial.jpg?s=612x612&w=0&k=20&c=KY8wH9i7caWJj1p7vBHBesyiSobJwnxK8zWjSvuavVQ=',
    'https://static.vecteezy.com/system/resources/previews/001/630/637/non_2x/city-street-flat-background-vector.jpg',
    'https://thumbs.dreamstime.com/b/construcci%C3%B3n-de-escuelas-dibujos-animados-volver-la-escuela-plano-concepto-educativo-ilustraci%C3%B3n-vectorial-192262653.jpg',
    'https://thumbs.dreamstime.com/b/interior-de-sala-estar-dibujos-animados-dise%C3%B1o-%C3%A1rea-sof%C3%A1-vac%C3%ADo-plano-moderno-sal%C3%B3n-apartamentos-con-moqueta-mobiliario-211935946.jpg'
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

  constructor(private router: Router,private firebaseService: Firebase,private cookieService: CookieService) {}

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
    this.cuerpoSeleccionado = this.articulosCuerpo[0] || null;
    this.cabezaSeleccionada = this.articulosCabeza[0] || null;
    this.rostroSeleccionado = this.articulosRostro[0] || null;
    this.mensajePersonaje = '';
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
    localStorage.clear();
    this.cookieService.deleteAll('/');
    this.router.navigate(['/login']);
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }


  waitForImagesToLoad(container: HTMLElement): Promise<void> {
    const images = Array.from(container.querySelectorAll('img'));
    const promises = images.map(img => {
      return new Promise<void>(resolve => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }
      });
    });
    return Promise.all(promises).then(() => {});
  }

  renderizarPersonajeComoImagen(elemento: ElementoCanvas): Promise<HTMLImageElement> {
    return new Promise(async (resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = elemento.ancho;
      canvas.height = elemento.alto;
      const ctx = canvas.getContext('2d');
  
      if (!ctx) {
        return reject(new Error("No se pudo obtener el contexto 2D del canvas."));
      }
  
      // 1. Definimos las reglas de estilo (traducidas de tu CSS a un objeto)
      const styles = {
        cuerpo: { top: 0.50, left: 0.01, width: 0.65, height: 0.65 },
        cabeza: { top: 0.03, left: 0.07, width: 0.65, height: 0.65 },
        rostro: { top: 0.24, left: 0.28, width: 0.38, height: 0.38 },
      };
      const flippedStyles = {
        cabeza: { top: 0.01, left: -0.06 },
        rostro: { top: 0.22, left: 0.01 },
      };
      
      // Definimos un tipo explícito para las llaves de nuestro objeto de estilos.
      type CapaTipo = keyof typeof styles;
  
      // CORRECCIÓN 1: Se define el array con el tipo explícito ANTES de filtrar.
      // Esto asegura que TypeScript no pierda el tipo específico ('cuerpo' | 'cabeza' | 'rostro')
      // después de la operación .filter().
      const capasInfoConTipo: { tipo: CapaTipo; url: string; zIndex: number }[] = [
        { tipo: 'cuerpo', url: elemento.cuerpo.imagen, zIndex: 10 },
        { tipo: 'cabeza', url: elemento.cabeza.imagen, zIndex: 20 },
        { tipo: 'rostro', url: elemento.rostro.imagen, zIndex: 30 },
      ];
      
      const capasInfo = capasInfoConTipo.filter(capa => capa.url);
  
      try {
        // 2. Cargamos todas las imágenes de las capas en paralelo para mayor eficiencia
        const imagenesCargadas = await Promise.all(
          capasInfo.map(async (capa) => {
            const response = await fetch(capa.url);
            if (!response.ok) throw new Error(`Falló la carga de: ${capa.url}`);
            const blob = await response.blob();
            const img = new Image();
            img.src = URL.createObjectURL(blob);
            await img.decode(); // Espera a que la imagen esté lista para usar
            URL.revokeObjectURL(img.src); // Libera memoria
            return { img, tipo: capa.tipo, zIndex: capa.zIndex };
          })
        );
        
        // Ordenamos por zIndex para asegurar el orden de dibujado correcto
        imagenesCargadas.sort((a, b) => a.zIndex - b.zIndex);
  
        // 3. Aplicamos la inversión horizontal (flip) a todo el canvas si es necesario
        if (elemento.direction === 'left') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
  
        // 4. Dibujamos cada capa aplicando sus estilos y respetando el aspect ratio
        imagenesCargadas.forEach(({ img, tipo }) => {
          // Ahora `tipo` es 'cuerpo' | 'cabeza' | 'rostro', lo cual es seguro.
          let layerStyle = { ...styles[tipo] };
  
          // CORRECCIÓN 2: Usamos una aserción de tipo para `flippedStyles[tipo]`.
          // La comprobación `tipo in flippedStyles` garantiza en tiempo de ejecución que `tipo` es
          // 'cabeza' o 'rostro', pero necesitamos la aserción para que TypeScript lo entienda en tiempo de compilación.
          if (elemento.direction === 'left' && tipo in flippedStyles) {
            layerStyle = { ...layerStyle, ...flippedStyles[tipo as keyof typeof flippedStyles] };
          }
  
          // Dimensiones del contenedor de la capa (en píxeles)
          const boxX = canvas.width * layerStyle.left;
          const boxY = canvas.height * layerStyle.top;
          const boxWidth = canvas.width * layerStyle.width;
          const boxHeight = canvas.height * layerStyle.height;
  
          // Lógica para simular `object-fit: contain`
          const imgRatio = img.naturalWidth / img.naturalHeight;
          const boxRatio = boxWidth / boxHeight;
          let finalWidth, finalHeight;
  
          if (imgRatio > boxRatio) {
            finalWidth = boxWidth; 
            finalHeight = boxWidth / imgRatio;
          } else {
            finalHeight = boxHeight; 
            finalWidth = boxHeight * imgRatio;
          }
  
          const finalX = boxX + (boxWidth - finalWidth) / 2;
          const finalY = boxY + (boxHeight - finalHeight) / 2;
          
          ctx.drawImage(img, finalX, finalY, finalWidth, finalHeight);
        });
  
        const finalImg = new Image();
        finalImg.src = canvas.toDataURL('image/png');
        finalImg.style.position = 'absolute';
        finalImg.style.left = `${elemento.x}px`;
        finalImg.style.top = `${elemento.y}px`;
        finalImg.style.width = `${elemento.ancho}px`;
        finalImg.style.height = `${elemento.alto}px`;
        finalImg.style.zIndex = `${elemento.zIndex}`;
        
        resolve(finalImg);
  
      } catch (error) {
        console.error("Error al renderizar el personaje como imagen:", error);
        reject(error);
      }
    });
  }
  
  
  async exportarEscenaComoPDF(): Promise<void> {
    const escena = this.escenaRef.nativeElement;
    const personajes = this.escenaActual.elementos.filter(e => e.tipo === 'personaje');
  
    const originales = Array.from(escena.querySelectorAll('.personaje-container'));
    originales.forEach((el: any) => el.classList.add('ocultar-temporal'));
  
    const imgs = await Promise.all(personajes.map(p => this.renderizarPersonajeComoImagen(p)));
    imgs.forEach(img => escena.appendChild(img));
  
    await this.waitForImagesToLoad(escena);
  
    setTimeout(async () => {
      html2canvas(escena, { scale: 2, useCORS: true }).then(async (canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('mi-historieta.pdf');
  
        const usuarioId = this.cookieService.get('usuarioId');
        const puntosActuales = Number(this.cookieService.get('puntos')) || 0;
        const nuevosPuntos = puntosActuales + 2;
  
        this.cookieService.set('puntos', nuevosPuntos.toString());
  
        if (usuarioId) {
          await this.firebaseService.actualizarPuntosUsuario(usuarioId, nuevosPuntos);
          console.log('Puntos actualizados correctamente: +2');
        }
  
        imgs.forEach(img => img.remove());
        originales.forEach((el: any) => el.classList.remove('ocultar-temporal'));
      });
    }, 100);
  }
  
  async exportarTodasLasEscenasComoPDF(): Promise<void> {
    if (this.isExporting) return;
    if (this.escenas.length === 0) {
      console.warn("No hay escenas para exportar.");
      return;
    }

    this.isExporting = true;
    const escenaDOM = this.escenaRef.nativeElement;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px' });
    const originales = Array.from(escenaDOM.querySelectorAll('.personaje-container'));
    const fondoOriginal = escenaDOM.style.backgroundImage;

    try {
      originales.forEach((el: any) => el.style.visibility = 'hidden');

      for (const [index, escena] of this.escenas.entries()) {
        escenaDOM.style.backgroundImage = `url(${escena.fondo})`;
        const personajes = escena.elementos.filter(e => e.tipo === 'personaje');
        const imgsTemporales = await Promise.all(personajes.map(p => this.renderizarPersonajeComoImagen(p)));
        imgsTemporales.forEach(img => escenaDOM.appendChild(img));
  
        await this.waitForImagesToLoad(escenaDOM);
  
        const canvas = await html2canvas(escenaDOM, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });
        const imgData = canvas.toDataURL('image/png');
  
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  
        if (index === 0) {
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        } else {
          pdf.addPage([pdfWidth, pdfHeight], 'landscape');
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }
  
        imgsTemporales.forEach(img => img.remove());
      }
      
      pdf.save('mi-historieta-completa.pdf');
      
      await this.actualizarPuntosPorExportacion();

    } catch (error) {
      console.error("Ocurrió un error al exportar la historieta completa:", error);
    } finally {
      escenaDOM.style.backgroundImage = fondoOriginal;
      originales.forEach((el: any) => el.style.visibility = 'visible');
      this.isExporting = false;
    }
  }
  
  private async actualizarPuntosPorExportacion(): Promise<void> {
    const usuarioId = this.cookieService.get('usuarioId');
    if (usuarioId) {
      const puntosActuales = Number(this.cookieService.get('puntos')) || 0;
      const nuevosPuntos = puntosActuales + 2;
      this.cookieService.set('puntos', nuevosPuntos.toString());
      await this.firebaseService.actualizarPuntosUsuario(usuarioId, nuevosPuntos);
      console.log('Puntos actualizados: +2');
    }
  }
}
