# Design — pleymor.com projects homepage

**Date:** 2026-06-23
**Status:** Approved (pending spec review)

## Goal

Turn this repo into the source of truth for the **pleymor.com** homepage: a single-page
**projects portfolio** linking to the apps hosted on the VPS, plus the Karting 3D game still
served from GitHub Pages.

The repo is no longer published *as* a GitHub Pages site for its homepage; GitHub Pages
remains alive only to keep serving the Karting game under `kartz/`.

## Projects featured

Five cards, in this order:

| # | Card | Icon | Link | Button | Notes |
|---|------|------|------|--------|-------|
| 1 | Karting 3D | 🏁 | `https://pleymor.github.io/pleymor-github-page/kartz/` | Jouer ↗ | External (GitHub Pages) |
| 2 | SNES Emulator | 🎮 | `https://snes.pleymor.com` | Visiter ↗ | VPS (psnes) |
| 3 | Reveo | 🔌 | `https://reveo.pleymor.com` | Visiter ↗ | VPS PWA — manage a Reveo EV charging-stations account |
| 4 | Archives météo | 🌦️ | `https://archivesmeteo.pleymor.com` | Visiter ↗ | VPS (Open-Meteo history viewer) |
| 5 | Évolution animale | 🧬 | `https://lifetree.pleymor.com` | Visiter ↗ | VPS (animal evolution visualization) |

**Excluded:** Draw (currently 502 / down), n8n & AdGuard/DNS (infrastructure, not showcase
projects).

Descriptions are written in French (page `lang="fr"`).

## Components

### 1. `index.html` (the homepage)

Reuses the existing neon/glassmorphism dark theme. Changes:

- **Header:** retitle `PORTFOLIO de Jeux HTML` → **PLEYMOR**, subtitle → **Mes projets**.
  Keep the animated rainbow/neon styling.
- **Showcase:** convert the single centered `.game-card` into a **responsive grid**
  (`auto-fit, minmax(~320px, 1fr)`) of the five project cards above. Each card: emoji icon,
  title, short French description, and a button (`Jouer`/`Visiter`). External links open in a
  new tab (`target="_blank" rel="noopener"`) with a `↗` affordance.
- **Remove** the Karting-specific "✨ TECHNOLOGIES AVANCÉES ✨" features section — it does not
  fit a multi-project portfolio.
- **Footer:** drop "Karting 3D Portfolio" wording; generic `© 2026 Pleymor` line.

### 2. `deploy.sh`

Manual deploy script. Pushes **only `index.html`** to the VPS web root:

```sh
rsync -avz -e ssh ./index.html pleymor@pleymor.com:/tmp/pleymor-deploy-index.html
ssh pleymor@pleymor.com 'sudo install -m 644 -o root -g root /tmp/pleymor-deploy-index.html /var/www/pleymor/index.html'
```

- `/var/www/pleymor` is root-owned; passwordless `sudo` for `pleymor` is confirmed working.
- `kartz/` is **not** deployed — it stays on GitHub Pages.

### 3. `README.md`

Replace the old "publish to GitHub Pages" instructions with:
- what the site is (pleymor.com projects homepage),
- how to deploy (`./deploy.sh`),
- the note that `kartz/` is still served by GitHub Pages.

## Data flow

```
edit index.html  ──►  ./deploy.sh  ──►  rsync + sudo install  ──►  /var/www/pleymor/index.html
                                                                    (served at https://pleymor.com)
kartz/  ──►  git push  ──►  GitHub Pages  ──►  pleymor.github.io/pleymor-github-page/kartz/
```

## Error handling

- `deploy.sh` uses `set -euo pipefail` so a failed rsync/ssh aborts rather than silently
  half-deploying.
- Nginx for `www.pleymor.com` already serves `/var/www/pleymor` — no server config changes.

## Testing / verification

- Lint: open `index.html` locally, confirm all five cards render and links point to the right
  URLs.
- Post-deploy: `curl -sI https://pleymor.com` returns 200 and the page `<title>` is updated;
  spot-check each card link resolves (the four VPS ones + the GitHub Pages one).

## Out of scope

- The Karting game itself (`kartz/`) — unchanged.
- nginx / DNS / TLS — already correct.
- Repo cleanup beyond README (e.g. removing old GitHub-Pages-specific files) — none needed.
