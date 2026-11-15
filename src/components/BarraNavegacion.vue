<script setup lang="ts">
// Presenta el nombre de la app y el usuario; solo avisa con un evento cuando se pide salir.
import type { Usuario } from '../types';

defineProps<{ usuario: Usuario | null }>();
defineEmits<{ salir: [] }>();
</script>

<template>
  <header class="barra">
    <RouterLink class="marca" to="/tareas">Gestor de Tareas</RouterLink>
    <nav v-if="usuario" aria-label="Cuenta">
      <span class="usuario">{{ usuario.nombre }}</span>
      <button type="button" class="boton secundario" @click="$emit('salir')">Salir</button>
    </nav>
  </header>
</template>
