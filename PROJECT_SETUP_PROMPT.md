# Project Setup Prompt

Paste everything below the line into Claude Code (VS Code extension) with an **empty folder** open as the workspace.

---

## Task

Scaffold a new, empty front-end project in the current VS Code workspace folder using the exact stack, versions, configs and scripts below. Do not add anything that is not listed. Do not build any pages, sections or UI — the result is a clean, running, type-checked skeleton and nothing more.

## Stack (exact)

| Layer | Choice | Version |
| --- | --- | --- |
| Runtime | Node.js | 24.x (built on v24.12.0), npm 11.x |
| Bundler / dev server | Vite | `^8.3.0` |
| UI library | React | `^19.2.8` |
| React DOM | react-dom | `^19.2.8` |
| Language | TypeScript | `~6.0.2` |
| Styling | Tailwind CSS v4 (CSS-first, via Vite plugin) | `^4.3.3` |
| Tailwind Vite plugin | `@tailwindcss/vite` | `^4.3.3` |
| React Vite plugin | `@vitejs/plugin-react` | `^6.1.1` |
| Animation | framer-motion | `^13.4.4` |
| Smooth scroll | lenis | `^1.3.26` |
| Icons | lucide-react | `^1.48.0` |
| Linter | oxlint | `^1.81.0` |
| Types | `@types/react` `^19.2.18`, `@types/react-dom` `^19.2.7`, `@types/node` `^24.13.3` | |

Package manager: **npm**. Module format: ESM (`"type": "module"`). Commit `package-lock.json`.

## Hard constraints

- Plain React + Vite SPA. **No** Next.js, Remix, Astro, CRA, or any SSR framework.
- Tailwind v4 is configured **only** through `@import 'tailwindcss'` in CSS and the `@tailwindcss/vite` plugin. **No** `tailwind.config.js`, **no** `postcss.config.js`, **no** autoprefixer.
- Linting is **oxlint only**. **No** ESLint, **no** Prettier config.
- No routing library, state library, UI kit, CSS-in-JS, or CSS modules.
- Do not use `npm create vite` output as-is. Create the files exactly as specified below so the result matches this spec, and delete any template demo assets.

## Steps

1. Confirm `node -v` is 24.x and `npm -v` is 11.x. If not, stop and tell me.
2. Create the files below with exactly this content.
3. Run `npm install`.
4. Run the three verification commands at the end and fix anything that fails.
5. Report the final file tree and the output of each verification command.

## Files

### `package.json`

```json
{
  "name": "app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "dependencies": {
    "framer-motion": "^13.4.4",
    "lenis": "^1.3.26",
    "lucide-react": "^1.48.0",
    "react": "^19.2.8",
    "react-dom": "^19.2.8"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "@types/node": "^24.13.3",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.7",
    "@vitejs/plugin-react": "^6.1.1",
    "oxlint": "^1.81.0",
    "tailwindcss": "^4.3.3",
    "typescript": "~6.0.2",
    "vite": "^8.3.0"
  }
}
```

### `vite.config.ts`

```ts
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

### `tsconfig.json`

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

### `tsconfig.app.json`

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023", "DOM"],
    "module": "esnext",
    "types": ["vite/client"],
    "allowArbitraryExtensions": true,
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

### `tsconfig.node.json`

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023"],
    "types": ["node"],
    "skipLibCheck": true,

    /* Bundler mode */
    "module": "nodenext",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}
```

### `.oxlintrc.json`

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

### `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### `src/main.tsx`

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

### `src/App.tsx`

```tsx
export default function App() {
  return <main />
}
```

### `src/index.css`

```css
@import 'tailwindcss';
```

### `.gitignore`

```gitignore
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
```

### `.vscode/extensions.json`

```json
{
  "recommendations": ["oxc.oxc-vscode", "bradlc.vscode-tailwindcss"]
}
```

### Folders

Create empty `public/` and `src/components/` (add a `.gitkeep` to each). Nothing else.

## Verification (all must pass)

```bash
npm run lint     # no errors
npm run build    # tsc -b && vite build succeeds
npm run dev      # starts on http://localhost:5173 and serves a blank page with no console errors
```

If any version in `package.json` fails to resolve from the registry, do **not** silently substitute another version. Report the failing package and the nearest available version, and wait for my decision.

## Final report format

- File tree (excluding `node_modules` and `dist`)
- Installed versions of: `vite`, `react`, `typescript`, `tailwindcss`, `framer-motion`, `lenis`, `lucide-react`, `oxlint` (from `npm ls --depth=0`)
- Pass/fail for lint, build, dev
