// Único punto de acceso HTTP de la aplicación.
// - Valida response.ok y convierte cualquier fallo en un ErrorApi con mensaje legible.
// - Si se da una "clave", una nueva petición con esa clave cancela la anterior (evita condiciones de carrera).

export class ErrorApi extends Error {
  estado: number; // 0 = sin conexión con el servidor

  constructor(mensaje: string, estado: number) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
  }
}

export const esCancelada = (error: unknown): boolean => (error as Error | undefined)?.name === 'AbortError';

interface Opciones {
  metodo?: string;
  cuerpo?: unknown;
  archivo?: FormData;
  clave?: string;
}

const pendientes = new Map<string, AbortController>();

function controladorPara(clave?: string): AbortController | null {
  if (!clave) return null;
  pendientes.get(clave)?.abort();
  const controlador = new AbortController();
  pendientes.set(clave, controlador);
  return controlador;
}

export async function pedir<T = unknown>(url: string, { metodo = 'GET', cuerpo, archivo, clave }: Opciones = {}): Promise<T> {
  const controlador = controladorPara(clave);
  const cabeceras: Record<string, string> = {};
  const opciones: RequestInit = { method: metodo, signal: controlador?.signal, headers: cabeceras };

  if (archivo) {
    opciones.body = archivo; // FormData: el navegador fija el Content-Type
  } else if (cuerpo !== undefined) {
    cabeceras['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(cuerpo);
  }

  try {
    const respuesta = await fetch(url, opciones);
    if (respuesta.status === 204) return null as T;

    const datos = await respuesta.json().catch(() => null);
    if (!respuesta.ok) {
      throw new ErrorApi(datos?.error?.mensaje ?? 'El servidor respondió con un error (' + respuesta.status + ')', respuesta.status);
    }
    return datos as T;
  } catch (error) {
    if (error instanceof ErrorApi || esCancelada(error)) throw error;
    throw new ErrorApi('No hay conexión con el servidor', 0);
  } finally {
    if (clave && pendientes.get(clave) === controlador) pendientes.delete(clave);
  }
}
