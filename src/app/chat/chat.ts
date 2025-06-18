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
  selector: 'app-chat',
  imports: [
    CommonModule, 
    FormsModule, 
    InputTextModule, 
    ButtonModule,
    SidebarModule,
    MenuModule,
    RouterModule
  ],
  templateUrl: './chat.html',
  styleUrl: './chat.css'
})
export class Chat {

  constructor(private router: Router,private firebaseService: Firebase) {}

  menuOpen = false;
  selectedItem = 'Inicio'
  agentes: any[] = [];
  
  agenteSeleccionadoDescripcion: string = '';


  ngOnInit(): void {
    this.firebaseService.getAgentes().subscribe(data => {
      this.agentes = data;
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

  seleccionarAgente(agente: any) {
    this.agenteSeleccionadoDescripcion = agente.descripcion;

    // Si quieres pasar la descripción al siguiente componente, puedes guardarla en localStorage o en un servicio
    localStorage.setItem('descripcionAgente', agente.descripcion);
    console.log(agente.descripcion)

    this.router.navigate(['/asistente']);
  }

}
