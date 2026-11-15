<script setup lang="ts">
import TareaItem from './TareaItem.vue';

// Recorre las tareas con clave estable (id) y reenvía los eventos de cada elemento.
import type { EstadoTarea, Tarea } from '../types';

withDefaults(defineProps<{ tareas: Tarea[]; ocupados?: string[] }>(), { ocupados: () => [] }); // ocupados: ids con una operación en curso
defineEmits<{
  'cambiar-estado': [datos: { id: string; estado: EstadoTarea }];
  eliminar: [datos: { id: string }];
  adjuntar: [datos: { id: string; archivo: File }];
}>();
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
