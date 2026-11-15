<script setup>
// Muestra uno de los estados de la interfaz: cargando, éxito, vacío o error.
// Los errores se anuncian con role="alert" y el resto con role="status" para lectores de pantalla.
defineProps({
  tipo: { type: String, required: true, validator: (v) => ['cargando', 'exito', 'vacio', 'error'].includes(v) },
  mensaje: { type: String, required: true },
  reintentable: { type: Boolean, default: false },
});
defineEmits(['reintentar']);
</script>

<template>
  <div :class="['mensaje', tipo]" :role="tipo === 'error' ? 'alert' : 'status'">
    <span v-if="tipo === 'cargando'" class="giro" aria-hidden="true"></span>
    <p>{{ mensaje }}</p>
    <button v-if="reintentable" type="button" class="boton secundario" @click="$emit('reintentar')">Reintentar</button>
  </div>
</template>
