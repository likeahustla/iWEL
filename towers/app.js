/* TOWERS cinematic landing v3 — loader + interactions (vanilla JS, Tilda-safe) */
(function () {
  var BASE = 'https://likeahustla.github.io/iWEL/towers/';
  var mount = document.getElementById('twr-mount');
  if (!mount || mount.dataset.twrDone) return;
  mount.dataset.twrDone = '1';

  /* preload the hero image in parallel with content fetch */
  var heroImg = new Image();
  heroImg.src = BASE + 'assets/hero.jpg';

  fetch(BASE + 'content.html?v=3')
    .then(function (r) { return r.text(); })
    .then(function (html) { mount.innerHTML = html; init(); })
    .catch(function (e) { console.error('TOWERS load failed', e); });

  function init() {
    var root = document.getElementById('twr-page');
    if (!root) return;

    /* --- lazy scene backgrounds (fast first paint) --- */
    var bgScenes = [].slice.call(root.querySelectorAll('.scene[data-bg]'));
    function loadBg(scene) {
      if (scene.dataset.bgDone) return;
      scene.dataset.bgDone = '1';
      var el = scene.querySelector('.bg');
      if (el) el.style.backgroundImage = 'url(' + BASE + 'assets/' + scene.getAttribute('data-bg') + ')';
    }
    if ('IntersectionObserver' in window) {
      var bgIo = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { loadBg(e.target); bgIo.unobserve(e.target); } });
      }, { rootMargin: '900px 0px' });
      bgScenes.forEach(function (s) { bgIo.observe(s); });
    } else {
      bgScenes.forEach(loadBg);
    }

    /* --- plans tabs --- */
    root.querySelectorAll('.tab').forEach(function (t) {
      t.addEventListener('click', function () {
        root.querySelectorAll('.tab').forEach(function (x) { x.classList.remove('on'); });
        root.querySelectorAll('.plan').forEach(function (x) { x.classList.remove('on'); });
        t.classList.add('on');
        var p = root.querySelector('#' + t.getAttribute('data-plan'));
        if (p) p.classList.add('on');
      });
    });

    /* --- smooth anchor --- */
    root.querySelectorAll('a[href="#twr-plans"]').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        var el = document.getElementById('twr-plans');
        if (el) { ev.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
    });

    /* --- count-up --- */
    function countUp(el) {
      if (el.dataset.done) return;
      el.dataset.done = '1';
      var to = parseInt(el.getAttribute('data-to'), 10) || 0;
      var dur = 1500, t0 = null;
      function step(ts) {
        if (!t0) t0 = ts;
        var k = Math.min(1, (ts - t0) / dur);
        k = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(to * k);
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    /* --- invest chart line draw --- */
    function drawChart(scene) {
      var line = scene.querySelector('#twr-line');
      if (line && !line.dataset.done) {
        line.dataset.done = '1';
        var len = line.getTotalLength();
        line.style.strokeDasharray = len;
        line.style.strokeDashoffset = len;
        line.getBoundingClientRect();
        line.style.transition = 'stroke-dashoffset 2s cubic-bezier(.4,0,.2,1)';
        line.style.strokeDashoffset = '0';
      }
    }

    /* --- scene + reveal observer --- */
    if ('IntersectionObserver' in window) {
      var sceneIo = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var sc = e.target;
          sc.classList.add('seen');
          if (sc.classList.contains('invest')) drawChart(sc);
          sceneIo.unobserve(sc);
        });
      }, { threshold: 0.22 });
      root.querySelectorAll('.scene').forEach(function (s) { sceneIo.observe(s); });

      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target;
          el.classList.add('in');
          el.querySelectorAll('.cnt').forEach(countUp);
          io.unobserve(el);
        });
      }, { threshold: 0.18 });
      root.querySelectorAll('.rv, .statcol, .shots, .grid-r').forEach(function (el) { io.observe(el); });
      /* standalone shots (inside .shots/.grid-r get .in from parent) */
    } else {
      root.querySelectorAll('.rv, .statcol, .shots, .grid-r, .scene').forEach(function (el) { el.classList.add('in', 'seen'); });
      root.querySelectorAll('.cnt').forEach(countUp);
      var inv = root.querySelector('.invest'); if (inv) drawChart(inv);
    }

    /* --- subtle parallax for scene backgrounds --- */
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var bgs = [].slice.call(root.querySelectorAll('.scene .bg'));
      var ticking = false;
      function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          var vh = window.innerHeight;
          bgs.forEach(function (bg) {
            var sc = bg.parentElement;
            if (!sc.classList.contains('seen')) return;
            var r = sc.getBoundingClientRect();
            if (r.bottom < -80 || r.top > vh + 80) return;
            var prog = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
            bg.style.transform = 'scale(1.001) translateY(' + (prog * -34).toFixed(1) + 'px)';
          });
          ticking = false;
        });
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      setTimeout(onScroll, 2800); /* after entrance scale animation */
    }

    /* --- lightbox --- */
    var lb = document.createElement('div');
    lb.className = 'twr-lb';
    lb.innerHTML = '<span class="x">&times;</span><img alt="">';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img');
    function closeLb() { lb.classList.remove('on'); document.documentElement.style.overflow = ''; }
    lb.addEventListener('click', closeLb);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); });
    root.querySelectorAll('.shot, .plan .pic, .floorwide').forEach(function (box) {
      box.addEventListener('click', function () {
        var img = box.querySelector('img');
        if (!img) return;
        lbImg.src = img.currentSrc || img.src;
        lbImg.alt = img.alt || '';
        lb.classList.add('on');
        document.documentElement.style.overflow = 'hidden';
      });
    });
  }
})();
