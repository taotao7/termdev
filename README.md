# termdev

A Bun + TypeScript **Chrome DevTools Protocol (CDP)** client with a terminal UI (Ink) for:

- **Logs**: console output + exceptions (supports selecting each line and expanding objects)
- **Network**: request list with expandable request/response details (JSON responses are automatically formatted)
- **Eval**: run JavaScript in the attached page from the terminal

## Prerequisites

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

## Example

https://github.com/user-attachments/assets/6b8df7be-1860-438f-baff-72f5377ee7ba

## Install

```bash
npm install -g @taotao7/termdev

# or develop locally
bun install
# or with npm
npm install
```

## Build

This project uses Bun's bundler to create a single executable file that works with both Node.js and Bun:

```bash
bun run build
```

The build script uses `target: "node"` to ensure compatibility with both runtimes. The bundled file is output to `bin/termdev.js` and can be run directly with either `node` or `bun`.

## Run

```bash
# After installation (uses bundled file)
termdev

# or inside this repo (development mode):
bun run termdev        # Using Bun (runs source directly)
npm run termdev         # Using Node.js with tsx (runs source directly)
npm run termdev:bun     # Explicitly use Bun (runs source directly)

# Run the bundled file directly:
node bin/termdev.js     # Works with Node.js
bun bin/termdev.js      # Also works with Bun
```

**Note**: The bundled `bin/termdev.js` file works with both Node.js and Bun runtime. For development, the source TypeScript files are run directly using `tsx` (Node.js) or `bun` (Bun).

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
- `PgUp/PgDn` or `Ctrl+U/Ctrl+D`: page up/down
- `y`: copy selected line to clipboard
- `z`: expand/collapse selected node (expand Response Body to view formatted JSON)
- `Z`: collapse the current region (closest expanded parent)
- `f`: follow tail (manually enable auto-scroll to latest entries)
- `c`: clear logs (in Logs tab) or clear network requests (in Network tab)

**Note**: New network requests are added to the list without automatically moving the cursor. Press `f` to enable auto-follow if you want to track new requests automatically.

### Eval (run JavaScript in the attached page)

- `:`: open input
- `Enter`: run
- `Esc`: cancel

### Quit

- `q` / `Esc` / `Ctrl+C`
