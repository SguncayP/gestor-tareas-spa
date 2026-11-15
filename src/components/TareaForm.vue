<script setup lang="ts">
import { computed, ref } from 'vue';

// Formulario de nueva tarea: valida en el cliente y emite los datos; no llama a la API.
import type { DatosTarea } from '../types';

const props = withDefaults(defineProps<{ ocupado?: boolean; error?: string }>(), { ocupado: false, error: '' }); // error: lo devuelve el servidor
const emit = defineEmits<{ crear: [datos: DatosTarea]; editar: [] }>();

const titulo = ref('');
const descripcion = ref('');
const errorLocal = ref('');
const mensajeError = computed(() => errorLocal.value || props.error);

function enviar() {
  const textoTitulo = titulo.value.trim();
  if (textoTitulo.length < 3 || textoTitulo.length > 100) {
    errorLocal.value = 'El título debe tener entre 3 y 100 caracteres';
    return;
  }
  errorLocal.value = '';
  emit('crear', { titulo: textoTitulo, descripcion: descripcion.value.trim() });
}

// Al escribir, desaparecen los mensajes de error anteriores (el padre limpia el del servidor)
function alEditar() {
  errorLocal.value = '';
  emit('editar');
}

// El padre la llama cuando la tarea se creó correctamente
function limpiar() {
  titulo.value = '';
  descripcion.value = '';
  errorLocal.value = '';
}
defineExpose({ limpiar });
</script>

<template>
  <form class="tarjeta formulario" novalidate @submit.prevent="enviar">
    <h2>Nueva tarea</h2>
    <label for="titulo">Título</label>
    <input id="titulo" v-model="titulo" type="text" maxlength="100" autocomplete="off" :aria-invalid="!!mensajeError" aria-describedby="error-titulo" @input="alEditar" />
    <label for="descripcion">Descripción (opcional)</label>
    <input id="descripcion" v-model="descripcion" type="text" maxlength="500" autocomplete="off" @input="alEditar" />
    <p id="error-titulo" class="error" role="alert">{{ mensajeError }}</p>
    <button type="submit" class="boton" :disabled="ocupado">{{ ocupado ? 'Guardando…' : 'Agregar tarea' }}</button>
  </form>
</template>
