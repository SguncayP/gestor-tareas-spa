# Gestor de Tareas: SPA/PWA con Vue 3

AplicaciÃ³n de una sola pÃ¡gina (Vue 3 + Vite + Vue Router) que consume la API REST de gestiÃ³n de tareas de la unidad 2 ([gestor-tareas-api](https://github.com/SguncayP/gestor-tareas-api)). Se puede instalar como aplicaciÃ³n y abre sin conexiÃ³n (solo la interfaz; los datos siempre vienen de la red).

## EjecuciÃ³n

Requisitos: Node.js 20 o superior y la API de la unidad 2 funcionando en `http://localhost:3000`.

```bash
# 1. API (en la carpeta de la unidad 2)
npm install
npm run dev            # API + MongoDB local en http://localhost:3000

# 2. SPA (en esta carpeta)
npm install
npm run dev            # http://localhost:5173 (reenvÃ­a /api y /uploads a la API)
npm test               # 28 pruebas (Vitest + Vue Test Utils)
npm run build          # versiÃ³n de producciÃ³n en dist/
npm run preview        # sirve dist/ en http://localhost:4173 (aquÃ­ sÃ­ se registra el service worker)
```

## Arquitectura de componentes

```
App
â”œâ”€ BarraNavegacion        props: usuario Â· evento: salir
â”œâ”€ EstadoMensaje          (aviso de falta de conexiÃ³n)
â””â”€ RouterView
   â”œâ”€ LoginView           formulario de acceso / registro
   â””â”€ TareasView          dueÃ±a de los datos: tareas, carga, errores y avisos
      â”œâ”€ TareaForm        props: ocupado, error Â· evento: crear
      â”œâ”€ FiltroEstado     v-model (props + update:modelValue)
      â”œâ”€ EstadoMensaje    estados: cargando Â· Ã©xito Â· vacÃ­o Â· error (con reintentar)
      â””â”€ TareaLista       props: tareas, ocupados Â· reenvÃ­a eventos
         â””â”€ TareaItem     props: tarea, ocupado Â· eventos: cambiar-estado, eliminar, adjuntar
```

- Los datos bajan por **props** y las acciones suben por **eventos**; ningÃºn componente modifica sus props.
- El Ãºnico estado compartido es la sesiÃ³n (`composables/useSesion.js`), que necesitan a la vez el router, la barra y las vistas. Las tareas viven solo en `TareasView`.
- Las listas usan `:key="tarea.id"` (identificador estable de la base de datos).

## Consumo de la API

- `services/http.js` es el Ãºnico lugar con `fetch`: valida `response.ok`, convierte los fallos en `ErrorApi` (con el mensaje del servidor y el estado; `0` si no hay red) y soporta `204 No Content`.
- **Condiciones de carrera:** el listado usa una *clave*; al lanzar una peticiÃ³n nueva con la misma clave se cancela la anterior con `AbortController`. AdemÃ¡s, `TareasView` ignora cualquier respuesta que no sea la Ãºltima solicitada.
- Estados de la interfaz: cargando, Ã©xito (aviso), vacÃ­o, error (con botÃ³n Reintentar). Cada tarea se desactiva mientras tiene una operaciÃ³n en curso.
- Si el servidor responde 401 se vuelve al inicio de sesiÃ³n; si la app se abre sin red, se muestra el error con reintento en lugar de expulsar al usuario.

## PWA y cachÃ©

`public/manifest.webmanifest` (nombre, iconos 192 y 512, `display: standalone`, colores) y `public/sw.js`:

| Recurso | Estrategia | Motivo |
|---|---|---|
| `/`, `index.html`, manifest, iconos | Se guardan al instalar (app shell) | La interfaz abre sin conexiÃ³n |
| `/assets/*` (nombre con hash) | Cache-first | Son inmutables: si cambian, cambia el nombre |
| NavegaciÃ³n | Network-first; sin red, `index.html` guardado | Siempre la versiÃ³n nueva si hay red |
| `/api/*`, `/uploads/*` y mÃ©todos que no son GET | **Nunca se guardan ni se interceptan** | Son datos privados de cada usuario: no deben quedar en una cachÃ© compartida |

El service worker solo se registra en la versiÃ³n de producciÃ³n. Al activar una versiÃ³n nueva se borran las cachÃ©s antiguas.

## Despliegue (Render + MongoDB Atlas)

1. **Base de datos:** crear un clÃºster gratuito en MongoDB Atlas y copiar la cadena de conexiÃ³n.
2. **API:** servicio web en Render con el repositorio `gestor-tareas-api` (`render.yaml` incluido): variable `MONGODB_URI` con la cadena de Atlas.
3. **SPA:** sitio estÃ¡tico en Render con este repositorio. En `render.yaml`, reemplazar `API_URL` por la direcciÃ³n de la API. Las reglas *rewrite* hacen que el navegador vea un solo origen, asÃ­ que las cookies de sesiÃ³n funcionan sin CORS.

Limitaciones conocidas: el plan gratuito duerme la API tras un rato sin uso (la primera carga tarda y se ve el estado Â«CargandoÂ»), y las imÃ¡genes subidas y las sesiones no sobreviven a un reinicio del servidor.

## Estructura

```
src/
  main.js Â· App.vue Â· router.js Â· styles.css
  components/   BarraNavegacion Â· EstadoMensaje Â· FiltroEstado Â· TareaForm Â· TareaItem Â· TareaLista
  views/        LoginView Â· TareasView
  services/     http.js Â· tareasApi.js Â· authApi.js
  composables/  useSesion.js Â· useConexion.js
public/         manifest.webmanifest Â· sw.js Â· icons/
test/           http Â· componentes Â· vistas
```
