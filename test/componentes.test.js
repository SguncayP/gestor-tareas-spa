import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import EstadoMensaje from '../src/components/EstadoMensaje.vue';
import FiltroEstado from '../src/components/FiltroEstado.vue';
import TareaForm from '../src/components/TareaForm.vue';
import TareaItem from '../src/components/TareaItem.vue';
import TareaLista from '../src/components/TareaLista.vue';

const tarea = (extra = {}) => ({ id: 'a1', titulo: 'Estudiar Vue', descripcion: 'Componentes', estado: 'pendiente', adjunto: null, ...extra });

describe('EstadoMensaje', () => {
  it('anuncia los errores con role="alert" y el resto con role="status"', () => {
    expect(mount(EstadoMensaje, { props: { tipo: 'error', mensaje: 'Falló' } }).attributes('role')).toBe('alert');
    expect(mount(EstadoMensaje, { props: { tipo: 'cargando', mensaje: 'Cargando' } }).attributes('role')).toBe('status');
    expect(mount(EstadoMensaje, { props: { tipo: 'vacio', mensaje: 'Nada' } }).text()).toContain('Nada');
  });

  it('muestra el botón Reintentar solo si es reintentable y emite el evento', async () => {
    const sinBoton = mount(EstadoMensaje, { props: { tipo: 'error', mensaje: 'x' } });
    expect(sinBoton.find('button').exists()).toBe(false);

    const conBoton = mount(EstadoMensaje, { props: { tipo: 'error', mensaje: 'x', reintentable: true } });
    await conBoton.find('button').trigger('click');
    expect(conBoton.emitted('reintentar')).toHaveLength(1);
  });
});

describe('FiltroEstado', () => {
  it('emite update:modelValue al elegir un estado', async () => {
    const envoltura = mount(FiltroEstado, { props: { modelValue: '' } });
    await envoltura.find('select').setValue('completada');
    expect(envoltura.emitted('update:modelValue')[0]).toEqual(['completada']);
  });
});

describe('TareaForm', () => {
  it('rechaza un título corto y no emite', async () => {
    const envoltura = mount(TareaForm);
    await envoltura.find('#titulo').setValue('ab');
    await envoltura.find('form').trigger('submit');
    expect(envoltura.emitted('crear')).toBeUndefined();
    expect(envoltura.find('.error').text()).toMatch(/entre 3 y 100/);
  });

  it('emite los datos recortados y se puede limpiar', async () => {
    const envoltura = mount(TareaForm);
    await envoltura.find('#titulo').setValue('  Nueva tarea  ');
    await envoltura.find('#descripcion').setValue(' detalle ');
    await envoltura.find('form').trigger('submit');
    expect(envoltura.emitted('crear')[0]).toEqual([{ titulo: 'Nueva tarea', descripcion: 'detalle' }]);

    envoltura.vm.limpiar();
    await envoltura.vm.$nextTick();
    expect(envoltura.find('#titulo').element.value).toBe('');
  });

  it('muestra el error que llega del servidor y bloquea el botón mientras guarda', () => {
    const envoltura = mount(TareaForm, { props: { error: 'Ya tienes una tarea con ese título', ocupado: true } });
    expect(envoltura.find('.error').text()).toContain('Ya tienes una tarea');
    expect(envoltura.find('button[type="submit"]').attributes('disabled')).toBeDefined();
  });
});

describe('TareaItem', () => {
  it('emite eventos con el id y no modifica la prop recibida', async () => {
    const original = Object.freeze(tarea());
    const envoltura = mount(TareaItem, { props: { tarea: original } });

    await envoltura.find('select').setValue('completada');
    expect(envoltura.emitted('cambiar-estado')[0]).toEqual([{ id: 'a1', estado: 'completada' }]);

    await envoltura.find('button.peligro').trigger('click');
    expect(envoltura.emitted('eliminar')[0]).toEqual([{ id: 'a1' }]);
    expect(original.estado).toBe('pendiente');
  });

  it('muestra la imagen adjunta con texto alternativo y desactiva controles si está ocupada', () => {
    const envoltura = mount(TareaItem, { props: { tarea: tarea({ adjunto: '/uploads/x.png' }), ocupado: true } });
    const img = envoltura.find('img');
    expect(img.attributes('src')).toBe('/uploads/x.png');
    expect(img.attributes('alt')).toContain('Estudiar Vue');
    expect(envoltura.find('select').attributes('disabled')).toBeDefined();
  });
});

describe('TareaLista', () => {
  it('dibuja un elemento por tarea y reenvía sus eventos', async () => {
    const envoltura = mount(TareaLista, { props: { tareas: [tarea(), tarea({ id: 'b2', titulo: 'Otra' })], ocupados: ['b2'] } });
    expect(envoltura.findAll('li')).toHaveLength(2);

    await envoltura.findAll('button.peligro')[0].trigger('click');
    expect(envoltura.emitted('eliminar')[0]).toEqual([{ id: 'a1' }]);
    expect(envoltura.findAll('button.peligro')[1].attributes('disabled')).toBeDefined();
  });
});
