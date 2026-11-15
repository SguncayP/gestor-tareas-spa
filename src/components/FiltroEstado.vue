<script setup>
// Selector controlado con v-model: recibe el valor y avisa cuando cambia.
defineProps({ modelValue: { type: String, default: '' } });
defineEmits(['update:modelValue']);
</script>

<template>
  <div class="filtro">
    <label for="filtro-estado">Mostrar</label>
    <select id="filtro-estado" :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
      <option value="">Todas</option>
      <option value="pendiente">Pendientes</option>
      <option value="en_progreso">En progreso</option>
      <option value="completada">Completadas</option>
    </select>
  </div>
</template>
