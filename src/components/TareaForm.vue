<script setup>
import { computed, ref } from 'vue';

// Formulario de nueva tarea: valida en el cliente y emite los datos; no llama a la API.
const props = defineProps({
  ocupado: { type: Boolean, default: false },
  error: { type: String, default: '' }, // error devuelto por el servidor
});
const emit = defineEmits(['crear']);

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
    <input id="titulo" v-model="titulo" type="text" maxlength="100" autocomplete="off" :aria-invalid="!!mensajeError" aria-describedby="error-titulo" />
    <label for="descripcion">Descripción (opcional)</label>
    <input id="descripcion" v-model="descripcion" type="text" maxlength="500" autocomplete="off" />
    <p id="error-titulo" class="error" role="alert">{{ mensajeError }}</p>
    <button type="submit" class="boton" :disabled="ocupado">{{ ocupado ? 'Guardando…' : 'Agregar tarea' }}</button>
  </form>
</template>
