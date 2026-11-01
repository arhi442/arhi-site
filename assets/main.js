/* ============================================================
   Arhi — личный сайт. Скрипты.
   ============================================================ */

/* v4 */
(function () {
  'use strict';

  /* --- Переключатель темы (тёмная / светлая) --- */
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('arhi-theme'); } catch (e) {}

  var initial = saved || 'dark';
  root.setAttribute('data-theme', initial);

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.theme-toggle');
    if (!btn) return;
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    document.documentElement.style.background = (next === 'light') ? '#f7f5f1' : '#07120f';
    try { localStorage.setItem('arhi-theme', next); } catch (e) {}
  });

  /* --- Лёгкий лоадер со счётчиком (один раз за сессию) --- */
  var loader = document.querySelector('.page-loader');
  if (loader) {
    var seen = null;
    try { seen = sessionStorage.getItem('arhi-loaded'); } catch (e) {}
    if (seen) {
      loader.remove();
    } else {
      try { sessionStorage.setItem('arhi-loaded', '1'); } catch (e) {}
      var counter = loader.querySelector('.page-loader__counter');
      var val = 0;
      var tick = setInterval(function () {
        val = Math.min(100, val + Math.round(7 + Math.random() * 18));
        if (counter) { counter.textContent = String(val).padStart(3, '0'); }
        if (val >= 100) {
          clearInterval(tick);
          setTimeout(function () {
            loader.classList.add('is-done');
            setTimeout(function () { loader.remove(); }, 700);
          }, 180);
        }
      }, 110);
    }
  }

  /* --- Фильтры кейсов --- */
  var filterBar = document.querySelector('.case-filters');
  var caseCards = document.querySelectorAll('.card[data-tags]');
  var countEl = filterBar && filterBar.querySelector('.filter-count');

  if (filterBar && caseCards.length) {
    var updateCount = function (visible) {
      if (countEl) {
        countEl.textContent = visible + ' ' + plural(visible, ['проект', 'проекта', 'проектов']);
      }
    };
    var plural = function (n, forms) {
      var n10 = n % 10, n100 = n % 100;
      if (n10 === 1 && n100 !== 11) return forms[0];
      if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
      return forms[2];
    };

    var applyFilter = function (tag) {
      var visible = 0;
      caseCards.forEach(function (card) {
        var tags = (card.getAttribute('data-tags') || '').split(',').map(function (s) { return s.trim(); });
        var show = (tag === 'all') || tags.indexOf(tag) !== -1;
        card.classList.toggle('is-filtered-out', !show);
        if (show) visible++;
      });
      updateCount(visible);
    };

    filterBar.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBar.querySelectorAll('button').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        applyFilter(btn.getAttribute('data-filter'));
      });
    });

    // начальное состояние — «Все»
    var active = filterBar.querySelector('button.is-active') || filterBar.querySelector('button');
    if (active) { applyFilter(active.getAttribute('data-filter')); }
  }


  /* --- 3D-монограмма: параллакс на мышь --- */
  var hero3d = document.getElementById('hero3d');
  if (hero3d && window.matchMedia('(pointer: fine)').matches) {
    var rx = 14, ry = 0, targetRx = 14, targetRy = 0;
    var baseSpin = 0, lastT = 0;
    document.addEventListener('mousemove', function (e) {
      var nx = (e.clientX / window.innerWidth) - 0.5;
      var ny = (e.clientY / window.innerHeight) - 0.5;
      targetRx = 14 - ny * 10;
      targetRy = nx * 14;
    }, { passive: true });
    var prev = null;
    (function tick(ts) {
      if (prev !== null) {
        var dt = Math.min(64, ts - prev);
        baseSpin += dt * 0.0138; /* ~26 сек/оборот */
        rx += (targetRx - rx) * 0.08;
        ry += (targetRy - ry) * 0.08;
        hero3d.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + (ry + (baseSpin % 360)).toFixed(2) + 'deg)';
      }
      prev = ts;
      requestAnimationFrame(tick);
    })(null);
  }


  /* --- Каскад карточек: порядковые задержки --- */
  (function () {
    var cards = document.querySelectorAll('.grid--2 .card');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var sibs = el.parentElement.querySelectorAll('.card');
        var idx = Array.prototype.indexOf.call(sibs, el);
        el.style.setProperty('--ci', idx % 4);
        io.unobserve(el);
      });
    }, { threshold: 0.15 });
    cards.forEach(function (c) { io.observe(c); });
  })();


  /* --- SPA-навигация: переходы без перезагрузки (нет белых вспышек) --- */
  (function () {
    var SPANav = function (url, push) {
      var furl = url.endsWith('/') ? url : url + '/';
      // плавный уход текущего контента
      document.body.classList.add('spa-leaving');
      fetch(furl).then(function (r) { return r.text(); }).then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        // подменяем контент: header, main, footer
        ['header.site-header', 'main', 'footer.site-footer', 'button.to-top'].forEach(function (sel) {
          var old = document.querySelector(sel);
          var neu = doc.querySelector(sel);
          if (old && neu) old.replaceWith(neu.cloneNode(true));
          else if (!old && neu) document.body.appendChild(neu.cloneNode(true));
        });
        // head: title, meta description
        document.title = doc.title;
        var md = doc.querySelector('meta[name="description"]');
        var mdOld = document.querySelector('meta[name="description"]');
        if (md && mdOld) mdOld.setAttribute('content', md.getAttribute('content'));
        if (push !== false) history.pushState({}, '', url);
        // скролл наверх
        window.scrollTo(0, 0);
        // плавное появление нового контента
        document.body.classList.remove('spa-leaving');
        document.body.classList.add('spa-entering');
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            document.body.classList.remove('spa-entering');
          });
        });
        // ре-инициализация после подмены
        document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
        var loader = document.querySelector('.page-loader');
        if (loader) loader.classList.add('is-done');
        // перемонтировать to-top
        var tt = document.querySelector('.to-top');
        if (tt && !tt._init) {
          tt._init = true;
          tt.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
        }
        document.dispatchEvent(new Event('spa:navigated'));
      }).catch(function () { location.href = url; });
    };

    document.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || a.target === '_blank' || a.hasAttribute('download')) return;
      if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('http')) return;
      // только внутренние html-переходы, не якоря
      if (href.startsWith('#') || href.includes('#')) return;
      // главную грузим полноценно (3D, фильтры, каскады):
      if (href === '/' || href.endsWith('/index.html')) return;
      e.preventDefault();
      SPANav(href, true);
    });

    window.addEventListener('popstate', function () {
      SPANav(location.pathname, false);
    });
  })();



  /* --- Подсветка активного пункта меню (понимает якоря кейсов/статей) --- */
  (function () {
    function setActive(name) {
      document.querySelectorAll('.nav-links a').forEach(function (a) {
        var isIt = a.getAttribute('href') === name;
        a.classList.toggle('is-active', isIt);
      });
    }
    function byUrl() {
      var h = location.hash;
      if (h === '#cases') return '/#cases';
      if (h === '#articles') return '/#articles';
      var p = location.pathname;
      if (p.indexOf('/about') === 0) return '/about';
      if (p.indexOf('/how-it-works') === 0) return '/how-it-works';
      return '/';
    }
    setActive(byUrl());
    window.addEventListener('hashchange', function () { setActive(byUrl()); });
    document.addEventListener('spa:navigated', function () { setActive(byUrl()); });
    // при скролле: какая секция в центре экрана
    var sections = [['#cases', '/#cases'], ['#articles', '/#articles']];
    window.addEventListener('scroll', function () {
      if (location.pathname !== '/') return;
      if (location.hash === '#cases' || location.hash === '#articles') return; // hash главнее
      var cur = '/';
      sections.forEach(function (s) {
        var el = document.querySelector(s[0]);
        if (el) {
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight * 0.4 && r.bottom > window.innerHeight * 0.4) cur = s[1];
        }
      });
      setActive(cur);
    }, { passive: true });
  })();


  /* --- Год в подвале --- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* --- Появление блоков при скролле --- */
  var revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 70 + 'ms';
      io.observe(el);
    });

    /* Страховка: если по какой-то причине блок не показался, раскрываем всё
       через секунду после загрузки — контент не должен оставаться невидимым. */
    setTimeout(function () {
      document.querySelectorAll('.reveal:not(.is-visible)').forEach(function (el) {
        el.classList.add('is-visible');
      });
    }, 1000);
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* --- Кнопка «наверх» --- */
  var toTop = document.querySelector('.to-top');
  if (toTop) {
    var onScroll = function () {
      toTop.classList.toggle('is-visible', window.scrollY > 520);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* --- Плавный переход по якорям (на случай отключённого smooth scroll) --- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', id);
    });
  });
})();
