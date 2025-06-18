import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, CollectionReference, DocumentData,query, where,getDoc,DocumentReference, doc, updateDoc,setDoc,docData } from '@angular/fire/firestore';
import { collectionData } from 'rxfire/firestore';
import { Observable } from 'rxjs';
import { switchMap, from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
export interface Usuario {
  UsuarioId?: string;
  nombres: string;
  apellidos: string;
  correo: string;
  password: string;
  edad: number;
  carreraId: string;
  puntos: number;
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

  async login(correo: string, password: string): Promise<Partial<Usuario> | null> {
    try {
      const snapshot = await getDocs(this.usuarioCollection);
  
      const usuarios = snapshot.docs.map(doc => {
        const data = doc.data() as Usuario;
        return { id: doc.id, ...data };
      });
  
      console.log('Usuarios obtenidos:', usuarios);
  
      const usuario = usuarios.find(u => u.correo === correo && u.password === password);
  
      if (usuario) {
        const { nombres, apellidos, id: UsuarioId, puntos } = usuario;
        return { nombres, apellidos, UsuarioId, puntos };
      }
  
      return null;
  
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
  
  getInteresesPorUsuario(usuarioId: string): Promise<string[]> {
    const interesesRef = collection(this.firestore, 'InteresUsuario');
    const q = query(interesesRef, where('usuarioId', '==', usuarioId));
  
    return getDocs(q).then(snapshot => {
      const intereses: string[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data['intereses'] && Array.isArray(data['intereses'])) {
          intereses.push(...data['intereses']);
        }
      });
      return intereses;
    });
  }

  guardarAvatarUsuario(avatarData: any): Promise<void> {
    const avatarRef = collection(this.firestore, 'AvatarUsuario');
    const q = query(avatarRef, where('usuarioId', '==', avatarData.usuarioId));
  
    return getDocs(q).then(snapshot => {
      if (!snapshot.empty) {
        // Ya existe => actualiza el documento
        const docId = snapshot.docs[0].id;
        const docRef = doc(this.firestore, 'AvatarUsuario', docId);
        return updateDoc(docRef, { avatar: avatarData.avatar });
      } else {
        // No existe => crea uno nuevo
        const newDocRef = doc(avatarRef);
        return setDoc(newDocRef, avatarData);
      }
    });
  }
  

  getAvatarUsuario(usuarioId: string): Observable<any[]> {
    const avatarRef = collection(this.firestore, 'AvatarUsuario');
    const q = query(avatarRef, where('usuarioId', '==', usuarioId));
    return collectionData(q, { idField: 'id' });
  }

  getArticulosConCategorias(): Observable<any[]> {
    const articuloRef = collection(this.firestore, 'Articulo');
  
    return collectionData(articuloRef, { idField: 'id' }).pipe(
      mergeMap((articulos: any[]) => {
        const articulosConCategorias$ = articulos.map(async (articulo) => {
          // Aseguramos que el idCategoria sea de tipo DocumentReference
          const categoriaSnap = await getDoc(articulo.idCategoria as DocumentReference);
  
          const categoriaData = categoriaSnap.data() as { nombre: string };
          const nombreCategoria = categoriaSnap.exists() ? categoriaData.nombre : 'Sin categoría';
  
          return {
            ...articulo,
            nombreCategoria
          };
        });
  
        return from(Promise.all(articulosConCategorias$));
      })
    );
  }
  
  obtenerUsuario(usuarioId: string): Observable<any> {
    const ref = doc(this.firestore, 'Usuarios', usuarioId);
    return docData(ref, { idField: 'id' });
  }

  registrarCompra(compra: any): Promise<void> {
    const ref = doc(collection(this.firestore, 'ArticulosUsuario'));
    return setDoc(ref, compra);
  }

  actualizarPuntosUsuario(usuarioId: string, nuevosPuntos: number): Promise<void> {
    const ref = doc(this.firestore, 'Usuarios', usuarioId);
    return updateDoc(ref, { puntos: nuevosPuntos });
  }

  verificarCompra(usuarioId: string, nombre: string): Promise<boolean> {
    const ref = collection(this.firestore, 'ArticulosUsuario');
    const q = query(ref, where('usuarioId', '==', usuarioId), where('nombre', '==', nombre));
    return getDocs(q).then(snapshot => !snapshot.empty);
  }

  getArticulosUsuario(usuarioId: string) {
    const ref = collection(this.firestore, 'ArticulosUsuario');
    const q = query(ref, where('usuarioId', '==', usuarioId));
    return collectionData(q, { idField: 'id' });
  }
  
  getArticulosCompradosConCategoria(usuarioId: string): Observable<any[]> {
    const ref = collection(this.firestore, 'ArticulosUsuario');
    const q = query(ref, where('usuarioId', '==', usuarioId));
  
    return from(
      getDocs(q).then(async snapshot => {
        const articulos = [];
  
        for (const doc of snapshot.docs) {
          const data = doc.data();
  
          // Obtener la categoría por referencia
          let nombreCategoria = 'Sin categoría';
          if (data['categoria']) {
            const categoriaSnap = await getDoc(data['categoria'] as DocumentReference);
            if (categoriaSnap.exists()) {
              const catData = categoriaSnap.data() as any;
              nombreCategoria = catData.nombre || 'Sin categoría';
            }
          }
  
          articulos.push({
            ...data,
            id: doc.id,
            nombreCategoria
          });
        }
  
        return articulos;
      })
    );
  }
}
