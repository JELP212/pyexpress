import { Component } from '@angular/core';
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
  selector: 'app-configuraciones',
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
  templateUrl: './configuraciones.html',
  styleUrl: './configuraciones.css'
})
export class Configuraciones {
  constructor(private router: Router,private firebaseService: Firebase, private cookieService: CookieService,private messageService: MessageService) {}

  verPassword: boolean = false;
  menuOpen = false;
  selectedItem = 'Inicio'
  nombres: string = '';
  apellidos: string = '';
  password: string = '';
  
  guardarDatos(): void {
    // Guardar en cookies
    this.cookieService.set('nombres', this.nombres);
    this.cookieService.set('apellidos', this.apellidos);
    this.cookieService.set('password', this.password);
  
    // Obtener el ID del usuario desde las cookies
    const usuarioId = this.cookieService.get('usuarioId');
    if (!usuarioId) {
      this.messageService.add({
        severity: 'error',
        summary: 'ID no encontrado',
        detail: 'No se encontró el ID de usuario en las cookies.',
        life: 3000
      });
      return;
    }
  
    // Preparar los nuevos datos
    const nuevosDatos = {
      nombres: this.nombres,
      apellidos: this.apellidos,
      password: this.password
    };
  
    // Actualizar en Firebase
    this.firebaseService.actualizarDatosUsuario(usuarioId, nuevosDatos)
      .then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Datos actualizados',
          detail: 'Tus datos fueron actualizados correctamente ✅',
          life: 3000
        });
      })
      .catch((error) => {
        console.error('Error al actualizar en Firebase:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Hubo un error al actualizar tus datos. Intenta nuevamente.',
          life: 3000
        });
      });
  }
  

  ngOnInit(): void {
    const partes = this.router.url.split('/');
    const matchedItem = this.menuItems.find(item => item.routerLink === '/' + partes[partes.length - 1]);
    if (matchedItem) {
      this.selectedItem = matchedItem.label;
    }
    this.nombres = this.cookieService.get('nombres') || '';
    this.apellidos = this.cookieService.get('apellidos') || '';
    this.password = this.cookieService.get('password') || '';
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
  
}
