# vl3x-GYM · App de entrenamiento personal (PWA)

**App publicada:** https://vl3x-gym.vercel.app (cada push a `main` se despliega solo en Vercel).

App web progresiva, instalable en el móvil y usable sin conexión, pensada para entrenar con una **mano zamba radial congénita en el brazo izquierdo**. Tiene tres módulos:

1. **Gimnasio** (principal): rutina de cuerpo completo; todo el tren superior se hace **solo con el brazo derecho** y nada carga la mano o la muñeca izquierda.
2. **Core en casa** (diario): 10–15 min sin material, con progresión semanal, racha y recordatorio.
3. **Brazo izquierdo**: módulo **preparado pero vacío y desactivado** por defecto. Se activa en Ajustes.

> ⚠️ App orientativa. Antes de empezar consulta con tu médico o fisioterapeuta; el módulo del brazo izquierdo debería validarlo un fisioterapeuta o terapeuta de mano.

## Cómo ejecutarla

Requisitos: Node 20+ (probado con Node 24). Todos los comandos se lanzan **dentro de la carpeta `gym`**.

En **PowerShell** (Windows):

```powershell
cd gym
npm install
npm run dev                                      # desarrollo en http://localhost:3000 (sin service worker)
npm test                                         # tests unitarios (Vitest)
npm run lint
npm run build; if ($?) { npm run preview }       # build + servir out/ en http://localhost:4173 (PWA y offline)
```

Windows PowerShell 5.1 no admite `&&`; por eso se usa `; if ($?) { ... }`. En bash o PowerShell 7 vale `npm run build && npm run preview`.

Si `npm install` falla con `EALLOWSCRIPTS` (por un `allow-scripts` en tu `~/.npmrc` global):

```powershell
$env:NPM_CONFIG_USERCONFIG = 'NUL'
npm install
```

Sin Supabase configurado la app funciona en **modo local** (IndexedDB en el dispositivo). Para sincronizar, copia `.env.example` a `.env.local` y rellena las dos variables.

Otros scripts: `npm run imagenes` (vuelve a descargar las imágenes de ejercicios) y `npm run iconos` (regenera iconos y splash desde `scripts/icono.svg`).

## Qué hace

### Gimnasio
- **Onboarding**: aviso médico, edad, peso, altura, sexo, experiencia, objetivo (fuerza / hipertrofia / salud), días y cuáles, duración, material y limitaciones (la mano zamba izquierda viene precargada).
- **Generador determinista** (`src/lib/domain/generator.ts`, sin IA de pago):
  - 2–3 días: cuerpo completo · 4 días: torso/pierna · 5–6 días: torso/pierna (+ cuerpo completo).
  - Garantiza un **mínimo de series efectivas por semana para los 17 grupos** (por defecto 10, ajustable de 6 a 20): pecho, dorsal, espalda alta/trapecio, hombro anterior/lateral/posterior, bíceps, tríceps, antebrazo, cuádriceps, isquios, glúteos, aductores, abductores, gemelos, lumbar y core (este último desde el módulo de casa, que también cuenta).
  - Conteo fraccionado: 1 serie si el músculo es principal, ½ o ¼ si es secundario.
  - Compuestos primero, aislamientos alternando torso/pierna y **biseries** opcionales para ahorrar tiempo.
  - Cada ejercicio con series, rango de reps, descanso, RIR y peso sugerido.
  - **Sustituir** por alternativas equivalentes y **"Me duele"**: el ejercicio se excluye y se sustituye automáticamente; la cobertura se repara.
  - **Máquina Smith solo como último recurso**: únicamente si para un grupo no queda ninguna alternativa con tu material, marcada como tal y con la alternativa preferida al lado. **Nunca barra libre.**
- **Barras de cobertura muscular** semanal con aviso de grupos cortos (icono + texto + rayado, no solo color).
- **Progresión** (`src/lib/domain/progression.ts`):
  - Semana 1 de **calibración guiada**: empieza ligero, sube serie a serie según el RIR y guarda el peso con 2–3 reps en reserva.
  - **Doble progresión**: tope del rango en todas las series con buena técnica → sube (incrementos configurables: mancuerna +1–2,5 kg, máquina +2,5–5 kg, polea +1,25–5 kg). Dos sesiones sin llegar al mínimo → baja; una → mantiene.
  - **Descarga** cada 6–8 semanas o si cae el rendimiento (3+ ejercicios con el 1RM estimado >5 % por debajo).
  - Rampa de entrada: las dos primeras semanas quitan una serie a los ejercicios de 3 o más.
- **Modo "en el gimnasio"**: una mano, botones grandes, objetivo y lo realizado por serie (peso, reps, RIR opcional), temporizador de descanso con vibración y pitido, biseries guiadas, notas por ejercicio, pantalla siempre encendida, guardado instantáneo y offline.

### Core en casa
Rutina diaria variada (recto, oblicuos, transverso/estabilidad y lumbar), sin apoyar peso en la mano izquierda. Progresión semanal de reps/segundos y paso a variantes más difíciles. Sesión guiada con temporizador de trabajo/descanso y contador, racha, calendario e historial. **Recordatorio diario** (ver decisiones).

### Brazo izquierdo
Desactivado por defecto y fuera de la navegación y del plan semanal hasta activarlo. Al activarlo: autoevaluación guiada (agarre, codo, hombro, apoyo del antebrazo, dolor), ejercicios propios (nombre, descripción, series/reps o tiempo, carga, enlace a vídeo o vídeo propio), catálogo de ideas que **no se carga** salvo que lo importes (filtrado por la autoevaluación), sesiones con **escala de dolor 0–10** (aviso por encima de 3) e historial y gráficas propios. La autoevaluación también decide si el core puede incluir plancha sobre antebrazos.

### Progreso
Calendario unificado, historial por sesión, gráficas (peso y 1RM estimado por ejercicio, volumen semanal por grupo, asistencia), récords, rachas, peso corporal opcional y evolución del brazo izquierdo. Cada gráfica tiene vista de tabla. Exportación a **CSV** (por módulo) y **JSON** (copia completa, también restaurable).

## Decisiones

- **Exportación estática de Next.js** (`output: "export"`): toda la app es cliente; así el service worker precachea cada página y funciona sin conexión. Vercel la sirve como sitio estático.
- **Offline-first**: los datos viven en IndexedDB (Dexie). Supabase es la copia en la nube y la sincronización entre dispositivos: se bajan los cambios del servidor y se suben los pendientes; gana el cambio más reciente (`updatedAt`).
- **Supabase**: una única tabla `registros` (colección + id + JSON) con **Row Level Security** por usuario (`supabase/migrations`). Es más simple y robusta para sincronizar documentos que tener una tabla por entidad. Los vídeos propios del brazo izquierdo **no se suben** (se quedan en el dispositivo).
- **Service worker propio** (`scripts/sw-template.js` + `scripts/build-sw.mjs`) en lugar de un plugin: precache de páginas, JS, CSS, fuentes e iconos; imágenes de técnica en segundo plano. `scripts/fix-rsc.mjs` corrige una discrepancia de Next 16 con los nombres de los payloads RSC en la exportación estática.
- **Volumen con 2 días**: cubrir 10 series de los 17 grupos en 2 sesiones da sesiones de ~110 min (ya con biseries). La app lo avisa y propone: 3 días (~75 min) o mínimo de 8 series (~90 min con 2 días). Por defecto se respeta lo pedido (10).
- **Recordatorio**: una PWA no puede programar una notificación exacta con la app cerrada sin servidor de push. Se combina *Periodic Background Sync* (Android/Chrome con la app instalada, no al minuto exacto), aviso al abrir la app y un **evento de calendario `.ics` diario** como alternativa fiable (sobre todo en iPhone).
- **Remo con pecho apoyado** en vez del remo clásico, patada de tríceps con pecho apoyado, hiperextensiones con brazos cruzados, etc.: todo para no cargar la muñeca izquierda.
- **Estética**: oscura de inspiración emo/urbana (negro y carbón, carmesí, blanco hueso, morado), texturas grunge, panal de hexágonos, salpicaduras discretas, bordes rasgados y un ojo carmesí estilizado de diseño propio. **Inspiración libre: no usa logos, personajes ni imágenes oficiales de ninguna obra.** Títulos en Bebas Neue con glitch, logo en Nosifer y texto en Inter. Las animaciones (glitch, destello rojo al completar una serie, parpadeo del temporizador, transiciones) respetan `prefers-reduced-motion`. Los estados nunca dependen solo del color (iconos, texto y rayados). La paleta de gráficas está validada para daltonismo y contraste.
- **shadcn/ui** (Radix), **Recharts**, **Framer Motion**, **Tailwind CSS 4**, **Next.js 16** (App Router) y **TypeScript**.

## Fuentes y licencias

- **Imágenes de ejercicios**: [yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db), licencia **The Unlicense** (dominio público; comprobada en el repositorio el 13/10/2026). Se descargan y optimizan a WebP con `npm run imagenes`. Algunas fotos muestran la versión a dos manos: cada ejercicio lleva una **nota de adaptación** que explica cómo hacerlo con un solo brazo. Nombres, pasos y errores comunes están escritos en español para esta app.
- **Ilustraciones SVG** de los ejercicios adaptados, icono, splash y ojo: propios de esta app.
- **Fuentes**: Inter, Bebas Neue y Nosifer (Google Fonts, SIL Open Font License).

## Estructura

```
src/lib/domain/      lógica pura y testeada (catálogo, generador, cobertura, progresión, core, brazo)
src/lib/db/          IndexedDB (Dexie) y hooks
src/lib/sync/        Supabase y sincronización
src/lib/app/         casos de uso (planificación, sesiones, estadísticas, exportación)
src/app/             páginas: / (gimnasio), /gimnasio/sesion, /abdominales, /brazo, /progreso, /ajustes, /ejercicios, /bienvenida
supabase/migrations/ SQL con RLS
scripts/             imágenes, iconos, service worker, servidor de pruebas
```

## Tests

`npm test` ejecuta 56 tests, entre ellos:
- ningún ejercicio del módulo gimnasio requiere la mano izquierda;
- todos los grupos musculares reciben el volumen mínimo semanal con 2, 3 y 4 días (y también 5 y 6);
- el módulo brazo izquierdo está desactivado por defecto y no genera nada en el plan;
- la barra libre nunca aparece y la Smith solo se elige cuando no hay ninguna alternativa con el material configurado;
- calibración, doble progresión, descarga, rutina de core y rachas.

## Despliegue

Cuando quieras publicarla, dime **"súbela"** y te guío paso a paso (GitHub → Supabase → Vercel → instalarla en el móvil).
