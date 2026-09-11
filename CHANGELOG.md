# Changelog

Alle nennenswerten Änderungen an lenziloeffler.de. Neueste Version oben.
Jede Version ist als Git-Tag abgelegt und lässt sich mit
`git checkout <tag>` exakt wiederherstellen.

---

## v1.3 — 11.09.2026

Aufräum- und Übergabestand. **Keine funktionalen oder visuellen Änderungen**
gegenüber v1.2 — die gerenderte Seite ist auf Desktop, iPhone und iPad
pixelidentisch (byteweise verglichen gegen einen v1.2-Worktree).

### Entfernt

| Was | Umfang | Begründung |
|---|---|---|
| 20 lose JPGs direkt in `site/` | 1,79 MB | Altlasten neben der strukturierten Ablage `assets/images/`; repoweit unreferenziert, waren aber öffentlich erreichbar |
| `site/assets/icons/linkedin-brands-solid-full.svg` | 776 B | überholt — das Stylesheet maskiert ausschließlich `linkedin-in-brands-solid-full_new_.svg` |
| `package-lock.json` | 95 B | verwaist, kein `package.json`, kein Build-Schritt |
| 5 × `.DS_Store` | — | macOS-Temporärdateien |

Betroffene Dateinamen: `band55` `band62` `band70` `f4-A` `f4-B` `f4-C` `f4-D`
`hx40` `hx45` `hx48` `r2-50` `race-1-mobile` `race-1` `race-2` `race-3`
`race-4` `user-1` `user-2` `user-3` `user-4` (alle `.jpg`, alle aus `site/`).

### Ergänzt

- `CHANGELOG.md` (diese Datei)
- README: Voraussetzungen und bekannte Punkte

### Bewusst behalten

`originale/` bleibt vollständig erhalten (Archiv unbearbeiteter Quelldateien,
wird nicht deployt), darin auch `Saira.zip` (11,5 MB, inhaltsgleich mit dem
entpackten Ordner daneben). Ebenso `site/assets/images/racing/race-1.*` —
unreferenziert, aber aufbereitetes Website-Asset der Bildstrecke.

---

## v1.2 — 11.09.2026

Erster Release mit Intro-Opener und Video im Racing-Pop-up.

- **Intro-Opener** auf der Startseite: Fullscreen-Overlay in CDF-Dunkelblau,
  Logo-Clip blendet über 0,45 s ein, läuft 1,6 s, hält seinen letzten Frame
  0,75 s und blendet über 1,4 s zur Startseite aus. Kein Redirect, kein
  Reload. Die Animation der Startseite startet erst mit diesem Übergang statt
  unsichtbar hinter dem Overlay.
- **Video-Kapitel im Racing-Pop-up** als erster Abschnitt, mit
  `--media-zoom: 1.45` gegen den eingebrannten Rahmen des Clips.
- **Sichtbare Scrollleisten** in allen drei Pop-ups: eigene Overlay-Leiste,
  im Ruhezustand unsichtbar, erscheint beim vertikalen Scrollen.
- README und DEPLOY.md um die zugehörigen Messwerte und Fallstricke ergänzt.

---

## v1.1 — 09.09.2026

Ausgangsstand: Startseite mit Hero, drei Pop-ups (Profile, Racing,
Partnerships), Countdown mit Streckenverlauf, Rechtsseiten, Design-System in
zehn Stylesheet-Abschnitten.
