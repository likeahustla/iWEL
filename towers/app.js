/* TOWERS landing loader + interactions (Tilda-safe, vanilla JS) */
(function () {
  var BASE = 'https://likeahustla.github.io/iWEL/towers/';
  var mount = document.getElementById('twr-mount');
  if (!mount || mount.dataset.twrDone) return;
  mount.dataset.twrDone = '1';

  fetch(BASE + 'content.html?v=2')
    .then(function (r) { return r.text(); })
    .then(function (html) { mount.innerHTML = html; init(); })
    .catch(function (e) { console.error('TOWERS load failed', e); });

  function init() {
    var root = document.getElementById('twr-page');
    if (!root) return;

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

    /* --- smooth anchor to plans --- */
    root.querySelectorAll('a[href="#twr-plans"]').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        var el = document.getElementById('twr-plans');
        if (el) { ev.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
    });

    /* --- count-up --- */
    function countUp(el) {
      var to = parseInt(el.getAttribute('data-to'), 10) || 0;
      var dur = 1400, t0 = null;
      function step(ts) {
        if (!t0) t0 = ts;
        var k = Math.min(1, (ts - t0) / dur);
        k = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(to * k);
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    /* --- chart line draw --- */
    function drawChart(box) {
      var line = box.querySelector('#twr-line');
      if (line) {
        var len = line.getTotalLength();
        line.style.strokeDasharray = len;
        line.style.strokeDashoffset = len;
        line.getBoundingClientRect();
        line.style.transition = 'stroke-dashoffset 1.8s ease-out';
        line.style.strokeDashoffset = '0';
      }
      var pts = box.querySelectorAll('.pt');
      pts.forEach(function (p, i) { p.style.transitionDelay = (0.3 + i * 0.35) + 's'; });
      box.classList.add('go');
    }

    /* --- reveal observer --- */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target;
          el.classList.add('in');
          if (el.id === 'twr-map') el.classList.add('go');
          if (el.id === 'twr-chart') drawChart(el);
          el.querySelectorAll('.cnt').forEach(countUp);
          io.unobserve(el);
        });
      }, { threshold: 0.15 });
      root.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });
    } else {
      root.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });
      var m = root.querySelector('#twr-map'); if (m) m.classList.add('go');
      var c = root.querySelector('#twr-chart'); if (c) { c.classList.add('go'); drawChart(c); }
      root.querySelectorAll('.cnt').forEach(countUp);
    }

    /* --- subtle parallax on band backgrounds --- */
    var plx = [].slice.call(root.querySelectorAll('[data-plx]'));
    if (plx.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var ticking = false;
      function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          var vh = window.innerHeight;
          plx.forEach(function (bg) {
            var r = bg.parentElement.getBoundingClientRect();
            if (r.bottom < 0 || r.top > vh) return;
            var prog = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
            bg.style.transform = 'translateY(' + (prog * -36).toFixed(1) + 'px)';
          });
          ticking = false;
        });
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    /* --- lightbox --- */
    var lb = document.createElement('div');
    lb.className = 'twr-lb';
    lb.innerHTML = '<span class="x">&times;</span><img alt="">';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img');
    function openLb(src, alt) {
      lbImg.src = src; lbImg.alt = alt || '';
      lb.classList.add('on');
      document.documentElement.style.overflow = 'hidden';
    }
    function closeLb() {
      lb.classList.remove('on');
      document.documentElement.style.overflow = '';
    }
    lb.addEventListener('click', closeLb);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); });
    root.querySelectorAll('.card .imgw img, .plan .pic img, .floorplan-intro img, .mapwrap > img').forEach(function (img) {
      img.parentElement.addEventListener('click', function () {
        openLb(img.currentSrc || img.src, img.alt);
      });
    });
  }
})();
