import { pedir } from './http.js';

export const registro = (datos) => pedir('/api/auth/registro', { metodo: 'POST', cuerpo: datos });
export const login = (datos) => pedir('/api/auth/login', { metodo: 'POST', cuerpo: datos });
export const logout = () => pedir('/api/auth/logout', { metodo: 'POST' });
export const yo = () => pedir('/api/auth/yo');
