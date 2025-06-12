import { Routes } from '@angular/router';
import { Carga } from './carga/carga';
import { Login } from './login/login';
import { Registro } from './registro/registro';
import { Formulario } from './formulario/formulario';
import { Intereses } from './intereses/intereses';
import { Inicio } from './inicio/inicio';
import { Tienda } from './tienda/tienda';
import { Diagrama } from './diagrama/diagrama';
import { Chat } from './chat/chat';
import { Avatar } from './avatar/avatar';
import { Configuraciones } from './configuraciones/configuraciones';
import { Asistente } from './asistente/asistente';

export const routes: Routes = [
    { path: '', component: Carga},
    { path: 'login', component: Login},
    { path: 'registro', component: Registro},
    { path: 'formulario', component: Formulario},
    { path: 'intereses', component: Intereses},
    { path: 'inicio', component: Inicio},
    { path: 'tienda', component: Tienda},
    { path: 'diagrama', component: Diagrama},
    { path: 'chat', component: Chat},
    { path: 'asistente', component: Asistente},
    { path: 'avatar', component: Avatar},
    { path: 'configuraciones', component: Configuraciones},
    { path: '**', redirectTo: ''}
];
