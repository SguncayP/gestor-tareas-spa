<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSesion } from '../composables/useSesion.js';

const router = useRouter();
const { entrar } = useSesion();

const modo = ref('login'); // login | registro
const nombre = ref('');
const email = ref('');
const password = ref('');
const error = ref('');
const enviando = ref(false);
const esRegistro = computed(() => modo.value === 'registro');

function cambiarModo(nuevo) {
  modo.value = nuevo;
  error.value = '';
}

async function enviar() {
  error.value = '';
  if (!email.value.includes('@') || password.value.length < 8 || (esRegistro.value && nombre.value.trim().length < 2)) {
    error.value = 'Revisa los datos: correo válido, contraseña de 8 o más caracteres' + (esRegistro.value ? ' y tu nombre' : '');
    return;
  }
  enviando.value = true;
  try {
    const datos = { email: email.value, password: password.value };
    if (esRegistro.value) datos.nombre = nombre.value.trim();
    await entrar(modo.value, datos);
    router.push({ name: 'tareas' });
  } catch (e) {
    error.value = e.message;
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <section class="vista estrecha" aria-labelledby="titulo-acceso">
    <h1 id="titulo-acceso">{{ esRegistro ? 'Crear cuenta' : 'Iniciar sesión' }}</h1>
    <form class="tarjeta formulario" novalidate @submit.prevent="enviar">
      <template v-if="esRegistro">
        <label for="nombre">Nombre</label>
        <input id="nombre" v-model="nombre" type="text" autocomplete="name" />
      </template>
      <label for="email">Correo electrónico</label>
      <input id="email" v-model="email" type="email" autocomplete="email" />
      <label for="password">Contraseña</label>
      <input id="password" v-model="password" type="password" :autocomplete="esRegistro ? 'new-password' : 'current-password'" />
      <p class="error" role="alert">{{ error }}</p>
      <button type="submit" class="boton" :disabled="enviando">{{ enviando ? 'Enviando…' : esRegistro ? 'Registrarme' : 'Entrar' }}</button>
    </form>
    <p class="cambio">
      <template v-if="esRegistro">¿Ya tienes cuenta? <button type="button" class="enlace" @click="cambiarModo('login')">Inicia sesión</button></template>
      <template v-else>¿Eres nuevo? <button type="button" class="enlace" @click="cambiarModo('registro')">Crea una cuenta</button></template>
    </p>
  </section>
</template>
