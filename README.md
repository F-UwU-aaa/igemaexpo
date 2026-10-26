# Igema — cuadernos de campo

## Estructura

```
/                                    → página principal, enlaza a cada área
/assets/gallery.css                  → estilos compartidos por todas las galerías
/assets/gallery.js                   → lógica compartida (descubre fotos + galería + visor)
/renombrar_fotos.py                  → script para numerar tus fotos antes de subirlas

/ceredi/index.html                   → /ceredi
/servicios-complementarios/index.html→ /servicios-complementarios
/labor-talleres/index.html           → /labor-talleres   (título: "Laboratorios y Talleres")
/recreacion/index.html               → /recreacion
/repositorios/index.html             → /repositorios

/fotos-ceredi/                       → fotos de CEREDI
/fotos-servicios-complementarios/    → fotos de Servicios Complementarios
/fotos-labor-talleres/               → fotos de Laboratorios y Talleres
/fotos-recreacion/                   → fotos de Recreación
/fotos-repositorios/                 → fotos de Repositorios

/vercel.json                         → hace que /ceredi funcione sin ".html" ni "/" final
```

Nota: `/ceredi` existe y funciona igual que las demás (sus fotos se
detectan solas de la misma forma), pero queda **fuera** de la página
principal: no aparece listada en `/` y no tiene el botón "← Todas las
áreas". Se accede solo entrando directo a su URL. Las otras 4 áreas sí
están en la portada y sí tienen ese botón.

Las 5 carpetas `fotos-...` van vacías (con un `.gitkeep` adentro que podés
borrar cuando quieras — está ahí solo para que la carpeta no desaparezca
al subir el proyecto a git). Tienen que quedar en la **raíz** del
proyecto, al mismo nivel que `/assets`, no adentro de la carpeta de cada
área.

## Cómo subir fotos a un área (ya no se edita ningún código)

1. Poné todas las fotos de, por ejemplo, Recreación dentro de
   `/fotos-recreacion/`. Podés ponerlas con cualquier nombre, mezcladas,
   sin importar el orden ni cuántas sean.
2. Corré, parado en la carpeta del proyecto:
   ```
   python3 renombrar_fotos.py
   ```
   Te va a mostrar cuántas fotos encontró en cada una de las 5 carpetas
   y te pide confirmación antes de tocar nada. Al confirmar, las
   renombra a `fotos-recreacion_1.jpg`, `fotos-recreacion_2.jpeg`, etc.
   (conservando la extensión real de cada una).
3. Subís (o actualizás) el proyecto en Vercel. La página `/recreacion`
   las va a encontrar y mostrar solas — no hay que tocar ningún
   `index.html`.

Podés correr `renombrar_fotos.py` las veces que quieras: si agregás
fotos nuevas más adelante, vuelve a numerar todo desde el 1 sin romper
nada. Funciona para las 5 carpetas actuales y para cualquier carpeta
`fotos-...` nueva que agregues, sin tener que tocar el script.

## Cómo agregar un área nueva (ej. "Biblioteca")

1. Copiá una carpeta de área existente (por ejemplo `/recreacion`) y
   renombrala `/biblioteca`. Adentro, en su `index.html`, cambiá el
   `<title>`, el `<h1>`, el `.sub` y la línea `carpeta: '/fotos-...'`
   por `'/fotos-biblioteca/'`.
2. Creá la carpeta `/fotos-biblioteca/` en la raíz y subí las fotos
   (después corré `renombrar_fotos.py`).
3. En `/index.html` (la página principal) agregá una línea a `CAMPOS`:
   ```js
   ['Biblioteca', '/biblioteca', '/fotos-biblioteca/']
   ```
4. Subí todo a Vercel. Ya se va a poder ver en `tusitio.vercel.app/biblioteca`.

No hace falta tocar `gallery.css` ni `gallery.js`: esos los comparten
todas las áreas.

## Cómo encuentra las fotos la página (sin manifest.json)

Cada página de área solo le dice a la galería su carpeta, por ejemplo
`IgemaGallery.init({ carpeta: '/fotos-recreacion/' })`. Desde ahí, el
propio navegador pregunta de a lotes de 10 — "¿existe
fotos-recreacion_1.jpg? ¿...1.jpeg? ¿...1.png? ¿...1.webp?" y así — con
peticiones HEAD (livianas, solo preguntan si el archivo existe, no lo
descargan) en paralelo. Cuando un lote entero de 10 números seguidos no
encuentra nada, asume que ahí se terminaron las fotos y deja de buscar.
Por eso es clave correr `renombrar_fotos.py`: así los nombres quedan en
el patrón que la página sabe buscar.

## Qué se optimizó para rendimiento

- **Layout con columnas nativas de CSS** (`column-count`): la página se
  pinta al instante, no espera a que carguen todas las fotos para
  acomodarlas.
- **Carga diferida (`loading="lazy"`)** en todas las fotos salvo las
  primeras 3-4 de cada galería, que cargan de inmediato. El resto se
  pide solo cuando el usuario se acerca haciendo scroll.
- **`fetchPriority="high"`** en la primera foto de cada página.
- **Búsqueda de fotos con peticiones HEAD** (livianas, sin descargar la
  imagen) y en paralelo por lotes, para que detectar cuántas fotos hay
  sea rápido incluso en galerías grandes.
- **El visor (lightbox)** solo precarga la foto actual + la anterior y
  siguiente, no la carpeta entera.
- **CSS y JS compartidos** en `/assets/`: el navegador los descarga una
  sola vez y los reutiliza en las 5 áreas.

## Una optimización extra que te recomiendo (opcional)

Las fotos de celular suelen pesar 2-5 MB y medir 3000px+ de ancho, pero
en pantalla nunca se muestran a más de ~1100px (el tamaño del visor).
Antes de subirlas, conviene reducirlas. Con Squoosh (sin instalar nada,
en la terminal con Node), por ejemplo:

```
npx @squoosh/cli --resize '{"width":1600}' --webp '{"quality":78}' -d fotos_optimizadas fotos-ceredi/*
```

Eso te deja copias livianas en formato WebP. Si querés, te ayudo a
armar ese paso para todas tus carpetas de fotos.
