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
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-tienda',
  imports: [
    CommonModule, 
    FormsModule, 
    InputTextModule, 
    ButtonModule,
    SidebarModule,
    MenuModule,
    RouterModule
  ],
  templateUrl: './tienda.html',
  styleUrl: './tienda.css'
})
export class Tienda {
  constructor(private router: Router,private firebaseService: Firebase,private cookieService: CookieService,) {}
  menuOpen = false;
  selectedItem = 'Inicio'
  articulosPorCategoria: { [key: string]: any[] } = {};
  objectKeys = Object.keys;

  ngOnInit(): void {
    const partes = this.router.url.split('/');
    const matchedItem = this.menuItems.find(item => item.routerLink === '/' + partes[partes.length - 1]);
    if (matchedItem) {
      this.selectedItem = matchedItem.label;
    }
    this.firebaseService.getArticulosConCategorias().subscribe((articulos) => {
      this.articulosPorCategoria = {};
  
      for (const articulo of articulos) {
        const categoria = articulo.nombreCategoria || 'Sin categoría';
        if (!this.articulosPorCategoria[categoria]) {
          this.articulosPorCategoria[categoria] = [];
        }
        this.articulosPorCategoria[categoria].push(articulo);
      }
  
      console.log('Agrupado por categoría:', this.articulosPorCategoria);
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

  comprarArticulo(articulo: any): void {
    const usuarioId = this.cookieService.get('usuarioId');
  
    if (!usuarioId) {
      alert('Usuario no identificado.');
      return;
    }
  
    this.firebaseService.verificarCompra(usuarioId, articulo.nombre).then(async (yaComprado) => {
      if (yaComprado) {
        alert('Ya has comprado este artículo.');
        return;
      }
  
      try {
        const usuarioData = await firstValueFrom(this.firebaseService.obtenerUsuario(usuarioId));
        const puntosActuales = usuarioData?.puntos || 0;
  
        if (puntosActuales < articulo.costo) {
          alert('No tienes suficientes puntos para comprar este artículo.');
          return;
        }
  
        const compra = {
          usuarioId: usuarioId,
          nombre: articulo.nombre,
          imagen: articulo.imagen,
          costo: articulo.costo,
          categoria: articulo.idCategoria,
          fechaCompra: new Date()
        };
  
        await this.firebaseService.registrarCompra(compra);
        const nuevosPuntos = puntosActuales - articulo.costo;
  
        await this.firebaseService.actualizarPuntosUsuario(usuarioId, nuevosPuntos);
  
        // ✅ Actualizar los puntos en las cookies
        this.cookieService.set('puntos', nuevosPuntos.toString());
  
        alert('¡Compra realizada con éxito!');
      } catch (error) {
        console.error('Error durante la compra:', error);
      }
    }).catch(err => {
      console.error('Error verificando compra:', err);
      alert('Ocurrió un error verificando la compra.');
    });
  }
  
  
}
