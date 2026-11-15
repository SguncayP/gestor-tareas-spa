// Único punto de acceso HTTP de la aplicación.
// - Valida response.ok y convierte cualquier fallo en un ErrorApi con mensaje legible.
// - Si se da una "clave", una nueva petición con esa clave cancela la anterior (evita condiciones de carrera).

export class ErrorApi extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado; // 0 = sin conexión con el servidor
  }
}

export const esCancelada = (error) => error?.name === 'AbortError';

const pendientes = new Map();

function controladorPara(clave) {
  if (!clave) return null;
  pendientes.get(clave)?.abort();
  const controlador = new AbortController();
  pendientes.set(clave, controlador);
  return controlador;
}

export async function pedir(url, { metodo = 'GET', cuerpo, archivo, clave } = {}) {
  const controlador = controladorPara(clave);
  const opciones = { method: metodo, signal: controlador?.signal, headers: {} };

  if (archivo) {
    opciones.body = archivo; // FormData: el navegador fija el Content-Type
  } else if (cuerpo !== undefined) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(cuerpo);
  }

  try {
    const respuesta = await fetch(url, opciones);
    if (respuesta.status === 204) return null;

    const datos = await respuesta.json().catch(() => null);
    if (!respuesta.ok) {
      throw new ErrorApi(datos?.error?.mensaje ?? 'El servidor respondió con un error (' + respuesta.status + ')', respuesta.status);
    }
    return datos;
  } catch (error) {
    if (error instanceof ErrorApi || esCancelada(error)) throw error;
    throw new ErrorApi('No hay conexión con el servidor', 0);
  } finally {
    if (clave && pendientes.get(clave) === controlador) pendientes.delete(clave);
  }
}
