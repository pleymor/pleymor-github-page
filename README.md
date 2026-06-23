# pleymor-github-page

Source of the **pleymor.com** homepage — a projects portfolio linking to the apps
hosted on my VPS, plus the Karting 3D game served from GitHub Pages.

## Structure

- `index.html` — the projects homepage, deployed to `pleymor.com`.
- `kartz/` — the Karting 3D game, served by GitHub Pages.
- `deploy.sh` — deploys `index.html` to the VPS.

## Deploy

The homepage is served by nginx from `/var/www/pleymor` on the VPS:

```sh
./deploy.sh
```

This rsyncs `index.html` to the server and installs it into the web root (via `sudo`).
It does **not** touch `kartz/`.

## Karting 3D (GitHub Pages)

The game stays published through GitHub Pages and is linked from the homepage:

https://pleymor.github.io/pleymor-github-page/kartz/

To keep it live: Settings → Pages → Source → `main` branch, `/` (root).
