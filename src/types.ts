export type EstadoTarea = 'pendiente' | 'en_progreso' | 'completada';

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  estado: EstadoTarea;
  adjunto: string | null;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
}

export interface ListaTareas {
  datos: Tarea[];
  total: number;
}

export interface DatosTarea {
  titulo: string;
  descripcion: string;
  estado?: EstadoTarea;
}
