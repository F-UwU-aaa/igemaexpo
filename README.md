# Igema — cuadernos de campo

## Estructura

```
/                        → página principal, enlaza a cada campo
/assets/gallery.css      → estilos compartidos por todas las galerías
/assets/gallery.js       → lógica compartida (galería + visor/lightbox)
/ceredi/index.html       → galería de CEREDI → se ve en /ceredi
/labo/index.html         → galería de Labo (plantilla de ejemplo) → /labo
/fotos_ceredi/           → fotos de CEREDI (debe quedar en la raíz del sitio)
/fotos_labo/             → fotos de Labo (debe quedar en la raíz del sitio)
/vercel.json             → hace que /ceredi funcione sin ".html" ni "/" final
```

IMPORTANTE: las carpetas de fotos (`fotos_ceredi/`, `fotos_labo/`, etc.)
tienen que estar en la **raíz** del proyecto, al mismo nivel que `/ceredi`
y `/assets` — no dentro de la carpeta `/ceredi/`. Los links a las fotos
en el código ya apuntan con `/fotos_ceredi/...` (con barra al inicio) por
eso mismo.

## Cómo agregar un campo nuevo (ej. "Vivero")

1. Copia la carpeta `/labo` completa y renómbrala `/vivero`.
2. Sube las fotos a una carpeta nueva `/fotos_vivero/` en la raíz.
3. Dentro de `/vivero/index.html` cambia:
   - el `<title>`, el `<h1>` y el `.sub`,
   - `carpeta: '/fotos_vivero/'`,
   - la lista `fotos: [...]` con los nombres reales de tus archivos.
4. En `/index.html` (la página principal) agrega una línea a `CAMPOS`:
   ```js
   ['Vivero', '/vivero', '/fotos_vivero/fotos_vivero_1.jpg']
   ```
5. Sube todo a Vercel. Ya se va a poder ver en `tusitio.vercel.app/vivero`.

No hace falta tocar `gallery.css` ni `gallery.js`: esos los comparten
todos los campos.

## Qué se optimizó para rendimiento

- **El layout ya no espera a que carguen todas las fotos.** Antes el script
  cargaba TODAS las imágenes primero (para medir si eran verticales u
  horizontales) y recién después armaba el mosaico, con un tope de 5 s.
  Ahora el mosaico se arma con columnas nativas de CSS (`column-count`),
  así que la página se pinta al instante y cada foto entra a su columna
  apenas termina de cargar.
- **Carga diferida (`loading="lazy"`)** en todas las fotos salvo las
  primeras 3-4, que cargan de inmediato para que algo se vea rápido al
  entrar. El navegador solo pide el resto cuando el usuario se acerca
  haciendo scroll — en una galería de 19+ fotos esto evita bajar varios MB
  que capaz nadie llega a ver.
- **`fetchPriority="high"`** en la primera foto, para que el navegador la
  priorice sobre fuentes/otros recursos.
- **El visor (lightbox) solo precarga la foto actual + la anterior y
  siguiente**, no la carpeta entera.
- **CSS y JS compartidos** en `/assets/`: el navegador los descarga una
  vez y los reutiliza en todos los campos (antes cada página repetía
  ~250 líneas de CSS+JS propias).

## Una optimización extra que te recomiendo (opcional)

Las fotos de celular suelen pesar 2-5 MB y medir 3000px+ de ancho, pero
en pantalla nunca se muestran a más de ~1100px (el tamaño del visor).
Antes de subirlas, conviene reducirlas. Con Squoosh (sin instalar nada,
en la terminal con Node) por ejemplo:

```
npx @squoosh/cli --resize '{"width":1600}' --webp '{"quality":78}' -d fotos_optimizadas fotos_ceredi/*
```

Eso te deja copias livianas en formato WebP. Si querés, te ayudo a armar
ese paso para todas tus carpetas de fotos.
