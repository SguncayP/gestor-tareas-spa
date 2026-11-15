import { ref } from 'vue';
import * as authApi from '../services/authApi.js';

// Estado compartido: es el único que necesitan a la vez el router, la barra y las vistas.
const usuario = ref(null);
const sinConexion = ref(false); // true si no se pudo consultar la sesión por falta de red
let carga = null;

export function useSesion() {
  // Consulta la sesión una sola vez; el router espera a que termine antes de decidir la ruta.
  // Con forzar = true se vuelve a consultar (por ejemplo, al recuperar la conexión).
  function cargar(forzar = false) {
    if (forzar) carga = null;
    if (!carga) {
      carga = authApi
        .yo()
        .then((datos) => {
          usuario.value = datos;
          sinConexion.value = false;
        })
        .catch((error) => {
          usuario.value = null;
          sinConexion.value = error.estado === 0;
        });
    }
    return carga;
  }

  async function entrar(modo, datos) {
    usuario.value = modo === 'registro' ? await authApi.registro(datos) : await authApi.login(datos);
    sinConexion.value = false;
  }

  async function salir() {
    await authApi.logout();
    usuario.value = null;
  }

  return { usuario, sinConexion, cargar, entrar, salir };
}
