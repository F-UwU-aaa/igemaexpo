/* ============================================================
   Galería reutilizable para cada área (CEREDI, Laboratorios y
   Talleres, etc.)

   Ya NO hace falta escribir la lista de fotos a mano. Cada área
   solo le dice a la galería su carpeta y su "prefijo" de archivo
   (el nombre con el que las fotos fueron renombradas por
   renombrar_fotos.py, ej: fotos-ceredi_1.jpg, fotos-ceredi_2.jpeg...).

   Uso en la página de un área:
     IgemaGallery.init({ carpeta: '/fotos-ceredi/' });
     // el "prefijo" se calcula solo a partir de la carpeta
     // (fotos-ceredi/ -> fotos-ceredi), así que normalmente ni
     // hace falta pasarlo.

   Cómo encuentra las fotos (sin manifest.json, sin servidor):
   El navegador pregunta de a lotes de 10 "¿existe fotos-ceredi_1.jpg?
   ¿...1.jpeg? ¿...1.png? ¿...1.webp?" etc. con peticiones HEAD (solo
   encabezados, no baja la foto), en paralelo. Cuando un lote entero de
   10 números seguidos no encuentra nada, asume que ahí se acabaron las
   fotos y para de buscar. No importa el orden ni los nombres originales
   de tus archivos: eso ya lo resuelve renombrar_fotos.py.

   Rendimiento:
   - Las peticiones HEAD son livianas (sin cuerpo), y se hacen en
     paralelo por lotes, así que la búsqueda es rápida incluso con
     muchas fotos.
   - Una vez encontradas, el layout usa columnas nativas de CSS: no
     hay que esperar a que carguen todas para acomodarlas.
   - Las primeras fotos usan loading="eager" (se ven rápido al entrar);
     el resto usa loading="lazy" (el navegador las pide solo cuando el
     usuario se acerca haciendo scroll).
   - El visor (lightbox) solo precarga la foto actual + la anterior y
     la siguiente, no la carpeta entera.
   ============================================================ */
window.IgemaGallery = (function () {

  var EXTENSIONES = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  var TAMANO_LOTE = 10;

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function existe(url) {
    return fetch(url, { method: 'HEAD' })
      .then(function (res) { return res.ok; })
      .catch(function () { return false; });
  }

  // Busca prefijo_1.ext, prefijo_2.ext... en lotes de 10 hasta que un
  // lote entero no encuentre nada. Devuelve [{src, numero}, ...] en orden.
  function descubrirFotos(carpeta, prefijo) {
    var encontradas = {};

    function probarLote(inicio) {
      var pedidos = [];
      for (var n = inicio; n < inicio + TAMANO_LOTE; n++) {
        (function (n) {
          EXTENSIONES.forEach(function (ext) {
            var url = carpeta + prefijo + '_' + n + '.' + ext;
            pedidos.push(existe(url).then(function (ok) {
              if (ok && !encontradas[n]) encontradas[n] = url;
            }));
          });
        })(n);
      }
      return Promise.all(pedidos).then(function () {
        var huboAlguna = false;
        for (var n2 = inicio; n2 < inicio + TAMANO_LOTE; n2++) {
          if (encontradas[n2]) huboAlguna = true;
        }
        if (huboAlguna) return probarLote(inicio + TAMANO_LOTE);
      });
    }

    return probarLote(1).then(function () {
      var numeros = Object.keys(encontradas).map(Number).sort(function (a, b) { return a - b; });
      return numeros.map(function (n) { return { src: encontradas[n], numero: n }; });
    });
  }

  function prefijoDeCarpeta(carpeta) {
    return carpeta.replace(/^\/+|\/+$/g, '');
  }

  // Devuelve la URL de la primera foto (número 1) de una carpeta, o null
  // si todavía no hay ninguna. Útil para portadas (ver index.html del hub).
  function primeraFoto(carpeta, prefijo) {
    prefijo = prefijo || prefijoDeCarpeta(carpeta);
    var intentos = EXTENSIONES.map(function (ext) {
      return carpeta + prefijo + '_1.' + ext;
    });
    function intentar(i) {
      if (i >= intentos.length) return Promise.resolve(null);
      return existe(intentos[i]).then(function (ok) {
        return ok ? intentos[i] : intentar(i + 1);
      });
    }
    return intentar(0);
  }

  function init(opts) {
    var carpeta = opts.carpeta;
    var prefijo = opts.prefijo || prefijoDeCarpeta(carpeta);
    var galeria = document.getElementById(opts.contenedor || 'galeria');
    if (!galeria) return;

    descubrirFotos(carpeta, prefijo).then(function (fotos) {
      if (!fotos.length) {
        galeria.innerHTML = '<p class="vacio">Todavía no hay fotos acá.</p>';
        galeria.classList.add('listo');
        return;
      }

      var items = [];
      fotos.forEach(function (f, i) {
        var fig = document.createElement('figure');
        fig.className = 't';
        fig.tabIndex = 0;
        fig.setAttribute('role', 'button');
        var cap = 'foto ' + pad(f.numero);
        fig.setAttribute('aria-label', 'Ampliar ' + cap);

        var im = document.createElement('img');
        im.alt = cap;
        im.decoding = 'async';
        im.loading = i < 4 ? 'eager' : 'lazy';
        if (i === 0) im.fetchPriority = 'high';
        im.addEventListener('load', function () { im.classList.add('ok'); });
        im.src = f.src;

        var figcap = document.createElement('figcaption');
        figcap.textContent = cap;

        fig.appendChild(im);
        fig.appendChild(figcap);
        galeria.appendChild(fig);
        items.push(fig);
      });

      galeria.classList.add('listo');
      initLightbox(items);
    });
  }

  function initLightbox(items) {
    var lb = document.getElementById('lb');
    var img = document.getElementById('lbImg');
    var text = document.getElementById('lbText');
    var count = document.getElementById('lbCount');
    if (!lb || !items.length) return;

    var current = 0, lastFocus = null;

    function dataOf(i) {
      var el = items[i], im = el.querySelector('img'), cap = el.querySelector('figcaption');
      return { src: im.src, alt: im.alt, cap: cap ? cap.textContent : '' };
    }

    function show(i) {
      current = (i + items.length) % items.length;
      var d = dataOf(current);
      img.classList.add('fade');
      var pre = new Image();
      pre.onload = pre.onerror = function () {
        img.src = d.src;
        img.alt = d.alt;
        img.classList.remove('fade');
      };
      pre.src = d.src;
      text.textContent = d.cap;
      count.textContent = (current + 1) + ' / ' + items.length;
      [current + 1, current - 1].forEach(function (n) {
        new Image().src = dataOf((n + items.length) % items.length).src;
      });
    }

    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lb-lock');
      document.getElementById('lbClose').focus();
    }

    function close() {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lb-lock');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    items.forEach(function (el, i) {
      el.addEventListener('click', function () { open(i); });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
      });
    });

    document.getElementById('lbClose').addEventListener('click', close);
    document.getElementById('lbPrev').addEventListener('click', function (e) { e.stopPropagation(); show(current - 1); });
    document.getElementById('lbNext').addEventListener('click', function (e) { e.stopPropagation(); show(current + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });

    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') show(current + 1);
      else if (e.key === 'ArrowLeft') show(current - 1);
    });

    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      x0 = null;
    }, { passive: true });
  }

  return { init: init, primeraFoto: primeraFoto };
})();
