/**
 * lenziloeffler.de
 *
 * 1) Panel-Logik (About Me / Contact)
 *
 *    Zeigergeräte:
 *      Öffnen  — ausschließlich beim Betreten des Icons.
 *      Schließen — sobald der Zeiger Icon UND Panel verlässt. Damit ist die
 *      Interaktion abgeschlossen; ein erneutes Öffnen geht nur über das Icon.
 *
 *    Das Öffnen hängt bewusst am Button und nicht am umgebenden Wrapper: das
 *    geöffnete Panel liegt über dem Button, ein zweites mouseenter kann also
 *    gar nicht erst ausgelöst werden. Genau daraus entstand vorher das
 *    unruhige Auf und Zu.
 *
 *    Touch: Tippen schaltet um. Tastatur: Fokus öffnet nur, wenn er per
 *    Tastatur gesetzt wurde (:focus-visible), nicht nach einem Mausklick.
 *    Zusätzlich schließen Escape, ein Klick außerhalb und der ✕-Button.
 *
 * 2) Scroll-Reveal im About-Overlay
 *    Jedes Kapitel deckt sein Medium auf, sobald es in den sichtbaren Bereich
 *    des Overlays läuft: die Weichzeichnung löst sich, der Text zieht nach.
 *    Beim Schließen wird zurückgesetzt, damit die Sequenz erneut abläuft.
 *
 * 3) Countdown auf das nächste Rennwochenende
 *    Der Zielzeitpunkt steht als ISO-Zeitstempel mit Zeitzone im Markup
 *    (data-countdown), die Ziffern setzt diese Datei. Die Kacheln sind im
 *    Markup mit [hidden] versehen und werden erst hier eingeschaltet: ohne
 *    JavaScript stünde sonst eine Reihe Nullen. Ort und Datum stehen als
 *    Text im Markup und bleiben in jedem Fall lesbar.
 *
 * 4) Umrandungen — die Kontur der drei Schaltflächen und der
 *    Countdown-Kacheln wird hier gerechnet und als SVG-Pfad gezeichnet.
 *    Grund: eine per skewX() gescherte CSS-Umrandung ist an den 45°-Kanten
 *    nur 0,71× und im gerundeten Eck 1,41× so dick wie oben und unten — ein
 *    Faktor 2 zwischen dünnster und dickster Stelle. Ein Strich auf einem
 *    Pfad ist dagegen überall gleich dick. Ausführlich bei .frame im
 *    Stylesheet. Ohne JavaScript bleibt die gescherte Umrandung stehen.
 */
(function () {
  'use strict';

  var FIRST_REVEAL = 120; // ms — Vorlauf für das erste Kapitel nach dem Öffnen
  // Kurzer Vorlauf vor dem Öffnen: das Icon liegt unter dem Panel, ohne diese
  // Pause wäre seine Akzentfarbe nie zu sehen. Nebeneffekt: beim bloßen
  // Überstreichen der Icons klappt nichts mehr auf.
  var OPEN_DELAY = 280;

  var hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var triggers = Array.prototype.slice.call(
    document.querySelectorAll('[data-panel-trigger]')
  );

  var aboutPanel = document.getElementById('panel-about');
  var racingPanel = document.getElementById('panel-racing');

  if (!triggers.length) return;

  var panels = triggers.map(function (wrap) {
    var button = wrap.querySelector('.action');
    // Das Panel muss nicht im Wrapper liegen: das Contact-Panel steht im
    // Logo-Slot, damit es sich dort exakt einpassen kann. aria-controls ist
    // ohnehin gesetzt und dient hier als Verweis.
    var id = button && button.getAttribute('aria-controls');
    return {
      wrap: wrap,
      button: button,
      panel: (id && document.getElementById(id)) || wrap.querySelector('.panel'),
      openTimer: null
    };
  });

  /* --- Panels ---------------------------------------------------------- */

  function open(item) {
    window.clearTimeout(item.openTimer);
    panels.forEach(function (other) {
      if (other !== item) close(other);
    });
    item.panel.classList.add('is-open');
    item.button.setAttribute('aria-expanded', 'true');
    if (item.panel.classList.contains('panel--story')) startAbout(item.panel);
  }

  function close(item) {
    window.clearTimeout(item.openTimer);
    if (!isOpen(item)) return;
    item.panel.classList.remove('is-open');
    item.button.setAttribute('aria-expanded', 'false');
    if (item.panel.classList.contains('panel--story')) resetAbout(item.panel);
    if (item.hideScrollbar) item.hideScrollbar();
  }

  function closeAll() {
    panels.forEach(close);
  }

  function isOpen(item) {
    return item.panel.classList.contains('is-open');
  }

  panels.forEach(function (item) {
    if (hasHover) {
      item.button.addEventListener('mouseenter', function () {
        window.clearTimeout(item.openTimer);
        item.openTimer = window.setTimeout(function () {
          open(item);
        }, OPEN_DELAY);
      });

      // Der Wrapper umfasst Button UND Panel — aber nur bei den beiden
      // Story-Panels. Das Partnerships-Panel steht im Logo-Slot, damit es
      // sich zwischen Hero-Zeile und Wortmarke einpassen kann, und liegt
      // damit AUSSERHALB des Wrappers. Ohne die Prüfung auf relatedTarget
      // schloss es deshalb in dem Moment, in dem der Zeiger den Button
      // verliess, um zum Panel zu wandern — und der Weg dorthin führt über
      // das Panel selbst, das dabei wieder verschwand: das Auf und Zu, das
      // beim Partnerships-Button zu sehen war.
      item.wrap.addEventListener('mouseleave', function (event) {
        if (item.panel.contains(event.relatedTarget)) return;
        close(item);
      });

      // Und das Gegenstück: verlässt der Zeiger das Panel, ohne auf dem
      // Button zu landen, ist die Interaktion beendet.
      item.panel.addEventListener('mouseleave', function (event) {
        if (item.wrap.contains(event.relatedTarget)) return;
        close(item);
      });
    }

    // Klick/Tap schaltet um — auf Touch der einzige Weg.
    item.button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (isOpen(item)) {
        close(item);
      } else {
        open(item);
      }
    });

    // Nur bei Tastaturfokus öffnen, nicht nach einem Mausklick.
    item.button.addEventListener('focus', function () {
      var keyboard = true;
      try {
        keyboard = item.button.matches(':focus-visible');
      } catch (e) {
        /* ältere Browser ohne :focus-visible — dann wie bisher öffnen */
      }
      if (keyboard) open(item);
    });

    item.wrap.addEventListener('focusout', function (event) {
      if (!item.wrap.contains(event.relatedTarget)) close(item);
    });

    var closeButton = item.panel.querySelector('[data-panel-close]');
    if (closeButton) {
      closeButton.addEventListener('click', function (event) {
        event.stopPropagation();
        close(item);
        item.button.blur();
      });
    }
  });

  // Klick außerhalb schließt alle Panels
  document.addEventListener('click', function (event) {
    var inside = panels.some(function (item) {
      return item.wrap.contains(event.target);
    });
    if (!inside) closeAll();
  });

  // Escape schließt alle Panels
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeAll();
  });

  /* --- About-Overlay: Scroll-Reveal ------------------------------------ */

  function startAbout(panel) {
    var scroller = panel.querySelector('[data-about-scroller]');
    var stories = scroller
      ? Array.prototype.slice.call(scroller.querySelectorAll('[data-story]'))
      : [];
    if (!stories.length) return;

    resetAbout(panel);

    // Erst nach dem Panel-Fade beobachten — sonst würde das erste Kapitel
    // aufdecken, während das Overlay noch unsichtbar ist.
    panel.revealTimer = window.setTimeout(function () {
      if (!panel.classList.contains('is-open')) return;

      // Der Sprung zurueck nach oben ist keine Nutzerbewegung und soll die
      // Scrollleiste deshalb nicht aufblitzen lassen.
      ignoreNextScroll();
      scroller.scrollTop = 0;

      // Clip von vorn, moeglichst mit Ton — siehe startVideos().
      startVideos(panel);

      if (!('IntersectionObserver' in window)) {
        stories.forEach(function (story) {
          story.classList.add('is-revealed');
        });
        return;
      }

      panel.observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          panel.observer.unobserve(entry.target);
        });
      }, {
        root: scroller,
        // Auslösen, sobald das Kapitel zu einem Drittel eingelaufen ist — der
        // Reveal ist damit fertig, wenn das Kapitel steht.
        threshold: 0.3
      });

      stories.forEach(function (story) {
        panel.observer.observe(story);
      });
    }, FIRST_REVEAL);
  }

  function resetAbout(panel) {
    var scroller = panel.querySelector('[data-about-scroller]');
    var stories = scroller
      ? Array.prototype.slice.call(scroller.querySelectorAll('[data-story]'))
      : [];
    window.clearTimeout(panel.revealTimer);
    if (panel.observer) {
      panel.observer.disconnect();
      panel.observer = null;
    }
    panel.revealTimer = null;
    stories.forEach(function (story) {
      story.classList.remove('is-revealed');
    });
    // Gegenstueck zum Start: anhalten und zurueckspulen, damit das naechste
    // Oeffnen wieder beim ersten Frame beginnt.
    stopVideos(panel);
  }

  /* --- Ton in Panel-Videos ----------------------------------------------
     Die Story-Panels oeffnen auf Geraeten mit Maus per mouseenter (siehe
     oben). Ein mouseenter ist fuer den Browser aber KEINE Nutzergeste, und
     ohne Geste verweigert jeder Browser die Tonwiedergabe. Ein Klick auf den
     Button hilft nicht: der schaltet um und wuerde das per Hover bereits
     geoeffnete Panel wieder schliessen. Deshalb drei Stufen:

       1. Beim Oeffnen mit Ton versuchen. Das gelingt, sobald irgendwo auf
          der Seite schon einmal geklickt wurde — sie gilt dem Browser dann
          als aktiviert und laesst Ton zu.
       2. Lehnt er ab, laeuft der Clip stumm weiter und meldet sich fuer die
          naechste echte Geste an. Kommt sie waehrend der Wiedergabe, faellt
          nur die Stummschaltung; ist der Clip schon durch, startet er neu.
       3. Ein Klick direkt auf das Video startet es jederzeit mit Ton. Das
          ist der eine Weg, der in jedem Browser verlaesslich funktioniert. */

  var waitingForGesture = [];

  function play(video) {
    var started = video.play();
    if (started && started.catch) started.catch(function () {});
    return started;
  }

  function playWithSound(video) {
    video.muted = false;
    if (video.ended || video.paused) video.currentTime = 0;
    play(video);
  }

  function startVideos(panel) {
    Array.prototype.forEach.call(panel.querySelectorAll('video'), function (video) {
      video.currentTime = 0;
      video.muted = false;
      var started = video.play();
      if (!started || !started.catch) return;
      started.catch(function () {
        // Ton abgelehnt: stumm laufen lassen und auf die erste Geste warten.
        video.muted = true;
        play(video);
        if (waitingForGesture.indexOf(video) === -1) waitingForGesture.push(video);
      });
    });
  }

  function stopVideos(panel) {
    Array.prototype.forEach.call(panel.querySelectorAll('video'), function (video) {
      video.pause();
      video.currentTime = 0;
      var waiting = waitingForGesture.indexOf(video);
      if (waiting !== -1) waitingForGesture.splice(waiting, 1);
    });
  }

  // Stufe 2: die erste echte Geste holt den Ton nach.
  function unmuteOnGesture() {
    if (!waitingForGesture.length) return;
    var pending = waitingForGesture;
    waitingForGesture = [];
    pending.forEach(playWithSound);
  }

  ['pointerdown', 'keydown'].forEach(function (type) {
    document.addEventListener(type, unmuteOnGesture, true);
  });

  // Stufe 3: Klick auf das Video selbst — von vorn, mit Ton.
  Array.prototype.forEach.call(document.querySelectorAll('.panel--story video'), function (video) {
    video.addEventListener('click', function () {
      video.currentTime = 0;
      playWithSound(video);
    });
  });

  /* --- Sichtbare Scrollleiste in den Pop-ups -----------------------------
     Bisher war in den Pop-ups nicht zu erkennen, dass unter dem sichtbaren
     Ausschnitt noch Inhalt liegt — der unscharfe Anschnitt des naechsten
     Kapitels allein ist je nach Motiv kaum wahrnehmbar. Diese Leiste kommt
     als zweiter, ruhiger Hinweis dazu.

     Sie ersetzt keine Scroll-Logik: gescrollt wird weiter vom Browser, hier
     wird ausschliesslich mitgelesen und gezeichnet. Gestalt siehe
     .panel__scroll im Stylesheet. */

  var MIN_THUMB = 24;   // px — darunter waere der Daumen kaum noch zu sehen
  var HIDE_AFTER = 1000; // ms Ruhe, danach blendet die Leiste wieder aus

  /* Nicht jedes scroll-Ereignis stammt vom Nutzer: beim Oeffnen setzt
     startAbout() den Container auf null zurueck. Diese Flagge blendet genau
     solche selbst ausgeloesten Spruenge aus. Zwei Frames, weil das Ereignis
     erst nach dem Setzen zugestellt wird. */
  var programmaticScroll = false;

  function ignoreNextScroll() {
    programmaticScroll = true;
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        programmaticScroll = false;
      });
    });
  }

  function setupPanelScrollbar(item) {
    var panel = item.panel;
    if (!panel) return;

    /* In Profile und Racing scrollt der innere Kapitelcontainer, im
       Contact-Panel das Panel selbst (dort ist overflow-y der Notausgang
       fuer zu langen Text). */
    var scroller = panel.querySelector('[data-about-scroller]') || panel;

    var track = document.createElement('div');
    track.className = 'panel__scroll';
    track.setAttribute('aria-hidden', 'true');
    var thumb = document.createElement('span');
    thumb.className = 'panel__scroll-thumb';
    track.appendChild(thumb);
    panel.appendChild(track);

    function sync() {
      var viewport = scroller.clientHeight;
      var total = scroller.scrollHeight;
      var scrollable = total - viewport;

      // Passt alles in den Ausschnitt, gibt es nichts anzuzeigen.
      if (scrollable <= 1) {
        track.hidden = true;
        return;
      }
      track.hidden = false;

      /* Scrollt das Panel selbst, wandert die absolut gesetzte Leiste mit
         dem Inhalt nach oben aus dem Bild. Der Versatz haelt sie an Ort und
         Stelle. Bei .about erledigt das der Container und der Versatz
         bleibt leer. */
      track.style.transform = scroller === panel
        ? 'translateY(' + scroller.scrollTop + 'px)'
        : '';

      var trackHeight = track.clientHeight;
      // Laenge im Verhaeltnis sichtbar zu gesamt, nach unten begrenzt.
      var height = Math.max(MIN_THUMB, Math.round(trackHeight * viewport / total));
      var progress = scroller.scrollTop / scrollable;
      thumb.style.height = height + 'px';
      thumb.style.top = Math.round(progress * (trackHeight - height)) + 'px';
    }

    /* Sichtbarkeit. Ausgeloest wird ausschliesslich vom scroll-Ereignis des
       Containers — und weil alle drei nur overflow-y fuehren, kann es nur
       durch vertikales Scrollen entstehen. Ein Zeiger, der bloss ueber dem
       Pop-up liegt, und eine waagerechte Mausbewegung erzeugen keines. */
    var hideTimer = null;

    function reveal() {
      if (programmaticScroll) return;
      track.classList.add('is-scrolling');
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(function () {
        track.classList.remove('is-scrolling');
      }, HIDE_AFTER);
    }

    // Beim Schliessen sofort zuruecksetzen, sonst stuende die Leiste beim
    // schnellen Wiederaufklappen noch sichtbar da, ohne dass gescrollt wurde.
    item.hideScrollbar = function () {
      window.clearTimeout(hideTimer);
      track.classList.remove('is-scrolling');
    };

    scroller.addEventListener('scroll', function () {
      sync();
      reveal();
    }, { passive: true });
    window.addEventListener('resize', sync);

    /* Bilder und Video aendern die Gesamthoehe erst, wenn sie geladen sind.
       Der Beobachter faengt das ab, ohne dass hier gepollt werden muss. */
    if ('ResizeObserver' in window) {
      var observer = new ResizeObserver(sync);
      observer.observe(scroller);
      Array.prototype.forEach.call(scroller.children, function (child) {
        observer.observe(child);
      });
    }

    sync();
  }

  panels.forEach(setupPanelScrollbar);

  function initializeAboutState(panel) {
    panel.observer = null;
    panel.revealTimer = null;
  }

  [aboutPanel, racingPanel].forEach(function (panel) {
    if (panel) initializeAboutState(panel);
  });

  // Fehlende Medien nicht als kaputtes Bild zeigen — die Fläche bleibt dann
  // als neutraler Platzhalter stehen.
  [aboutPanel, racingPanel].forEach(function (panel) {
    if (!panel) return;
    var scroller = panel.querySelector('[data-about-scroller]');
    var stories = scroller
      ? Array.prototype.slice.call(scroller.querySelectorAll('[data-story]'))
      : [];
    stories.forEach(function (story) {
    var media = story.querySelector('img, video');
    if (!media) return;

    function hide() {
      media.style.display = 'none';
    }

    media.addEventListener('error', hide);

    if (media.tagName === 'IMG' && media.complete && media.naturalWidth === 0) {
      hide();
    }
    });
  });

  /* --- Countdown ------------------------------------------------------- */

  function pad(n) {
    return (n < 10 ? '0' : '') + n;
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-countdown]'))
    .forEach(function (root) {
      var target = Date.parse(root.getAttribute('data-countdown'));
      var clock = root.querySelector('[data-countdown-clock]');
      if (!clock || isNaN(target)) return;

      var timer = null;
      var fields = {};
      Array.prototype.slice.call(clock.querySelectorAll('[data-countdown-unit]'))
        .forEach(function (el) {
          fields[el.getAttribute('data-countdown-unit')] = el;
        });

      function tick() {
        var left = target - Date.now();

        // Ist der Termin durch, verschwinden die Kacheln wieder. Ort und
        // Datum bleiben stehen, bis im Markup das nächste Ziel eingetragen
        // wird — besser als ein Zähler, der ins Negative läuft.
        if (left <= 0) {
          clock.hidden = true;
          if (timer) timer = window.clearInterval(timer) || null;
          done = true;
          return;
        }

        var s = Math.floor(left / 1000);
        set('days', Math.floor(s / 86400));
        set('hours', Math.floor(s / 3600) % 24);
        set('minutes', Math.floor(s / 60) % 60);
        set('seconds', s % 60);
        clock.hidden = false;
      }

      function set(unit, value) {
        var el = fields[unit];
        if (!el) return;
        var text = pad(value);
        // Nur schreiben, wenn sich etwas geändert hat: das hält den
        // Sekundentakt aus dem Layout heraus.
        if (el.textContent !== text) el.textContent = text;
      }

      // done verhindert, dass bei einem bereits vergangenen Termin überhaupt
      // ein Intervall anläuft — clearInterval(null) wäre hier zu spät.
      var done = false;
      tick();
      if (!done) timer = window.setInterval(tick, 1000);
    });

  /* --- Umrandungen ----------------------------------------------------- */
  /* Gezeichnet wird das i-Pünktchen der Wortmarke: ein Parallelogramm mit
     waagerechter Ober- und Unterkante, um --slant-tan geneigten Seiten und
     einem Kreisbogen auf den beiden STUMPFEN Ecken (oben links, unten
     rechts). Die spitzen bleiben scharf.

     Alle Maße kommen aus dem Stylesheet, keines steht hier doppelt:
     --slant-tan die Neigung, --action-frame-chord die Sehne der Rundung,
     stroke-width die Strichstärke. */

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function unit(a, b) {
    var dx = b[0] - a[0];
    var dy = b[1] - a[1];
    var n = Math.sqrt(dx * dx + dy * dy);
    return n ? [dx / n, dy / n] : [0, 0];
  }

  function along(p, u, k) {
    return [p[0] + u[0] * k, p[1] + u[1] * k];
  }

  function xy(p) {
    return p[0].toFixed(2) + ' ' + p[1].toFixed(2);
  }

  /**
   * @param w  Breite des Kastens in px (er umfasst den 45°-Überhang schon)
   * @param h  Höhe des Kastens in px
   * @param sw Strichstärke in px
   * @param t  tan des Neigungswinkels gegen die Senkrechte
   * @param cr Sehne der Eckrundung als Anteil der Höhe
   */
  function frameGeometry(w, h, sw, t, cr) {
    // Der Strich sitzt mittig auf dem Pfad. Damit er innerhalb des Kastens
    // bleibt, liegt der Pfad um die halbe Strichstärke SENKRECHT nach innen:
    // oben und unten sind das d, an den geneigten Seiten waagerecht
    // d · sec(Winkel) — sonst wäre der Versatz dort zu klein.
    var d = sw / 2;
    var sec = Math.sqrt(1 + t * t);
    var xs = d * sec;
    var yTop = d;
    var yBot = h - d;

    // Die Eckpunkte des Parallelogramms. Die linke Kante läuft auf
    // x = t · (h − y), die rechte auf x = w − t · y; beide um xs nach innen.
    var TL = [t * (h - d) + xs, yTop];
    var TR = [w - t * d - xs, yTop];
    var BR = [w - t * (h - d) - xs, yBot];
    var BL = [t * d + xs, yBot];

    var uTLtoTR = unit(TL, TR);
    var uTLtoBL = unit(TL, BL);
    var uBRtoBL = unit(BR, BL);
    var uBRtoTR = unit(BR, TR);

    // Öffnungswinkel der stumpfen Ecke: der Richtungswechsel zwischen
    // geneigter und waagerechter Kante, also 180° − 135,1° = 44,9°.
    var phi = Math.acos(Math.min(1, Math.max(-1, t / sec)));
    var R = (cr * h) / (2 * Math.sin(phi / 2));
    var L = R * Math.tan(phi / 2);

    // Auf sehr flachen oder sehr schmalen Kästen darf die Rundung die Kante
    // nicht überlaufen.
    var topLen = Math.sqrt(Math.pow(TR[0] - TL[0], 2) + Math.pow(TR[1] - TL[1], 2));
    var sideLen = Math.sqrt(Math.pow(BL[0] - TL[0], 2) + Math.pow(BL[1] - TL[1], 2));
    var maxL = Math.min(topLen, sideLen) / 2;
    if (L > maxL && L > 0) {
      R = R * (maxL / L);
      L = maxL;
    }

    // Umlauf TL → TR → BR → BL, im Uhrzeigersinn (y zeigt nach unten),
    // deshalb sweep-flag 1 auf beiden Bögen.
    var startTL = along(TL, uTLtoTR, L);
    return 'M' + xy(startTL) +
           'L' + xy(TR) +
           'L' + xy(along(BR, uBRtoTR, L)) +
           'A' + R.toFixed(2) + ' ' + R.toFixed(2) + ' 0 0 1 ' + xy(along(BR, uBRtoBL, L)) +
           'L' + xy(BL) +
           'L' + xy(along(TL, uTLtoBL, L)) +
           'A' + R.toFixed(2) + ' ' + R.toFixed(2) + ' 0 0 1 ' + xy(startTL) +
           'Z';
  }

  var frames = Array.prototype.slice.call(
    document.querySelectorAll('.action, .countdown__tile')
  ).map(function (host) {
    // Kein viewBox: eine Nutzereinheit ist damit ein CSS-Pixel, die
    // gerechneten Maße gehen unverändert in den Pfad.
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'frame');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var shape = document.createElementNS(SVG_NS, 'path');
    shape.setAttribute('class', 'frame__shape');
    svg.appendChild(shape);
    host.insertBefore(svg, host.firstChild);
    return { host: host, svg: svg, shape: shape, key: '' };
  });

  function paintFrame(frame) {
    var box = frame.svg.getBoundingClientRect();
    if (!box.width || !box.height) return;

    var own = window.getComputedStyle(frame.host);
    var t = parseFloat(own.getPropertyValue('--slant-tan')) || 1;
    var cr = parseFloat(own.getPropertyValue('--action-frame-chord')) || 0.438;
    var sw = parseFloat(window.getComputedStyle(frame.shape).strokeWidth) || 1;

    // Nur neu schreiben, wenn sich wirklich etwas geändert hat.
    var key = [box.width, box.height, sw, t, cr].join('|');
    if (key === frame.key) return;
    frame.key = key;

    frame.shape.setAttribute('d', frameGeometry(box.width, box.height, sw, t, cr));
  }

  function paintFrames() {
    frames.forEach(paintFrame);
  }

  if (frames.length) {
    paintFrames();

    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(function (entries) {
        entries.forEach(function (entry) {
          var frame = frames.filter(function (f) { return f.svg === entry.target; })[0];
          if (frame) paintFrame(frame);
        });
      });
      frames.forEach(function (frame) {
        ro.observe(frame.svg);
      });
    } else {
      window.addEventListener('resize', paintFrames);
    }

    // Die Kachelreihe steht im Markup auf [hidden] und hätte dann keine Maße.
    // Der Countdown weiter oben schaltet sie noch vor diesem Abschnitt ein,
    // der erste Durchgang trifft sie also schon. Ist der Termin durch,
    // bleibt sie verborgen — dann gibt es auch nichts zu zeichnen.
  }
})();
