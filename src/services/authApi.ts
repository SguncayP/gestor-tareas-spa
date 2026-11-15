import { pedir } from './http';
import type { Usuario } from '../types';

export interface DatosAcceso {
  email: string;
  password: string;
  nombre?: string;
}

export const registro = (datos: DatosAcceso) => pedir<Usuario>('/api/auth/registro', { metodo: 'POST', cuerpo: datos });
export const login = (datos: DatosAcceso) => pedir<Usuario>('/api/auth/login', { metodo: 'POST', cuerpo: datos });
export const logout = () => pedir<null>('/api/auth/logout', { metodo: 'POST' });
export const yo = () => pedir<Usuario>('/api/auth/yo');
