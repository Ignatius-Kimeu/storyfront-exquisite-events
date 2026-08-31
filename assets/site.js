/* Exquisite Events by You — Storyfront demo. Vanilla JS, no libraries. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WA = '254717359340';

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  window.EE = {
    wa: function (msg) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg); }
  };

  /* ---------------- preload splash ---------------- */
  var splash = $('#splash');
  if (splash) {
    var dismiss = function () {
      setTimeout(function () {
        splash.classList.add('gone');
        setTimeout(function () { if (splash.parentNode) splash.remove(); }, 800);
      }, reduce ? 0 : 520);
    };
    if (document.readyState === 'complete') dismiss();
    else window.addEventListener('load', dismiss);
    // never let one slow image trap someone behind the splash
    setTimeout(dismiss, 3200);
  }

  /* ---------------- smart sticky header ---------------- */
  var hdr = $('.hdr');
  if (hdr) {
    var lastY = window.scrollY, hTick = false;
    var hApply = function () {
      var y = window.scrollY;
      hdr.dataset.top = y < 24 ? 'true' : 'false';
      // comes back on ANY upward scroll, from anywhere on the page
      if (y > lastY + 6 && y > 220) hdr.dataset.hidden = 'true';
      else if (y < lastY - 6) hdr.dataset.hidden = 'false';
      lastY = y;
      hTick = false;
    };
    window.addEventListener('scroll', function () {
      if (!hTick) { hTick = true; requestAnimationFrame(hApply); }
    }, { passive: true });
    hApply();
  }

  /* ---------------- mobile nav ---------------- */
  var burger = $('.burger'), mnav = $('.mnav');
  if (burger && mnav) {
    var closeNav = function () {
      burger.setAttribute('aria-expanded', 'false');
      mnav.classList.remove('open');
      document.body.style.overflow = '';
    };
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      mnav.classList.toggle('open', !open);
      document.body.style.overflow = !open ? 'hidden' : '';
    });
    $$('a', mnav).forEach(function (a) { a.addEventListener('click', closeNav); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
  }

  /* ---------------- scroll reveal ---------------- */
  var rvs = $$('.rv');
  if (rvs.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      rvs.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var d = parseInt(e.target.dataset.delay || '0', 10);
          setTimeout(function () { e.target.classList.add('in'); }, d);
          io.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      rvs.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------------- count-up stats ---------------- */
  var stats = $$('[data-count]');
  if (stats.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target,
            target = parseFloat(el.dataset.count),
            dec = parseInt(el.dataset.dec || '0', 10),
            suffix = el.dataset.suffix || '',
            dur = 1200, t0 = null;
        if (reduce) { el.textContent = target.toFixed(dec) + suffix; cio.unobserve(el); return; }
        var tick = function (ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min(1, (ts - t0) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = (target * eased).toFixed(dec) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        cio.unobserve(el);
      });
    }, { threshold: 0.4 });
    stats.forEach(function (el) { cio.observe(el); });
  }

  /* ---------------- floating WhatsApp button ---------------- */
  var fab = $('.fab');
  if (fab) {
    var fTick = false;
    var fApply = function () { fab.classList.toggle('show', window.scrollY > 420); fTick = false; };
    window.addEventListener('scroll', function () {
      if (!fTick) { fTick = true; requestAnimationFrame(fApply); }
    }, { passive: true });
    setTimeout(fApply, 1100);
  }

  /* =====================================================================
     PHOTO GALLERY — filters, lightbox, and the sub-1-degree scroll tilt
     ===================================================================== */
  var gal = $('.gal');
  if (gal) {
    var figs = $$('figure', gal);

    // reveal each tile as it arrives, so the masonry fills in rather than popping
    if (reduce || !('IntersectionObserver' in window)) {
      figs.forEach(function (f) { f.classList.add('in'); });
    } else {
      var gio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('in');
          gio.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -4% 0px', threshold: 0.05 });
      figs.forEach(function (f) { gio.observe(f); });
    }

    $$('.filters button').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.filters button').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        var cat = b.dataset.cat;
        figs.forEach(function (f) {
          f.classList.toggle('hide', cat !== 'all' && f.dataset.cat !== cat);
          f.classList.add('in');
        });
      });
    });

    var lb = $('.lb'), lbImg = $('.lb__fig img'), lbCap = $('.lb__cap'), lbCount = $('.lb__count');
    var idx = 0;
    var visible = function () { return figs.filter(function (f) { return !f.classList.contains('hide'); }); };
    var show = function (i) {
      var list = visible();
      if (!list.length) return;
      idx = (i + list.length) % list.length;
      var f = list[idx], img = $('img', f);
      // the grid holds the small file; the lightbox swaps in the full-size one
      lbImg.src = f.dataset.full || img.getAttribute('src');
      lbImg.alt = img.getAttribute('alt') || '';
      lbCap.textContent = f.dataset.caption || img.getAttribute('alt') || '';
      lbCount.textContent = (idx + 1) + ' / ' + list.length;
    };
    var openLb = function (i) {
      show(i); lb.classList.add('open'); document.body.style.overflow = 'hidden';
      $('.lb__close').focus();
    };
    var closeLb = function () { lb.classList.remove('open'); document.body.style.overflow = ''; };

    figs.forEach(function (f) {
      f.setAttribute('tabindex', '0');
      f.setAttribute('role', 'button');
      var go = function () { openLb(visible().indexOf(f)); };
      f.addEventListener('click', go);
      f.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
      });
    });
    $('.lb__close').addEventListener('click', closeLb);
    $('.lb__prev').addEventListener('click', function () { show(idx - 1); });
    $('.lb__next').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });

    /* scroll-linked tilt — under 1 degree, rAF-throttled, desktop + motion-on only */
    if (!reduce && window.matchMedia('(min-width: 861px)').matches) {
      var tTick = false;
      var tilt = function () {
        var mid = window.innerHeight / 2;
        figs.forEach(function (f) {
          if (f.classList.contains('hide')) return;
          var r = f.getBoundingClientRect();
          if (r.bottom < -80 || r.top > window.innerHeight + 80) return;
          var d = ((r.top + r.height / 2) - mid) / mid;
          f.style.transform = 'rotate(' + (d * 0.8).toFixed(3) + 'deg)';
        });
        tTick = false;
      };
      window.addEventListener('scroll', function () {
        if (!tTick) { tTick = true; requestAnimationFrame(tilt); }
      }, { passive: true });
      tilt();
    }
  }

  /* =====================================================================
     FILM GRID — muted autoplay in the grid, one audio stream at a time,
     click any tile for the full-size player.
     ===================================================================== */
  var films = $$('.film');
  if (films.length) {
    var RING = 2 * Math.PI * 23;   // matches r="23" on the progress ring
    var soundOwner = null;          // only ever one film with its sound on

    // the cards cascade in rather than fading like the photo grid
    if (reduce || !('IntersectionObserver' in window)) {
      films.forEach(function (c) { c.classList.add('in'); });
    } else {
      var fio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('in');
          fio.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
      films.forEach(function (c) { fio.observe(c); });
    }

    var setSound = function (card, on) {
      var v = $('video', card), btn = $('.vsound', card);
      if (!v) return;
      v.muted = !on;
      if (btn) {
        btn.dataset.on = String(on);
        btn.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
        // which speaker icon shows is handled by CSS off data-on
      }
      card.dataset.playing = String(on);
    };

    var muteEveryoneExcept = function (card) {
      films.forEach(function (c) { if (c !== card) setSound(c, false); });
    };

    films.forEach(function (card) {
      var v = $('video', card),
          btn = $('.vsound', card),
          ring = $('.ring circle', card);

      if (!v) return;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.preload = 'metadata';

      if (ring) { ring.style.strokeDasharray = RING; ring.style.strokeDashoffset = RING; }

      // autoplay only while the tile is actually on screen
      if ('IntersectionObserver' in window) {
        var vio = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              var p = v.play();
              if (p && p.catch) p.catch(function () {});
            } else {
              v.pause();
              if (soundOwner === card) { setSound(card, false); soundOwner = null; }
            }
          });
        }, { threshold: 0.4 });
        vio.observe(card);
      }

      if (ring) {
        v.addEventListener('timeupdate', function () {
          if (!v.duration || v.muted) return;
          var p = v.currentTime / v.duration;
          ring.style.strokeDashoffset = String(RING * (1 - p));
        });
      }

      if (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();          // don't also open the lightbox
          var turningOn = btn.dataset.on !== 'true';
          if (turningOn) {
            muteEveryoneExcept(card);   // <- the one-audio-at-a-time rule
            soundOwner = card;
            var p = v.play();
            if (p && p.catch) p.catch(function () {});
          } else if (soundOwner === card) {
            soundOwner = null;
          }
          setSound(card, turningOn);
        });
      }
    });

    /* ---- film lightbox ---- */
    var vlb = $('.vlb');
    if (vlb) {
      var vv = $('.vlb__stage video'),
          vTitle = $('.vlb__cap h3'),
          vDesc = $('.vlb__cap p'),
          vCount = $('.vlb__count'),
          vIdx = 0;

      var showFilm = function (i) {
        vIdx = (i + films.length) % films.length;
        var card = films[vIdx], src = $('video source', card) || $('video', card);
        var url = src.getAttribute('src');
        if (vv.getAttribute('src') !== url) {
          vv.setAttribute('src', url);
          vv.load();
        }
        vv.poster = card.dataset.poster || '';
        vTitle.textContent = card.dataset.title || '';
        vDesc.textContent = card.dataset.desc || '';
        vCount.textContent = (vIdx + 1) + ' / ' + films.length;
        vv.currentTime = 0;
        vv.muted = false;              // opened by a click, so audio is allowed
        var p = vv.play();
        if (p && p.catch) p.catch(function () { vv.muted = true; vv.play(); });
      };

      var openFilm = function (i) {
        // silence and pause the whole grid while the big player is up
        films.forEach(function (c) {
          setSound(c, false);
          var gv = $('video', c);
          if (gv) gv.pause();
        });
        soundOwner = null;
        vlb.classList.add('open');
        document.body.style.overflow = 'hidden';
        showFilm(i);
        $('.vlb__close').focus();
      };
      var closeFilm = function () {
        vv.pause();
        vv.muted = true;
        vlb.classList.remove('open');
        document.body.style.overflow = '';
        // let the IntersectionObserver pick the grid back up
        films.forEach(function (c) {
          var gv = $('video', c);
          if (!gv) return;
          var r = c.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) {
            var p = gv.play();
            if (p && p.catch) p.catch(function () {});
          }
        });
      };

      films.forEach(function (card, i) {
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.addEventListener('click', function () { openFilm(i); });
        card.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFilm(i); }
        });
      });

      $('.vlb__close').addEventListener('click', closeFilm);
      $('.vlb__prev').addEventListener('click', function () { showFilm(vIdx - 1); });
      $('.vlb__next').addEventListener('click', function () { showFilm(vIdx + 1); });
      var vMute = $('.vlb__mute');
      if (vMute) {
        vMute.addEventListener('click', function () {
          vv.muted = !vv.muted;
          vMute.textContent = vv.muted ? 'Sound on' : 'Sound off';
        });
        vv.addEventListener('volumechange', function () {
          vMute.textContent = vv.muted ? 'Sound on' : 'Sound off';
        });
      }
      vlb.addEventListener('click', function (e) { if (e.target === vlb) closeFilm(); });
      document.addEventListener('keydown', function (e) {
        if (!vlb.classList.contains('open')) return;
        if (e.key === 'Escape') closeFilm();
        if (e.key === 'ArrowLeft') showFilm(vIdx - 1);
        if (e.key === 'ArrowRight') showFilm(vIdx + 1);
      });
    }
  }

  /* =====================================================================
     BOOKING — three steps, ends in a fully written WhatsApp message
     ===================================================================== */
  var book = $('#book');
  if (book) {
    var state = {
      occasion: '', services: [], guests: '', date: '', venue: '',
      budget: '', name: '', phone: '', notes: ''
    };
    var step = 0;
    var steps = $$('.step', book);
    var bars = $$('.book__bar div', book);
    var errOf = function (n) { return $('.err', steps[n]); };

    var setStep = function (n) {
      step = Math.max(0, Math.min(steps.length - 1, n));
      steps.forEach(function (s, i) { s.classList.toggle('on', i === step); });
      bars.forEach(function (b, i) {
        b.dataset.on = String(i === step);
        b.dataset.done = String(i < step);
      });
      steps.forEach(function (s) { var e = $('.err', s); if (e) e.textContent = ''; });
      if (step === steps.length - 1) fillSummary();
      var top = book.getBoundingClientRect().top + window.scrollY - 100;
      if (window.scrollY > top) window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    };

    // single-choice groups
    $$('[data-group]', book).forEach(function (el) {
      el.addEventListener('click', function () {
        var g = el.dataset.group;
        $$('[data-group="' + g + '"]', book).forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        el.setAttribute('aria-pressed', 'true');
        state[g] = el.dataset.value;
        var e = $('.err', steps[step]); if (e) e.textContent = '';
      });
    });

    // multi-choice group (what they actually need from us)
    $$('[data-multi]', book).forEach(function (el) {
      el.addEventListener('click', function () {
        var on = el.getAttribute('aria-pressed') === 'true';
        el.setAttribute('aria-pressed', String(!on));
        var v = el.dataset.value, i = state.services.indexOf(v);
        if (!on && i === -1) state.services.push(v);
        if (on && i > -1) state.services.splice(i, 1);
        var e = $('.err', steps[step]); if (e) e.textContent = '';
      });
    });

    var dateInput = $('#ee-date', book);
    if (dateInput) {
      dateInput.min = new Date().toISOString().slice(0, 10);
      dateInput.addEventListener('change', function () {
        state.date = dateInput.value;
        var e = errOf(step); if (e) e.textContent = '';
      });
    }
    ['venue', 'name', 'phone', 'notes'].forEach(function (k) {
      var el = $('#ee-' + k, book);
      if (el) el.addEventListener('input', function () {
        state[k] = el.value.trim();
        if (step === steps.length - 1) fillSummary();
      });
    });

    var prettyDate = function (v) {
      if (!v) return 'Not set yet';
      var p = v.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]);
      if (isNaN(d)) return v;
      return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
    };

    function fillSummary() {
      $('#s-occasion').textContent = state.occasion || '—';
      $('#s-services').textContent = state.services.length ? state.services.join(', ') : 'Full planning — please advise';
      $('#s-when').textContent = prettyDate(state.date);
      $('#s-scale').textContent = state.guests + (state.venue ? ' · ' + state.venue : '');
    }

    function message() {
      var L = [];
      L.push('Hello Exquisite Events by You 👋');
      L.push('');
      L.push('I would like to enquire about planning an event.');
      L.push('');
      L.push('• Occasion: ' + state.occasion);
      L.push('• What I need: ' + (state.services.length ? state.services.join(', ') : 'Full planning — please advise'));
      L.push('• Date: ' + prettyDate(state.date));
      L.push('• Guests: ' + state.guests);
      if (state.venue) L.push('• Venue / area: ' + state.venue);
      if (state.budget) L.push('• Budget range: ' + state.budget);
      if (state.name) L.push('• Name: ' + state.name);
      if (state.phone) L.push('• Callback number: ' + state.phone);
      if (state.notes) L.push('• Notes: ' + state.notes);
      L.push('');
      L.push('Is this date still open, and could you send me a quote? Thank you.');
      L.push('— sent from your website');
      return L.join('\n');
    }

    $$('[data-next]', book).forEach(function (b) {
      b.addEventListener('click', function () {
        if (step === 0 && !state.occasion) { errOf(0).textContent = 'Please tell us what we are planning.'; return; }
        if (step === 1 && !state.date) { errOf(1).textContent = 'Please pick a date — even a rough one helps.'; return; }
        if (step === 1 && !state.guests) { errOf(1).textContent = 'Please choose a rough guest count.'; return; }
        setStep(step + 1);
      });
    });
    $$('[data-back]', book).forEach(function (b) {
      b.addEventListener('click', function () { setStep(step - 1); });
    });

    var send = $('#ee-send', book);
    if (send) {
      send.addEventListener('click', function () {
        window.open(window.EE.wa(message()), '_blank', 'noopener');
      });
    }
    setStep(0);
  }

  /* ---------------- prefilled WhatsApp links ---------------- */
  $$('[data-wa]').forEach(function (a) {
    a.setAttribute('href', window.EE.wa(a.dataset.wa));
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
  });

  /* ---------------- footer year ---------------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
