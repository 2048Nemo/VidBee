# Electron Development

Guide for developing Electron desktop applications.

## Architecture

Electron apps have three main processes:

1. **Main Process** - Node.js environment, system access
2. **Renderer Process** - Browser environment, UI
3. **Preload Scripts** - Secure bridge between main and renderer

## Main Process

Location: `apps/desktop/src/main/`

### Entry Point

```typescript
// apps/desktop/src/main/index.ts
import { app, BrowserWindow } from 'electron'
import { join } from 'path'

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(createWindow)
```

### IPC Handlers

```typescript
// apps/desktop/src/main/ipc/services/download.ts
import { ipcMain } from 'electron'

export function registerDownloadHandlers() {
  ipcMain.handle('download:start', async (_, url: string) => {
    // Handle download
    return { success: true }
  })
}
```

### Database Operations

```typescript
// apps/desktop/src/main/lib/database/index.ts
import Database from 'better-sqlite3'

const db = new Database('app.db')

export const queries = {
  getUser: (id: string) => db.prepare('SELECT * FROM users WHERE id = ?').get(id),
}
```

## Renderer Process

Location: `apps/desktop/src/renderer/`

### Entry Point

```tsx
// apps/desktop/src/renderer/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### App Component

```tsx
// apps/desktop/src/renderer/src/App.tsx
export default function App() {
  return (
    <div>
      <h1>My App</h1>
    </div>
  )
}
```

### Calling Main Process

```tsx
// apps/desktop/src/renderer/src/lib/electron.ts
export const electronAPI = {
  download: (url: string) => window.electron.download.start(url),
}
```

## Preload Scripts

Location: `apps/desktop/src/preload/`

```typescript
// apps/desktop/src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  download: {
    start: (url: string) => ipcRenderer.invoke('download:start', url),
  },
})
```

### Type Definitions

```typescript
// apps/desktop/src/shared/types/electron.d.ts
declare global {
  interface Window {
    electron: {
      download: {
        start: (url: string) => Promise<{ success: boolean }>
      }
    }
  }
}

export {}
```

## Shared Types

Location: `apps/desktop/src/shared/`

```typescript
// apps/desktop/src/shared/types/download.ts
export interface DownloadOptions {
  url: string
  outputPath?: string
  format?: 'video' | 'audio'
}

export interface DownloadResult {
  success: boolean
  filePath?: string
  error?: string
}
```

## Electron Vite Configuration

```typescript
// apps/desktop/electron.vite.config.ts
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
      },
    },
  },
})
```

## Best Practices

### Security

- Always use `contextIsolation: true`
- Never enable `nodeIntegration` in renderer
- Validate all IPC inputs
- Limit exposed APIs to minimum

### Performance

- Use async methods for IPC
- Batch data transfers
- Lazy load heavy components
- Use Web Workers for CPU-intensive tasks

### Development

- Hot reload with electron-vite
- Use React DevTools
- Log IPC communications in dev mode
