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

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('arhi-theme', next); } catch (e) {}
      });
    });
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

  /* --- Подсветка карточки под курсором --- */
  document.querySelectorAll('.card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

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
