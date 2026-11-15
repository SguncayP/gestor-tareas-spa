import { onMounted, onUnmounted, ref } from 'vue';

// Indica si el navegador tiene conexión, para avisar al usuario cuando la pierde
export function useConexion() {
  const enLinea = ref(navigator.onLine);
  const actualizar = () => {
    enLinea.value = navigator.onLine;
  };

  onMounted(() => {
    window.addEventListener('online', actualizar);
    window.addEventListener('offline', actualizar);
  });
  onUnmounted(() => {
    window.removeEventListener('online', actualizar);
    window.removeEventListener('offline', actualizar);
  });

  return { enLinea };
}
