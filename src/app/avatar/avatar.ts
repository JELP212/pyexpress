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

  constructor(private router: Router,private firebaseService: Firebase) {}
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

  ngOnInit(): void {
    this.firebaseService.getArticulosApariencia().subscribe(data => {
      // Filtramos solo los artículos cuya categoría sea "Cuerpo"
      this.articulosCabeza = data.filter(a => a.categoria === 'head');
      this.articulosRostro = data.filter(a => a.categoria === 'face');
      this.articulosCuerpo = data.filter(a => a.categoria === 'body');
    });
    const partes = this.router.url.split('/');
    const matchedItem = this.menuItems.find(item => item.routerLink === '/' + partes[partes.length - 1]);
    if (matchedItem) {
      this.selectedItem = matchedItem.label;
    }
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

  seleccionarCabeza(articulo: any): void {
    this.cabezaSeleccionada = articulo;
  }

  seleccionarRostro(articulo: any): void {
    this.rostroSeleccionado = articulo;
  }
  
  seleccionarCuerpo(articulo: any): void {
    this.cuerpoSeleccionado = articulo;
  }

  
  
}
