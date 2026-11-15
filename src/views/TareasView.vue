<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useSesion } from '../composables/useSesion.js';
import * as tareasApi from '../services/tareasApi.js';
import { esCancelada } from '../services/http.js';
import EstadoMensaje from '../components/EstadoMensaje.vue';
import FiltroEstado from '../components/FiltroEstado.vue';
import TareaForm from '../components/TareaForm.vue';
import TareaLista from '../components/TareaLista.vue';

const router = useRouter();
const { usuario, sinConexion, cargar: cargarSesion } = useSesion();

// Vista con el estado de las tareas: aquí viven los datos, la carga y los avisos.
const tareas = ref([]);
const carga = ref('cargando'); // cargando | listo | error
const errorCarga = ref('');
const filtro = ref('');
const aviso = ref('');
const errorAccion = ref('');
const errorForm = ref('');
const creando = ref(false);
const ocupados = ref([]);
const formulario = ref(null);

let ultimaPeticion = 0;
let temporizador = null;

// Si el filtro cambia mientras hay una carga en curso, solo cuenta la última petición
async function cargar() {
  const numero = ++ultimaPeticion;
  carga.value = 'cargando';
  errorCarga.value = '';
  try {
    // Si la app se abrió sin red, al reintentar primero se confirma la sesión
    if (sinConexion.value) {
      await cargarSesion(true);
      if (numero !== ultimaPeticion) return;
      if (!usuario.value && !sinConexion.value) return router.push({ name: 'login' });
    }
    const respuesta = await tareasApi.listar(filtro.value);
    if (numero !== ultimaPeticion) return;
    tareas.value = respuesta.datos;
    carga.value = 'listo';
  } catch (error) {
    if (numero !== ultimaPeticion || esCancelada(error)) return;
    if (error.estado === 401) return router.push({ name: 'login' });
    errorCarga.value = error.message;
    carga.value = 'error';
  }
}

function mostrarAviso(texto) {
  aviso.value = texto;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => (aviso.value = ''), 3500);
}

// Ejecuta una operación sobre una tarea marcándola como ocupada mientras dura
async function conOcupado(id, operacion) {
  errorAccion.value = '';
  ocupados.value = [...ocupados.value, id];
  try {
    await operacion();
  } catch (error) {
    errorAccion.value = error.message;
  } finally {
    ocupados.value = ocupados.value.filter((x) => x !== id);
  }
}

const reemplazar = (nueva) => (tareas.value = tareas.value.map((t) => (t.id === nueva.id ? nueva : t)));

async function crear(datos) {
  creando.value = true;
  errorForm.value = '';
  try {
    const nueva = await tareasApi.crear(datos);
    if (!filtro.value || filtro.value === nueva.estado) tareas.value = [nueva, ...tareas.value];
    formulario.value?.limpiar();
    mostrarAviso('Tarea creada');
  } catch (error) {
    errorForm.value = error.message;
  } finally {
    creando.value = false;
  }
}

function cambiarEstado({ id, estado }) {
  const tarea = tareas.value.find((t) => t.id === id);
  return conOcupado(id, async () => {
    const nueva = await tareasApi.actualizar(id, { titulo: tarea.titulo, descripcion: tarea.descripcion, estado });
    if (filtro.value && filtro.value !== nueva.estado) {
      tareas.value = tareas.value.filter((t) => t.id !== id);
    } else {
      reemplazar(nueva);
    }
    mostrarAviso('Estado actualizado');
  });
}

function eliminar({ id }) {
  return conOcupado(id, async () => {
    await tareasApi.eliminar(id);
    tareas.value = tareas.value.filter((t) => t.id !== id);
    mostrarAviso('Tarea eliminada');
  });
}

function adjuntar({ id, archivo }) {
  return conOcupado(id, async () => {
    reemplazar(await tareasApi.subirAdjunto(id, archivo));
    mostrarAviso('Imagen adjuntada');
  });
}

watch(filtro, cargar);
onMounted(cargar);
onUnmounted(() => clearTimeout(temporizador));
</script>

<template>
  <section aria-labelledby="titulo-tareas" class="vista">
    <h1 id="titulo-tareas">Mis tareas</h1>

    <TareaForm ref="formulario" :ocupado="creando" :error="errorForm" @crear="crear" />

    <EstadoMensaje v-if="aviso" tipo="exito" :mensaje="aviso" />
    <EstadoMensaje v-if="errorAccion" tipo="error" :mensaje="errorAccion" />

    <FiltroEstado v-model="filtro" />

    <EstadoMensaje v-if="carga === 'cargando'" tipo="cargando" mensaje="Cargando tareas…" />
    <EstadoMensaje v-else-if="carga === 'error'" tipo="error" :mensaje="errorCarga" reintentable @reintentar="cargar" />
    <EstadoMensaje v-else-if="tareas.length === 0" tipo="vacio" :mensaje="filtro ? 'No hay tareas con ese estado.' : 'Aún no tienes tareas. ¡Agrega la primera!'" />
    <TareaLista v-else :tareas="tareas" :ocupados="ocupados" @cambiar-estado="cambiarEstado" @eliminar="eliminar" @adjuntar="adjuntar" />
  </section>
</template>
