import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorApi, esCancelada, pedir } from '../src/services/http';

const respuesta = (estado, cuerpo) => ({
  ok: estado >= 200 && estado < 300,
  status: estado,
  json: () => (cuerpo === undefined ? Promise.reject(new Error('sin cuerpo')) : Promise.resolve(cuerpo)),
});

afterEach(() => vi.unstubAllGlobals());

describe('servicio HTTP', () => {
  it('devuelve el JSON cuando response.ok es verdadero', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(200, { datos: [1] })));
    await expect(pedir('/api/tareas')).resolves.toEqual({ datos: [1] });
  });

  it('devuelve null con 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(204)));
    await expect(pedir('/api/tareas/1', { metodo: 'DELETE' })).resolves.toBeNull();
  });

  it('lanza ErrorApi con el mensaje del servidor y el estado cuando !response.ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(409, { error: { mensaje: 'Título repetido' } })));
    const error = await pedir('/api/tareas', { metodo: 'POST', cuerpo: {} }).catch((e) => e);
    expect(error).toBeInstanceOf(ErrorApi);
    expect(error.message).toBe('Título repetido');
    expect(error.estado).toBe(409);
  });

  it('usa un mensaje genérico si el error no trae JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(502)));
    const error = await pedir('/api/tareas').catch((e) => e);
    expect(error.estado).toBe(502);
    expect(error.message).toMatch(/502/);
  });

  it('convierte un fallo de red en ErrorApi con estado 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const error = await pedir('/api/tareas').catch((e) => e);
    expect(error).toBeInstanceOf(ErrorApi);
    expect(error.estado).toBe(0);
  });

  it('envía JSON con Content-Type y no lo hace con FormData', async () => {
    const fetchSimulado = vi.fn().mockResolvedValue(respuesta(200, {}));
    vi.stubGlobal('fetch', fetchSimulado);
    await pedir('/api/tareas', { metodo: 'POST', cuerpo: { titulo: 'x' } });
    expect(fetchSimulado.mock.calls[0][1].headers['Content-Type']).toBe('application/json');
    expect(fetchSimulado.mock.calls[0][1].body).toBe('{"titulo":"x"}');

    const formulario = new FormData();
    await pedir('/api/x', { metodo: 'POST', archivo: formulario });
    expect(fetchSimulado.mock.calls[1][1].headers['Content-Type']).toBeUndefined();
    expect(fetchSimulado.mock.calls[1][1].body).toBe(formulario);
  });

  it('una petición nueva con la misma clave cancela la anterior (sin condición de carrera)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url, opciones) => {
        if (url === '/lenta') {
          return new Promise((_, rechazar) =>
            opciones.signal.addEventListener('abort', () => rechazar(Object.assign(new Error('abortada'), { name: 'AbortError' })))
          );
        }
        return Promise.resolve(respuesta(200, { origen: 'rapida' }));
      })
    );

    const primera = pedir('/lenta', { clave: 'lista' }).catch((e) => e);
    const segunda = pedir('/rapida', { clave: 'lista' });

    expect(esCancelada(await primera)).toBe(true);
    await expect(segunda).resolves.toEqual({ origen: 'rapida' });
  });
});
