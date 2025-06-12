import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, CollectionReference, DocumentData } from '@angular/fire/firestore';
import { collectionData } from 'rxfire/firestore';
import { Observable } from 'rxjs';
export interface Usuario {
  id?: string;
  nombres: string;
  apellidos: string;
  correo: string;
  password: string;
  edad: number;
  carreraId: string;
}

@Injectable({
  providedIn: 'root'
})
export class Firebase {
  private usuarioCollection: CollectionReference<DocumentData>;

  constructor(private firestore: Firestore) { 
    this.usuarioCollection = collection(this.firestore, 'Usuarios');
  }


  getCarreras(): Observable<any[]> {
    const carreraRef = collection(this.firestore, 'Carrera');
    return collectionData(carreraRef, { idField: 'id' }) as Observable<any[]>;
  }

  crearUsuario(usuario: any): Promise<any> {
    const userRef = collection(this.firestore, 'Usuarios'); // Puedes cambiar 'Usuarios' por tu colección real
    return addDoc(userRef, usuario);
  }

  async login(correo: string, password: string): Promise<Usuario | null> {
    try {
      const snapshot = await getDocs(this.usuarioCollection);
  
      const usuarios = snapshot.docs.map(doc => {
        const data = doc.data() as Usuario;
        return { id: doc.id, ...data };
      });
      console.log('Usuarios obtenidos:', usuarios);
      const usuario = usuarios.find(u => u.correo === correo && u.password === password);
      return usuario || null;
  
    } catch (error) {
      console.error('Error al intentar hacer login:', error);
      return null;
    }
  }

  guardarFormulario(usuarioId: string, respuestas: string[]): Promise<any> {
    const formularioRef = collection(this.firestore, 'Formulario');
    return addDoc(formularioRef, {
      usuarioId,
      respuestas
    });
  }

  guardarIntereses(usuarioId: string, intereses: string[]): Promise<void> {
    const interesesRef = collection(this.firestore, 'InteresUsuario'); // o 'Intereses'
    const data = {
      usuarioId: usuarioId,
      intereses: intereses,
      fechaRegistro: new Date()
    };
    return addDoc(interesesRef, data).then(() => {
      console.log('Intereses guardados correctamente.');
    });
  }

  getAgentes(): Observable<any[]> {
    const agenteRef = collection(this.firestore, 'Agente');
    return collectionData(agenteRef, { idField: 'id' }) as Observable<any[]>;
  }

  getIntereses(): Observable<any[]> {
    const interesesRef = collection(this.firestore, 'Intereses');
    return collectionData(interesesRef, { idField: 'id' }) as Observable<any[]>;
  }
  
  getArticulosApariencia(): Observable<any[]> {
    const ref = collection(this.firestore, 'ArticuloApariencia');
    return collectionData(ref, { idField: 'id' }) as Observable<any[]>;
  }
  
}
