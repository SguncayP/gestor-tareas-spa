<script setup>
import TareaItem from './TareaItem.vue';

// Recorre las tareas con clave estable (id) y reenvía los eventos de cada elemento.
defineProps({
  tareas: { type: Array, required: true },
  ocupados: { type: Array, default: () => [] }, // ids con una operación en curso
});
defineEmits(['cambiar-estado', 'eliminar', 'adjuntar']);
</script>

<template>
  <ul class="lista" aria-label="Lista de tareas">
    <li v-for="tarea in tareas" :key="tarea.id">
      <TareaItem
        :tarea="tarea"
        :ocupado="ocupados.includes(tarea.id)"
        @cambiar-estado="$emit('cambiar-estado', $event)"
        @eliminar="$emit('eliminar', $event)"
        @adjuntar="$emit('adjuntar', $event)"
      />
    </li>
  </ul>
</template>
