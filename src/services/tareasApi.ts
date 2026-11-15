import { pedir } from './http';
import type { DatosTarea, ListaTareas, Tarea } from '../types';

// Operaciones sobre /api/tareas; el listado usa una clave para cancelar la petición anterior.
export function listar(estado?: string): Promise<ListaTareas> {
  const filtro = estado ? '?estado=' + encodeURIComponent(estado) : '';
  return pedir<ListaTareas>('/api/tareas' + filtro, { clave: 'listar-tareas' });
}

export const crear = (datos: DatosTarea) => pedir<Tarea>('/api/tareas', { metodo: 'POST', cuerpo: datos });

export const actualizar = (id: string, datos: DatosTarea) => pedir<Tarea>('/api/tareas/' + id, { metodo: 'PUT', cuerpo: datos });

export const eliminar = (id: string) => pedir<null>('/api/tareas/' + id, { metodo: 'DELETE' });

export function subirAdjunto(id: string, archivo: File): Promise<Tarea> {
  const formulario = new FormData();
  formulario.append('adjunto', archivo);
  return pedir<Tarea>('/api/tareas/' + id + '/adjunto', { metodo: 'POST', archivo: formulario });
}
