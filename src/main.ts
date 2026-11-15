import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import './styles.css';

createApp(App).use(router).mount('#app');

// El service worker solo se registra en la versión publicada (npm run build)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => console.warn('Service worker no registrado:', error));
  });
}
