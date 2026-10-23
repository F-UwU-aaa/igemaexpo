/* ============================================================
   Galería reutilizable para cada campo (CEREDI, Labo, etc.)

   Uso en la página de un campo:
     IgemaGallery.init({
       carpeta: '/fotos_ceredi/',
       fotos: [
         ['fotos_ceredi_1.jpg', 'foto 01'],
         ['fotos_ceredi_2.jpg', 'foto 02']
       ]
     });

   Notas de rendimiento:
   - El layout usa columnas nativas de CSS (ver gallery.css), así que
     NO hace falta esperar a que carguen todas las fotos para acomodarlas.
     La página se pinta al instante.
   - Las primeras fotos se cargan de inmediato (loading="eager") para que
     se vea algo rápido apenas entras; el resto usa loading="lazy" y el
     navegador las pide solo cuando el usuario se acerca haciendo scroll.
   - En el visor, solo se precargan la foto actual y sus dos vecinas
     (anterior/siguiente), no toda la carpeta.
   ============================================================ */
window.IgemaGallery = (function () {

  function init(opts) {
    var carpeta = opts.carpeta;
    var fotos = opts.fotos || [];
    var galeria = document.getElementById(opts.contenedor || 'galeria');
    if (!galeria) return;

    var items = [];

    fotos.forEach(function (f, i) {
      var fig = document.createElement('figure');
      fig.className = 't';
      fig.tabIndex = 0;
      fig.setAttribute('role', 'button');
      fig.setAttribute('aria-label', 'Ampliar ' + f[1]);

      var im = document.createElement('img');
      im.alt = f[1];
      im.decoding = 'async';
      im.loading = i < 4 ? 'eager' : 'lazy';
      if (i === 0) im.fetchPriority = 'high';
      im.addEventListener('load', function () { im.classList.add('ok'); });
      im.src = carpeta + f[0];

      var cap = document.createElement('figcaption');
      cap.textContent = f[1];

      fig.appendChild(im);
      fig.appendChild(cap);
      galeria.appendChild(fig);
      items.push(fig);
    });

    galeria.classList.add('listo');
    initLightbox(items);
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

  return { init: init };
})();
