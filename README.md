# Gestor de Tareas: SPA/PWA con Vue 3

Aplicación de una sola página (Vue 3 + TypeScript + Vite + Vue Router) que consume la API REST de gestión de tareas de la unidad 2 ([gestor-tareas-api](https://github.com/SguncayP/gestor-tareas-api)). Se puede instalar como aplicación y abre sin conexión (solo la interfaz; los datos siempre vienen de la red).

## Ejecución

Requisitos: Node.js 20 o superior y la API de la unidad 2 funcionando en `http://localhost:3000`.

```bash
# 1. API (en la carpeta de la unidad 2)
npm install
npm run dev            # API + MongoDB local en http://localhost:3000

# 2. SPA (en esta carpeta)
npm install
npm run dev            # http://localhost:5173 (reenvía /api y /uploads a la API)
npm run typecheck      # revisa los tipos con vue-tsc
npm test               # 28 pruebas (Vitest + Vue Test Utils)
npm run build          # versión de producción en dist/
npm run preview        # sirve dist/ en http://localhost:4173 (aquí sí se registra el service worker)
```

## Arquitectura de componentes

```
App
├─ BarraNavegacion        props: usuario · evento: salir
├─ EstadoMensaje          (aviso de falta de conexión)
└─ RouterView
   ├─ LoginView           formulario de acceso / registro
   └─ TareasView          dueña de los datos: tareas, carga, errores y avisos
      ├─ TareaForm        props: ocupado, error · evento: crear
      ├─ FiltroEstado     v-model (props + update:modelValue)
      ├─ EstadoMensaje    estados: cargando · éxito · vacío · error (con reintentar)
      └─ TareaLista       props: tareas, ocupados · reenvía eventos
         └─ TareaItem     props: tarea, ocupado · eventos: cambiar-estado, eliminar, adjuntar
```

- Los datos bajan por **props** y las acciones suben por **eventos**; ningún componente modifica sus props.
- El único estado compartido es la sesión (`composables/useSesion.ts`), que necesitan a la vez el router, la barra y las vistas. Las tareas viven solo en `TareasView`.
- Las listas usan `:key="tarea.id"` (identificador estable de la base de datos).

## Consumo de la API

- `services/http.ts` es el único lugar con `fetch`: valida `response.ok`, convierte los fallos en `ErrorApi` (con el mensaje del servidor y el estado; `0` si no hay red) y soporta `204 No Content`.
- **Condiciones de carrera:** el listado usa una *clave*; al lanzar una petición nueva con la misma clave se cancela la anterior con `AbortController`. Además, `TareasView` ignora cualquier respuesta que no sea la última solicitada.
- Estados de la interfaz: cargando, éxito (aviso), vacío, error (con botón Reintentar). Cada tarea se desactiva mientras tiene una operación en curso.
- Si el servidor responde 401 se vuelve al inicio de sesión; si la app se abre sin red, se muestra el error con reintento en lugar de expulsar al usuario.

## PWA y caché

`public/manifest.webmanifest` (nombre, iconos 192 y 512, `display: standalone`, colores) y `public/sw.js`:

| Recurso | Estrategia | Motivo |
|---|---|---|
| `/`, `index.html`, manifest, iconos | Se guardan al instalar (app shell) | La interfaz abre sin conexión |
| `/assets/*` (nombre con hash) | Cache-first | Son inmutables: si cambian, cambia el nombre |
| Navegación | Network-first; sin red, `index.html` guardado | Siempre la versión nueva si hay red |
| `/api/*`, `/uploads/*` y métodos que no son GET | **Nunca se guardan ni se interceptan** | Son datos privados de cada usuario: no deben quedar en una caché compartida |

El service worker solo se registra en la versión de producción. Al activar una versión nueva se borran las cachés antiguas.

## Despliegue (Render + MongoDB Atlas)

1. **Base de datos:** crear un clúster gratuito en MongoDB Atlas y copiar la cadena de conexión.
2. **API:** servicio web en Render con el repositorio `gestor-tareas-api` (`render.yaml` incluido): variable `MONGODB_URI` con la cadena de Atlas.
3. **SPA:** sitio estático en Render con este repositorio. En `render.yaml`, reemplazar `API_URL` por la dirección de la API. Las reglas *rewrite* hacen que el navegador vea un solo origen, así que las cookies de sesión funcionan sin CORS.

Limitaciones conocidas: el plan gratuito duerme la API tras un rato sin uso (la primera carga tarda y se ve el estado «Cargando»), y las imágenes subidas y las sesiones no sobreviven a un reinicio del servidor.

## Estructura

```
src/
  main.ts · App.vue · types.ts · styles.css
  router/       index.ts (rutas y guardia de navegación)
  components/   BarraNavegacion · EstadoMensaje · FiltroEstado · TareaForm · TareaItem · TareaLista
  views/        LoginView · TareasView
  services/     http.ts · tareasApi.ts · authApi.ts
  composables/  useSesion.ts · useConexion.ts
public/         manifest.webmanifest · sw.js · icons/
test/           http · componentes · vistas
```
