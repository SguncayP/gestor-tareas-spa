<script setup lang="ts">
import { useRouter } from 'vue-router';
import BarraNavegacion from './components/BarraNavegacion.vue';
import EstadoMensaje from './components/EstadoMensaje.vue';
import { useSesion } from './composables/useSesion';
import { useConexion } from './composables/useConexion';

const router = useRouter();
const { usuario, salir } = useSesion();
const { enLinea } = useConexion();

async function cerrarSesion() {
  try {
    await salir();
  } finally {
    router.push({ name: 'login' });
  }
}
</script>

<template>
  <a class="salto" href="#contenido">Saltar al contenido</a>
  <BarraNavegacion :usuario="usuario" @salir="cerrarSesion" />
  <EstadoMensaje v-if="!enLinea" tipo="error" mensaje="Sin conexión: podrás ver la aplicación, pero no tus tareas hasta reconectar." />
  <main id="contenido" tabindex="-1">
    <RouterView />
  </main>
  <footer class="pie">Aplicaciones Web · Unidad 3</footer>
</template>
