import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SidebarModule } from 'primeng/sidebar'
import { MenuModule } from 'primeng/menu';
import { Firebase } from '../services/firebase';
import { RouterModule } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-avatar',
  imports: [
    CommonModule, 
    FormsModule, 
    InputTextModule, 
    ButtonModule,
    SidebarModule,
    MenuModule,
    RouterModule
  ],
  templateUrl: './avatar.html',
  styleUrl: './avatar.css'
})
export class Avatar {

  constructor(private router: Router,private firebaseService: Firebase,private cookieService: CookieService,) {}
  menuOpen = false;
  selectedItem = 'Inicio'
  articulosCabeza: any[] = [];
  articuloCabezaSeleccionadoId: string | null = null;
  articulosRostro: any[] = [];
  articuloRostroSeleccionadoId: string | null = null;
  articulosCuerpo: any[] = [];
  articuloCuerpoSeleccionadoId: string | null = null;
  
  cabezaSeleccionada: any = null;
  rostroSeleccionado: any = null;
  cuerpoSeleccionado: any = null;

  avatarPartes: any[] = [];

  vistaActual: 'apariencia' | 'accesorios' = 'apariencia';
  articulosAgrupadosPorCategoria: { [key: string]: any[] } = {};
  objectKeys = Object.keys;

  accesoriosSeleccionados: any[] = [];

  ngOnInit(): void {
    const usuarioId = this.cookieService.get('usuarioId');
    if (usuarioId) {
      this.firebaseService.getAvatarUsuario(usuarioId).subscribe((data) => {
        if (data.length > 0 && data[0]['avatar']) {
          const avatar = data[0]['avatar'];
  
          // Guardar partes
          this.avatarPartes = avatar;
  
          // Asignar seleccionados por categoría
          this.cabezaSeleccionada = avatar.find((p: any) => p.categoria === 'cabeza');
          this.rostroSeleccionado = avatar.find((p: any) => p.categoria === 'rostro');
          this.cuerpoSeleccionado = avatar.find((p: any) => p.categoria === 'cuerpo');
        }
        
      });
    }
    this.firebaseService.getArticulosApariencia().subscribe(data => {
      this.articulosCabeza = data.filter(a => a.categoria === 'head');
      this.articulosRostro = data.filter(a => a.categoria === 'face');
      this.articulosCuerpo = data.filter(a => a.categoria === 'body');
    });
    const partes = this.router.url.split('/');
    const matchedItem = this.menuItems.find(item => item.routerLink === '/' + partes[partes.length - 1]);
    if (matchedItem) {
      this.selectedItem = matchedItem.label;
    }
    this.firebaseService.getArticulosCompradosConCategoria(usuarioId).subscribe((articulos: any[]) => {
      this.articulosAgrupadosPorCategoria = {};
    
      for (const articulo of articulos) {
        const categoria = articulo.nombreCategoria || 'Sin categoría';
        if (!this.articulosAgrupadosPorCategoria[categoria]) {
          this.articulosAgrupadosPorCategoria[categoria] = [];
        }
        this.articulosAgrupadosPorCategoria[categoria].push(articulo);
      }
    });
  }

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
    this.router.navigate(['/login']);
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  selectMenuItem(label: string) {
    this.selectedItem = label;
    this.menuOpen = false;
  }

  seleccionarCabeza(articulo: any): void {
    this.cabezaSeleccionada = articulo;
  }

  seleccionarRostro(articulo: any): void {
    this.rostroSeleccionado = articulo;
  }
  
  seleccionarCuerpo(articulo: any): void {
    this.cuerpoSeleccionado = articulo;
  }

  guardarAvatar(): void {
    const usuarioId = this.cookieService.get('usuarioId');
    if (!usuarioId) {
      alert('Usuario no identificado.');
      return;
    }
  
    const avatar = [];
  
    if (this.cuerpoSeleccionado) {
      avatar.push({ categoria: 'cuerpo', imagen: this.cuerpoSeleccionado.imagen });
    }
    if (this.cabezaSeleccionada) {
      avatar.push({ categoria: 'cabeza', imagen: this.cabezaSeleccionada.imagen });
    }
    if (this.rostroSeleccionado) {
      avatar.push({ categoria: 'rostro', imagen: this.rostroSeleccionado.imagen });
    }
  
    // ✅ Agregamos los accesorios seleccionados
    this.accesoriosSeleccionados.forEach(accesorio => {
      avatar.push({
        categoria: accesorio.nombreCategoria,
        imagen: accesorio.imagen
      });
    });
  
    const avatarData = {
      usuarioId: usuarioId,
      avatar: avatar
    };
  
    this.firebaseService.guardarAvatarUsuario(avatarData)
      .then(() => {
        alert('Avatar guardado correctamente.');
        this.router.navigate(['/inicio']);
      })
      .catch((error) => {
        console.error('Error al guardar el avatar:', error);
      });
  }
  

  getCookie(nombre: string): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [clave, valor] = cookie.trim().split('=');
      if (clave === nombre) {
        return decodeURIComponent(valor);
      }
    }
    return null;
  }
  
  getImagen(categoria: string): string | null {
    const parte = this.avatarPartes.find(p => p.categoria === categoria);
    return parte ? parte.imagen : null;
  }

  seleccionarAccesorio(accesorio: any): void {
    const categoria = accesorio.nombreCategoria;
  
    // Reemplaza el accesorio anterior de la misma categoría
    const index = this.accesoriosSeleccionados.findIndex(
      (a) => a.nombreCategoria === categoria
    );
  
    if (index !== -1) {
      // Ya hay uno, reemplázalo
      this.accesoriosSeleccionados[index] = accesorio;
    } else {
      // No hay ninguno, agrégalo
      this.accesoriosSeleccionados.push(accesorio);
    }
  }

  getEstilosAccesorio(accesorio: any): any {
    const posicionesPorCategoria: Record<string, any> = {
      'Sombreros y gorras': { position: 'absolute', top: '-15px', left: '35%', width: '40px', height: '40px', 'z-index': 50 },
      'Lentes': { position: 'absolute', top: '27%', left: '23%', width: '80px', height: '50px', 'z-index': 60 },
      'Collares': { position: 'absolute', top: '65%', left: '45%', width: '30px', height: '30px', 'z-index': 70 },
      // Agrega más si tienes
    };
  
    return posicionesPorCategoria[accesorio.nombreCategoria] || {
      position: 'absolute', top: '50%', left: '50%', width: '30px', height: '30px', 'z-index': 40
    };
  }
  
}
