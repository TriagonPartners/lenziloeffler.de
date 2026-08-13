/**
 * manuel-beck.com
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

  if (!triggers.length) return;

  var panels = triggers.map(function (wrap) {
    return {
      wrap: wrap,
      button: wrap.querySelector('.action'),
      panel: wrap.querySelector('.panel'),
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
    if (item.panel === aboutPanel) startAbout();
  }

  function close(item) {
    window.clearTimeout(item.openTimer);
    if (!isOpen(item)) return;
    item.panel.classList.remove('is-open');
    item.button.setAttribute('aria-expanded', 'false');
    if (item.panel === aboutPanel) resetAbout();
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

      // Der Wrapper umfasst Button und Panel — dieses Ereignis feuert also
      // erst, wenn der Zeiger beides verlassen hat. Ohne Verzögerung: das
      // Verlassen beendet die Interaktion endgültig.
      item.wrap.addEventListener('mouseleave', function () {
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

  var aboutPanel = document.getElementById('panel-about');
  var scroller = aboutPanel && aboutPanel.querySelector('[data-about-scroller]');
  var stories = scroller
    ? Array.prototype.slice.call(scroller.querySelectorAll('[data-story]'))
    : [];
  var observer = null;
  var revealTimer = null;

  function startAbout() {
    if (!stories.length) return;

    resetAbout();

    // Erst nach dem Panel-Fade beobachten — sonst würde das erste Kapitel
    // aufdecken, während das Overlay noch unsichtbar ist.
    revealTimer = window.setTimeout(function () {
      if (!aboutPanel.classList.contains('is-open')) return;

      scroller.scrollTop = 0;

      if (!('IntersectionObserver' in window)) {
        stories.forEach(function (story) {
          story.classList.add('is-revealed');
        });
        return;
      }

      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      }, {
        root: scroller,
        // Auslösen, sobald das Kapitel zu einem Drittel eingelaufen ist — der
        // Reveal ist damit fertig, wenn das Kapitel steht.
        threshold: 0.3
      });

      stories.forEach(function (story) {
        observer.observe(story);
      });
    }, FIRST_REVEAL);
  }

  function resetAbout() {
    window.clearTimeout(revealTimer);
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    stories.forEach(function (story) {
      story.classList.remove('is-revealed');
    });
  }

  // Fehlende Medien nicht als kaputtes Bild zeigen — die Fläche bleibt dann
  // als neutraler Platzhalter stehen.
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
})();
