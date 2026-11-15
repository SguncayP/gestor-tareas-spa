import { createRouter, createWebHistory } from 'vue-router';
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router';
import { useSesion } from '../composables/useSesion';
import LoginView from '../views/LoginView.vue';
import TareasView from '../views/TareasView.vue';

export const rutas = [
  { path: '/', redirect: '/tareas' },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/tareas', name: 'tareas', component: TareasView, meta: { requiereSesion: true } },
  { path: '/:resto(.*)*', redirect: '/tareas' },
];

// Guardia de navegación: protege las rutas privadas y evita volver al login con sesión abierta
export async function guardia(to: Pick<RouteLocationNormalized, 'name' | 'meta'>): Promise<true | RouteLocationRaw> {
  const { usuario, sinConexion, cargar } = useSesion();
  await cargar();
  // Sin conexión no se puede saber si hay sesión: se deja entrar y la vista mostrará el aviso y el reintento
  if (to.meta.requiereSesion && !usuario.value && !sinConexion.value) return { name: 'login' };
  if (to.name === 'login' && usuario.value) return { name: 'tareas' };
  return true;
}

export const router = createRouter({ history: createWebHistory(), routes: rutas });
router.beforeEach(guardia);
