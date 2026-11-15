import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount as montar } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import { ErrorApi } from '../src/services/http';

vi.mock('../src/services/tareasApi', () => ({
  listar: vi.fn(),
  crear: vi.fn(),
  actualizar: vi.fn(),
  eliminar: vi.fn(),
  subirAdjunto: vi.fn(),
}));
vi.mock('../src/services/authApi', () => ({ yo: vi.fn(), login: vi.fn(), registro: vi.fn(), logout: vi.fn() }));

import * as tareasApi from '../src/services/tareasApi';
import * as authApi from '../src/services/authApi';
import TareasView from '../src/views/TareasView.vue';
import { guardia } from '../src/router';
import { useSesion } from '../src/composables/useSesion';

const vacio = { render: () => null };
const enrutador = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: vacio },
    { path: '/login', name: 'login', component: vacio },
  ],
});
const mount = (componente) => montar(componente, { global: { plugins: [enrutador] } });

const t = (id, estado = 'pendiente') => ({ id, titulo: 'Tarea ' + id, descripcion: '', estado, adjunto: null });

beforeEach(() => vi.resetAllMocks());

describe('TareasView: estados de la interfaz', () => {
  it('muestra cargando y luego la lista (éxito)', async () => {
    tareasApi.listar.mockResolvedValue({ datos: [t('1'), t('2')] });
    const vista = mount(TareasView);
    expect(vista.text()).toContain('Cargando tareas');
    await flushPromises();
    expect(vista.findAll('article')).toHaveLength(2);
  });

  it('muestra el estado vacío', async () => {
    tareasApi.listar.mockResolvedValue({ datos: [] });
    const vista = mount(TareasView);
    await flushPromises();
    expect(vista.text()).toContain('Aún no tienes tareas');
  });

  it('muestra el error y permite reintentar', async () => {
    tareasApi.listar.mockRejectedValueOnce(new ErrorApi('No hay conexión con el servidor', 0)).mockResolvedValueOnce({ datos: [t('1')] });
    const vista = mount(TareasView);
    await flushPromises();
    expect(vista.find('.mensaje.error').text()).toContain('No hay conexión');

    await vista.find('button.secundario').trigger('click');
    await flushPromises();
    expect(vista.findAll('article')).toHaveLength(1);
  });

  it('ignora una respuesta antigua si el filtro cambió (condición de carrera)', async () => {
    let resolverLenta;
    tareasApi.listar
      .mockReturnValueOnce(new Promise((r) => (resolverLenta = r))) // carga inicial, lenta
      .mockResolvedValueOnce({ datos: [t('9', 'completada')] }); // filtro "completada", rápida
    const vista = mount(TareasView);

    await vista.find('#filtro-estado').setValue('completada');
    await flushPromises();
    expect(tareasApi.listar).toHaveBeenLastCalledWith('completada');

    resolverLenta({ datos: [t('1'), t('2'), t('3')] }); // llega tarde
    await flushPromises();
    expect(vista.findAll('article')).toHaveLength(1);
    expect(vista.text()).toContain('Tarea 9');
  });
});

describe('TareasView: acciones', () => {
  it('crear agrega la tarea al inicio y avisa', async () => {
    tareasApi.listar.mockResolvedValue({ datos: [t('1')] });
    tareasApi.crear.mockResolvedValue(t('2'));
    const vista = mount(TareasView);
    await flushPromises();

    await vista.find('#titulo').setValue('Tarea 2');
    await vista.find('form').trigger('submit');
    await flushPromises();

    expect(tareasApi.crear).toHaveBeenCalledWith({ titulo: 'Tarea 2', descripcion: '' });
    expect(vista.findAll('article')[0].text()).toContain('Tarea 2');
    expect(vista.text()).toContain('Tarea creada');
  });

  it('un error del servidor al crear (409) se muestra en el formulario', async () => {
    tareasApi.listar.mockResolvedValue({ datos: [] });
    tareasApi.crear.mockRejectedValue(new ErrorApi('Ya tienes una tarea con ese título', 409));
    const vista = mount(TareasView);
    await flushPromises();

    await vista.find('#titulo').setValue('Repetida');
    await vista.find('form').trigger('submit');
    await flushPromises();
    expect(vista.find('#error-titulo').text()).toContain('Ya tienes una tarea');
  });

  it('eliminar quita la tarea de la lista', async () => {
    tareasApi.listar.mockResolvedValue({ datos: [t('1'), t('2')] });
    tareasApi.eliminar.mockResolvedValue(null);
    const vista = mount(TareasView);
    await flushPromises();

    await vista.findAll('button.peligro')[0].trigger('click');
    await flushPromises();
    expect(tareasApi.eliminar).toHaveBeenCalledWith('1');
    expect(vista.findAll('article')).toHaveLength(1);
  });

  it('cambiar de estado reemplaza la tarea con la respuesta del servidor', async () => {
    tareasApi.listar.mockResolvedValue({ datos: [t('1')] });
    tareasApi.actualizar.mockResolvedValue(t('1', 'completada'));
    const vista = mount(TareasView);
    await flushPromises();

    await vista.find('article select').setValue('completada');
    await flushPromises();
    expect(tareasApi.actualizar).toHaveBeenCalledWith('1', { titulo: 'Tarea 1', descripcion: '', estado: 'completada' });
    expect(vista.find('article').classes()).toContain('estado-completada');
  });
});

describe('TareasView: sesión y conexión', () => {
  it('si el servidor responde 401 al listar, redirige al login', async () => {
    tareasApi.listar.mockRejectedValue(new ErrorApi('Inicia sesión para continuar', 401));
    const empujar = vi.spyOn(enrutador, 'push');
    mount(TareasView);
    await flushPromises();
    expect(empujar).toHaveBeenCalledWith({ name: 'login' });
  });
});

describe('guardia del router', () => {
  it('redirige al login si no hay sesión y a tareas si ya la hay', async () => {
    authApi.yo.mockRejectedValue(new ErrorApi('Inicia sesión', 401));
    const sinSesion = await guardia({ name: 'tareas', meta: { requiereSesion: true } });
    expect(sinSesion).toEqual({ name: 'login' });
    expect(await guardia({ name: 'login', meta: {} })).toBe(true);
  });

  it('sin conexión deja entrar a las rutas privadas para mostrar el aviso', async () => {
    const { cargar } = useSesion();
    authApi.yo.mockRejectedValue(new ErrorApi('No hay conexión con el servidor', 0));
    await cargar(true);
    expect(await guardia({ name: 'tareas', meta: { requiereSesion: true } })).toBe(true);
  });
});
