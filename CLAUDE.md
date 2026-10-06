# CLAUDE.md

Static Next.js homepage, exported with `output: "export"` and published to GitHub Pages by
`.github/workflows/deploy.yml` on every push to `main`.

## Guidelines

- Never perform Git operations
- No server: `output: "export"` is not negotiable. No route handlers, server actions or middleware
- Favor running `pnpm check` and `pnpm fix` instead of individual code quality tools
- Don't run `pnpm build` - `pnpm check` suffices for checking the code
- Don't modify ESLint or Prettier configurations to remove errors - make the code conform instead

## Dev container ports

The dev server is published through Docker, and the host side of the mapping is configurable:
`LUMORA_HOMEPAGE_PORT_3000` names the host port and defaults to 3000 (see
`.devcontainer/docker-compose.yml`). Inside the container the port never changes; on the host
machine it does. Never quote a container port as a host address.

Whoever runs the container picks the value, so do not assume the default. Read it from the live
environment inside the container:

```bash
env | grep LUMORA_HOMEPAGE_PORT_
```

If the variable is absent (the container predates a `docker-compose.yml` change), read the mapping
from the host machine with `docker port lumora-homepage-node` instead. VS Code is told not to
auto-forward port 3000 (`onAutoForward: ignore`), so the Docker mapping does not appear in its
Ports view.
