<script setup>
// Muestra una tarea. Recibe los datos por props (sin modificarlos) y emite eventos con el id.
const props = defineProps({
  tarea: { type: Object, required: true },
  ocupado: { type: Boolean, default: false },
});
const emit = defineEmits(['cambiar-estado', 'eliminar', 'adjuntar']);

const ETIQUETAS = { pendiente: 'Pendiente', en_progreso: 'En progreso', completada: 'Completada' };

function cambiarEstado(evento) {
  emit('cambiar-estado', { id: props.tarea.id, estado: evento.target.value });
}

function elegirArchivo(evento) {
  const archivo = evento.target.files[0];
  if (archivo) emit('adjuntar', { id: props.tarea.id, archivo });
  evento.target.value = '';
}
</script>

<template>
  <article :class="['tarjeta', 'tarea', 'estado-' + tarea.estado]" :aria-busy="ocupado">
    <header class="tarea-cabecera">
      <h3>{{ tarea.titulo }}</h3>
      <span class="insignia">{{ ETIQUETAS[tarea.estado] }}</span>
    </header>
    <p v-if="tarea.descripcion" class="descripcion">{{ tarea.descripcion }}</p>
    <img v-if="tarea.adjunto" class="adjunto" :src="tarea.adjunto" :alt="'Imagen adjunta de ' + tarea.titulo" loading="lazy" />
    <div class="acciones">
      <label :for="'estado-' + tarea.id" class="solo-lectores">Estado de {{ tarea.titulo }}</label>
      <select :id="'estado-' + tarea.id" :value="tarea.estado" :disabled="ocupado" @change="cambiarEstado">
        <option v-for="(texto, valor) in ETIQUETAS" :key="valor" :value="valor">{{ texto }}</option>
      </select>
      <label class="boton secundario archivo">
        {{ tarea.adjunto ? 'Cambiar imagen' : 'Adjuntar imagen' }}
        <input type="file" accept="image/png,image/jpeg" :disabled="ocupado" @change="elegirArchivo" />
      </label>
      <button type="button" class="boton peligro" :disabled="ocupado" @click="$emit('eliminar', { id: tarea.id })">Eliminar</button>
    </div>
  </article>
</template>
