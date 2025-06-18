import { Component , OnInit} from '@angular/core';
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

@Component({
  selector: 'app-inicio',
  imports: [
    CommonModule, 
    FormsModule, 
    InputTextModule, 
    ButtonModule,
    SidebarModule,
    MenuModule,
    RouterModule
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio implements OnInit {

  constructor(private router: Router,private firebaseService: Firebase, private cookieService: CookieService) {}
  nombresUsuario: string = '';
  apellidosUsuario: string = '';
  menuOpen = false;
  puntosUsuario: string = '';
  interesesUsuario: string[] = [];
  avatarPartes: any[] = [];

  selectedItem = 'Inicio' 
  ngOnInit(): void {
    const nombresCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('nombres='));
  
    const apellidosCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('apellidos='));
  
    const puntosCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('puntos='));
  
    if (nombresCookie) {
      this.nombresUsuario = decodeURIComponent(nombresCookie.split('=')[1]);
    }
  
    if (apellidosCookie) {
      this.apellidosUsuario = decodeURIComponent(apellidosCookie.split('=')[1]);
    }
    if (puntosCookie) {
      this.puntosUsuario = decodeURIComponent(puntosCookie.split('=')[1]);
    }
    const partes = this.router.url.split('/');
    const matchedItem = this.menuItems.find(item => item.routerLink === '/' + partes[partes.length - 1]);
    if (matchedItem) {
      this.selectedItem = matchedItem.label;
    }

    const usuarioId = this.cookieService.get('usuarioId');
    if (usuarioId) {
      this.firebaseService.getInteresesPorUsuario(usuarioId)
        .then(intereses => {
          this.interesesUsuario = intereses;
        })
        .catch(error => {
          console.error('Error al obtener intereses:', error);
        });
    }
    if (usuarioId) {
      this.firebaseService.getAvatarUsuario(usuarioId).subscribe((data) => {
        if (data.length > 0 && data[0]['avatar']) {
          this.avatarPartes = data[0]['avatar'];
          console.log('Avatar partes:', this.avatarPartes);
        }
      });
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

  irADiagrama(): void {
    this.router.navigate(['/diagrama']);
  }

  irChat(): void {
    this.router.navigate(['/chat']);
  }

  getEstiloPorCategoria(categoria: string): any {
    switch (categoria) {
      case 'cuerpo':
        return { top: '45%', left: '1%', width: '72%', height: '72%', zIndex: 10 };
      case 'cabeza':
        return { top: '5%', left: '12%', width: '65%', height: '65%', zIndex: 20 };
      case 'rostro':
        return { top: '20%', left: '28%', width: '45%', height: '45%', zIndex: 30 };
      case 'Sombreros y gorras':
        return { top: '20%', left: '28%', width: '45%', height: '45%', zIndex: 30 };
      case 'Lentes':
        return { top: '17%', left: '24%', width: '45%', height: '45%', zIndex: 30 };
      default:
        return {};
    }
  }
  
}
