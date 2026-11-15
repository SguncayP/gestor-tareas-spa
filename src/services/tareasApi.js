import { pedir } from './http.js';

// Operaciones sobre /api/tareas; el listado usa una clave para cancelar la petición anterior.
export function listar(estado) {
  const filtro = estado ? '?estado=' + encodeURIComponent(estado) : '';
  return pedir('/api/tareas' + filtro, { clave: 'listar-tareas' });
}

export const crear = (datos) => pedir('/api/tareas', { metodo: 'POST', cuerpo: datos });

export const actualizar = (id, datos) => pedir('/api/tareas/' + id, { metodo: 'PUT', cuerpo: datos });

export const eliminar = (id) => pedir('/api/tareas/' + id, { metodo: 'DELETE' });

export function subirAdjunto(id, archivo) {
  const formulario = new FormData();
  formulario.append('adjunto', archivo);
  return pedir('/api/tareas/' + id + '/adjunto', { metodo: 'POST', archivo: formulario });
}
