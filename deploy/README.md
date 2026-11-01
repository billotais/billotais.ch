# Deploying billotais.ch

GitHub Actions builds a Docker image (Caddy serving the static `dist/`) and pushes it to
`ghcr.io/billotais/billotais.ch`. The VPS (`lab.billotais.local`, reached over NetBird) pulls and runs it.
NetBird's reverse proxy points at the container on port 8080 and handles the domain and TLS.

## Everyday: publish a change

```sh
npm run sync                  # only if the Obsidian vault changed; regenerates src/data/*.json
git add -A && git commit -m "..." && git push
# wait for the "Build and push image" run to go green (Actions tab), then:
npm run deploy                # ssh to the VPS: docker compose pull && up -d && image prune
```

Override the target with `DEPLOY_HOST` (default `billotais@lab.billotais.local`) and `DEPLOY_DIR`
(default `billotais-ch`, relative to the VPS home).

## Local checks

```sh
npm run dev                   # dev server on http://localhost:4321
npm run build                 # static build into dist/
docker build -t billotais-ch . && docker run --rm -p 8080:8080 billotais-ch   # try the image locally
```

## One-time setup on the VPS

```sh
ssh billotais@lab.billotais.local 'mkdir -p ~/billotais-ch'
scp deploy/compose.yml billotais@lab.billotais.local:~/billotais-ch/
ssh billotais@lab.billotais.local 'cd ~/billotais-ch && docker compose up -d'
```

Also: set the GHCR package `billotais.ch` to Public (GitHub profile → Packages → Package settings), and add
a NetBird service for the domain targeting the VPS peer on `http://<vps-peer>:8080`.

## Protected pages (SSO with groups)

`Caddyfile` (baked into the image) gates paths through `oauth2-proxy` (second service in `compose.yml`), which logs
users in with Pocket ID. Each protected path lists the Pocket ID group(s) allowed to see it:

```
handle /secret* {
    import gate admin             # one group
}
handle /family/* {
    import gate "elca|admin"      # either group (regex over the `groups` claim)
}
```

Not signed in -> redirected to Pocket ID; signed in but wrong group -> 403. Add the page under `src/pages/`, add a
`handle` block, push, deploy. The dev server (`npm run dev`) does not enforce this; only the Caddy image does.

Setup in Pocket ID: on the existing OIDC client add the callback URLs `https://billotais.ch/oauth2/callback` and `https://loisbilat.ch/oauth2/callback` (one per domain; `www.` hosts are redirected to the bare domain by the Caddyfile),
generate a client secret, and make sure the `groups` scope is allowed. Then on the VPS:

```sh
cd ~/billotais.ch/deploy && cp .env.example .env    # fill in OIDC_CLIENT_SECRET and COOKIE_SECRET
docker compose up -d
```

## Operating the container (on the VPS, in `~/billotais-ch`)

```sh
docker compose ps                          # status
docker compose logs -f                     # logs
docker compose pull && docker compose up -d   # update to latest (what npm run deploy does)
docker compose restart                     # restart
docker compose down                        # stop and remove
curl -I http://localhost:8080              # check it serves locally
```

## Roll back

Every push also tags the image with its commit SHA. In `compose.yml` on the VPS, change
`image: ghcr.io/billotais/billotais.ch:latest` to `:<sha>` and run `docker compose up -d`.

## Leftovers from GitHub Pages

`.github/workflows/deploy.yml` and `public/CNAME` still publish to GitHub Pages. Delete both once DNS points
at the VPS.
