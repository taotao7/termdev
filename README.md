# termdev

A Bun + TypeScript **Chrome DevTools Protocol (CDP)** client with a terminal UI (Ink) for:

- **Logs**: console output + exceptions (supports selecting each line and expanding objects)
- **Network**: request list with expandable request/response details
- **Eval**: run JavaScript in the attached page from the terminal

## Prerequisites

- Bun installed
- Google Chrome (or Chromium-based browser)

## Start Chrome with CDP enabled (macOS)

Quit any running Chrome first (Cmd+Q), then run:

```bash
open -na "Google Chrome" --args \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-cdp
```

Verify CDP is reachable:

```bash
curl http://127.0.0.1:9222/json/version
```

## Install

```bash
bun install
```

## Run

```bash
termdev

# or inside this repo:
bun run termdev
```

Common options:

```bash
# auto attach by title/url substring (or numeric index)
termdev --target "example.com"

# change port
termdev --port 9333

# auto refresh targets every N ms (0 disables)
termdev --poll 1000

# include extra websocket frame logs
termdev --network
```

## UI controls

### Focus

- `Tab`: toggle focus between **Targets** (left) and **Right panel** (Logs/Network)

### Targets (left)

- `j/k` or `↑/↓`: move selection
- `Enter`: attach to selected target

### Right panel tabs

- `l`: switch to **Logs**
- `n`: switch to **Network**
- `[` / `]`: switch tab

### Network search

- `/`: search/filter requests by substring (URL/method/status line)
- `Esc` / `Enter`: close search
- `Ctrl+U`: clear query

### Logs / Network navigation

- `j/k` or `↑/↓`: move selection
- `PgUp/PgDn`: page up/down
- `z`: expand/collapse selected node
- `Z`: collapse the current region (closest expanded parent)
- `f`: follow tail
- `c`: clear

### Eval (run JavaScript in the attached page)

- `:`: open input
- `Enter`: run
- `Esc`: cancel

### Quit

- `q` / `Esc` / `Ctrl+C`
