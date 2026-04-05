#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = join(__dirname, '..', 'templates')

// Dynamic import for @clack/prompts
async function loadClack() {
  try {
    const prompts = await import('@clack/prompts')
    return prompts
  } catch {
    console.log('Installing @clack/prompts...')
    execSync('pnpm add -D @clack/prompts', { stdio: 'inherit', cwd: __dirname })
    return await import('@clack/prompts')
  }
}

// Check if directory is empty
function isDirectoryEmpty(dir) {
  if (!existsSync(dir)) {
    return true
  }
  const files = execSync(`ls -A "${dir}" 2>/dev/null || echo ""`, { encoding: 'utf-8' }).trim()
  return files === ''
}

// Get git config
function getGitConfig() {
  try {
    const name = execSync('git config user.name', { encoding: 'utf-8' }).trim()
    const email = execSync('git config user.email', { encoding: 'utf-8' }).trim()
    return { name: name || 'Your Name', email: email || 'your@email.com' }
  } catch {
    return { name: 'Your Name', email: 'your@email.com' }
  }
}

// Template replacement
function replaceTemplate(content, vars) {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '')
}

// Create directory structure based on config
function createDirectories(cwd, config) {
  const dirs = []

  // Apps directories
  if (config.apps.includes('desktop')) {
    dirs.push(
      'apps/desktop/src/main/config',
      'apps/desktop/src/main/ipc/services',
      'apps/desktop/src/main/lib/database',
      'apps/desktop/src/main/utils',
      'apps/desktop/src/renderer/src/components',
      'apps/desktop/src/renderer/src/hooks',
      'apps/desktop/src/renderer/src/lib',
      'apps/desktop/src/renderer/src/pages',
      'apps/desktop/src/renderer/src/store',
      'apps/desktop/src/renderer/src/data',
      'apps/desktop/src/renderer/public',
      'apps/desktop/src/preload',
      'apps/desktop/src/shared/types',
      'apps/desktop/src/shared/utils',
      'apps/desktop/resources'
    )
  }

  if (config.apps.includes('web')) {
    dirs.push('apps/web/src/app', 'apps/web/src/components', 'apps/web/src/lib', 'apps/web/public')
  }

  if (config.apps.includes('api')) {
    dirs.push('apps/api/src/lib')
  }

  // Packages directories
  if (config.packages.includes('ui')) {
    dirs.push('packages/ui/src/components', 'packages/ui/src/lib')
  }

  if (config.packages.includes('i18n')) {
    dirs.push('packages/i18n/src/locales')
  }

  if (config.packages.includes('db')) {
    dirs.push('packages/db/src/schema', 'packages/db/src/migrations')
  }

  if (config.packages.includes('core')) {
    dirs.push('packages/core/src/services', 'packages/core/src/types', 'packages/core/src/utils')
  }

  // Common directories
  if (config.codeQuality) {
    dirs.push('.husky')
    dirs.push('.vscode')
  }

  // Create all directories
  for (const dir of dirs) {
    const fullPath = join(cwd, dir)
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true })
    }
  }
}

// Copy template files
function copyTemplates(cwd, config, vars) {
  // Always copy these
  const baseFiles = [
    { src: 'pnpm-workspace.yaml', dest: 'pnpm-workspace.yaml' },
    { src: 'tsconfig.base.json', dest: 'tsconfig.base.json' }
  ]

  if (config.codeQuality) {
    baseFiles.push(
      { src: 'biome.json', dest: 'biome.json' },
      { src: '.husky/pre-commit', dest: '.husky/pre-commit' },
      { src: '.vscode/settings.json', dest: '.vscode/settings.json' },
      { src: '.vscode/extensions.json', dest: '.vscode/extensions.json' },
      { src: 'AGENTS.md', dest: 'AGENTS.md' }
    )
  }

  for (const file of baseFiles) {
    const srcPath = join(TEMPLATES_DIR, file.src)
    const destPath = join(cwd, file.dest)

    if (existsSync(srcPath)) {
      let content = readFileSync(srcPath, 'utf-8')
      content = replaceTemplate(content, vars)
      writeFileSync(destPath, content)
    }
  }
}

// Generate root package.json
function generateRootPackageJson(config, vars) {
  const scripts = {}

  // Desktop scripts
  if (config.apps.includes('desktop')) {
    scripts.dev = 'pnpm --filter ./apps/desktop run dev'
    scripts.build = 'pnpm --filter ./apps/desktop run build'
    scripts.check = 'pnpm --filter ./apps/desktop run check'
    scripts.typecheck = 'pnpm --filter ./apps/desktop run typecheck'
    scripts.fix = 'pnpm --filter ./apps/desktop run fix'
  }

  // Web scripts
  if (config.apps.includes('web')) {
    scripts['dev:web'] = 'pnpm --filter ./apps/web run dev'
    scripts['build:web'] = 'pnpm --filter ./apps/web run build'
  }

  // API scripts
  if (config.apps.includes('api')) {
    scripts['dev:api'] = 'pnpm --filter ./apps/api run dev'
    scripts['start:api'] = 'pnpm --filter ./apps/api run start'
  }

  const devDeps = {
    husky: '^9.1.0',
    typescript: '^5.6.0'
  }

  if (config.codeQuality) {
    devDeps['@biomejs/biome'] = '^1.9.0'
    devDeps.ultracite = '^4.0.0'
  }

  const pkg = {
    name: vars.projectName,
    version: '0.1.0',
    private: true,
    scripts,
    devDependencies: devDeps
  }

  if (config.codeQuality) {
    pkg.scripts.prepare = 'husky'
  }

  return JSON.stringify(pkg, null, 2)
}

// Generate app package.json
function generateAppPackageJson(appName, _config, vars) {
  const pkg = {
    name: `@${vars.projectName}/${appName}`,
    version: '0.1.0',
    private: true
  }

  if (appName === 'desktop') {
    pkg.main = './out/main/index.js'
    pkg.scripts = {
      dev: 'electron-vite dev',
      build: 'electron-vite build',
      preview: 'electron-vite preview',
      check: 'ultracite check',
      typecheck: 'tsc --noEmit',
      fix: 'ultracite fix'
    }
    pkg.dependencies = {
      '@electron-toolkit/preload': '^3.0.2',
      '@electron-toolkit/utils': '^4.0.0'
    }
    pkg.devDependencies = {
      '@electron-toolkit/tsconfig': '^2.0.0',
      '@types/node': '^22.0.0',
      electron: '^38.0.0',
      'electron-builder': '^25.0.0',
      'electron-vite': '^4.0.0',
      vite: '^7.0.0'
    }
  }

  if (appName === 'web') {
    pkg.scripts = {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      check: 'ultracite check',
      typecheck: 'tsc --noEmit',
      fix: 'ultracite fix'
    }
    pkg.dependencies = {
      next: '^15.0.0',
      react: '^19.0.0',
      'react-dom': '^19.0.0'
    }
    pkg.devDependencies = {
      '@types/node': '^22.0.0',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      typescript: '^5.6.0'
    }
  }

  if (appName === 'api') {
    pkg.scripts = {
      dev: 'tsx watch src/server.ts',
      start: 'node dist/server.js',
      build: 'tsc',
      check: 'ultracite check',
      typecheck: 'tsc --noEmit',
      fix: 'ultracite fix'
    }
    pkg.dependencies = {}
    pkg.devDependencies = {
      '@types/node': '^22.0.0',
      typescript: '^5.6.0',
      tsx: '^4.0.0'
    }
  }

  return JSON.stringify(pkg, null, 2)
}

// Generate package package.json
function generatePackagePackageJson(pkgName, _config, vars) {
  const pkg = {
    name: `@${vars.projectName}/${pkgName}`,
    version: '0.1.0',
    private: true,
    exports: {
      '.': './src/index.ts'
    },
    main: './src/index.ts',
    types: './src/index.ts',
    scripts: {
      check: 'ultracite check',
      typecheck: 'tsc --noEmit',
      fix: 'ultracite fix'
    },
    devDependencies: {
      '@types/node': '^22.0.0',
      typescript: '^5.6.0'
    }
  }

  if (pkgName === 'i18n') {
    pkg.dependencies = {
      i18next: '^25.0.0'
    }
  }

  if (pkgName === 'ui') {
    pkg.peerDependencies = {
      react: '^19.0.0'
    }
    pkg.devDependencies = {
      '@types/react': '^19.0.0',
      react: '^19.0.0'
    }
  }

  return JSON.stringify(pkg, null, 2)
}

// Generate tsconfig.json for app/package
function generateTsConfig(basePath = '../../tsconfig.base.json') {
  return JSON.stringify(
    {
      extends: basePath,
      compilerOptions: {
        baseUrl: '.',
        paths: {
          '@/*': ['./src/*']
        }
      },
      include: ['src'],
      exclude: ['node_modules', 'dist', 'out']
    },
    null,
    2
  )
}

// Generate index.ts for packages
function generateIndexFile(pkgName) {
  if (pkgName === 'i18n') {
    return `export { initI18n } from './init'
export { languages, languageList } from './languages'
export type { LanguageCode, LanguageDefinition } from './languages'
`
  }

  if (pkgName === 'ui') {
    return `// Export UI components
`
  }

  if (pkgName === 'db') {
    return `// Export database schema and utilities
`
  }

  if (pkgName === 'core') {
    return `// Export core services and utilities
`
  }

  return '// Package exports\n'
}

// Create app files
function createAppFiles(cwd, appName, config, vars) {
  const appDir = join(cwd, 'apps', appName)

  // package.json
  writeFileSync(join(appDir, 'package.json'), generateAppPackageJson(appName, config, vars))

  // tsconfig.json
  writeFileSync(join(appDir, 'tsconfig.json'), generateTsConfig('../../tsconfig.base.json'))

  // Create basic entry files for desktop
  if (appName === 'desktop') {
    // Main process entry
    mkdirSync(join(appDir, 'src/main'), { recursive: true })
    writeFileSync(
      join(appDir, 'src/main/index.ts'),
      `import { app, BrowserWindow } from 'electron'
import { join } from 'path'

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
    },
  })

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(createWindow)
`
    )

    // Renderer entry
    mkdirSync(join(appDir, 'src/renderer'), { recursive: true })
    writeFileSync(
      join(appDir, 'src/renderer/index.html'),
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${vars.projectName}</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./src/main.tsx"></script>
</body>
</html>
`
    )

    writeFileSync(
      join(appDir, 'src/renderer/src/main.tsx'),
      `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`
    )

    writeFileSync(
      join(appDir, 'src/renderer/src/App.tsx'),
      `export default function App() {
  return (
    <div>
      <h1>${vars.projectName}</h1>
    </div>
  )
}
`
    )

    // Preload
    mkdirSync(join(appDir, 'src/preload'), { recursive: true })
    writeFileSync(
      join(appDir, 'src/preload/index.ts'),
      `import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  // Expose APIs to renderer
})
`
    )

    // electron.vite.config.ts
    writeFileSync(
      join(appDir, 'electron.vite.config.ts'),
      `import { resolve } from 'path'
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
`
    )
  }

  // Create basic files for web
  if (appName === 'web') {
    mkdirSync(join(appDir, 'src/app'), { recursive: true })
    writeFileSync(
      join(appDir, 'src/app/layout.tsx'),
      `export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`
    )
    writeFileSync(
      join(appDir, 'src/app/page.tsx'),
      `export default function Home() {
  return (
    <main>
      <h1>${vars.projectName}</h1>
    </main>
  )
}
`
    )
  }

  // Create basic files for api
  if (appName === 'api') {
    mkdirSync(join(appDir, 'src'), { recursive: true })
    writeFileSync(
      join(appDir, 'src/server.ts'),
      `import { createServer } from 'http'

const PORT = process.env.PORT || 3001

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ message: '${vars.projectName} API' }))
})

server.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`)
})
`
    )
    writeFileSync(
      join(appDir, 'src/index.ts'),
      `// API exports
`
    )
  }
}

// Create package files
function createPackageFiles(cwd, pkgName, config, vars) {
  const pkgDir = join(cwd, 'packages', pkgName)

  // package.json
  writeFileSync(join(pkgDir, 'package.json'), generatePackagePackageJson(pkgName, config, vars))

  // tsconfig.json
  writeFileSync(join(pkgDir, 'tsconfig.json'), generateTsConfig('../../tsconfig.base.json'))

  // src/index.ts
  mkdirSync(join(pkgDir, 'src'), { recursive: true })
  writeFileSync(join(pkgDir, 'src/index.ts'), generateIndexFile(pkgName))

  // i18n specific files
  if (pkgName === 'i18n') {
    mkdirSync(join(pkgDir, 'src/locales'), { recursive: true })
    writeFileSync(
      join(pkgDir, 'src/locales/en.json'),
      JSON.stringify(
        {
          common: {
            welcome: 'Welcome',
            save: 'Save',
            cancel: 'Cancel'
          }
        },
        null,
        2
      )
    )

    writeFileSync(
      join(pkgDir, 'src/languages.ts'),
      `export const languageList = [
  { code: 'en', name: 'English' },
] as const

export type LanguageCode = typeof languageList[number]['code']

export const languages = languageList.reduce((acc, lang) => {
  acc[lang.code] = lang
  return acc
}, {} as Record<string, typeof languageList[number]>)
`
    )

    writeFileSync(
      join(pkgDir, 'src/init.ts'),
      `import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

export async function initI18n() {
  await i18n.use(initReactI18next).init({
    lng: 'en',
    resources: {
      en: {
        translation: (await import('./locales/en.json')).default,
      },
    },
  })
}
`
    )
  }
}

// Initialize git
function initGit(cwd, _vars) {
  execSync('git init', { cwd, stdio: 'inherit' })

  // Create .gitignore
  writeFileSync(
    join(cwd, '.gitignore'),
    `# Dependencies
node_modules/

# Build outputs
dist/
out/
build/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local
`
  )

  execSync('git add .', { cwd, stdio: 'inherit' })
  execSync(`git commit -m "chore: initial commit"`, { cwd, stdio: 'inherit' })
}

// Install dependencies
function installDeps(cwd) {
  execSync('pnpm install', { cwd, stdio: 'inherit' })
}

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2)
  const config = {}

  for (const arg of args) {
    if (arg.startsWith('--name=')) {
      config.name = arg.split('=')[1]
    } else if (arg.startsWith('--apps=')) {
      config.apps = arg.split('=')[1].split(',')
    } else if (arg.startsWith('--packages=')) {
      config.packages = arg.split('=')[1].split(',')
    } else if (arg === '--no-code-quality') {
      config.codeQuality = false
    } else if (arg === '--no-git') {
      config.git = false
    } else if (arg === '--no-install') {
      config.install = false
    } else if (arg === '--yes' || arg === '-y') {
      config.yes = true
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: create.mjs [options]

Options:
  --name=<name>         Project name
  --apps=<apps>         Apps to include (comma-separated: desktop,web,api)
  --packages=<pkgs>     Packages to include (comma-separated: ui,i18n,db,core)
  --no-code-quality     Skip code quality tools
  --no-git              Skip git initialization
  --no-install          Skip dependency installation
  --yes, -y             Use defaults for all prompts
  --help, -h            Show this help
`)
      process.exit(0)
    }
  }

  return config
}

// Main function
async function main() {
  const cliArgs = parseArgs()
  const p = await loadClack()
  const { intro, text, multiselect, confirm, spinner, outro, isCancel } = p

  intro('Create Electron + Web Monorepo')

  const cwd = process.cwd()

  // Check if directory is empty
  if (!isDirectoryEmpty(cwd)) {
    const continueAnyway = await confirm({
      message: 'Current directory is not empty. Continue anyway?',
      initialValue: false
    })
    if (isCancel(continueAnyway) || !continueAnyway) {
      process.exit(1)
    }
  }

  // Collect configuration
  let projectName = cliArgs.name
  if (!projectName) {
    projectName = await text({
      message: 'Project name',
      placeholder: 'my-awesome-app',
      defaultValue: basename(cwd),
      validate: (value) => {
        if (!value) {
          return 'Project name is required'
        }
        if (!/^[a-z0-9-]+$/.test(value)) {
          return 'Use lowercase letters, numbers, and hyphens only'
        }
      }
    })
    if (isCancel(projectName)) {
      process.exit(1)
    }
  }

  let apps = cliArgs.apps
  if (!apps) {
    apps = await multiselect({
      message: 'Select apps to include',
      options: [
        { value: 'desktop', label: 'desktop (Electron)', hint: 'Cross-platform desktop app' },
        { value: 'web', label: 'web (Next.js)', hint: 'Web application' },
        { value: 'api', label: 'api (Backend)', hint: 'Backend API server' }
      ],
      initialValues: ['desktop'],
      required: true
    })
    if (isCancel(apps)) {
      process.exit(1)
    }
  }

  let packages = cliArgs.packages
  if (!packages) {
    packages = await multiselect({
      message: 'Select packages to include',
      options: [
        { value: 'ui', label: 'ui', hint: 'Shared UI components' },
        { value: 'i18n', label: 'i18n', hint: 'Internationalization' },
        { value: 'db', label: 'db', hint: 'Database layer' },
        { value: 'core', label: 'core', hint: 'Core business logic' }
      ],
      initialValues: ['ui', 'i18n']
    })
    if (isCancel(packages)) {
      process.exit(1)
    }
  }

  let codeQuality = cliArgs.codeQuality
  if (codeQuality === undefined) {
    codeQuality = await confirm({
      message: 'Include code quality tools? (Biome, Husky)',
      initialValue: true
    })
    if (isCancel(codeQuality)) {
      process.exit(1)
    }
  }

  let initGitRepo = cliArgs.git
  if (initGitRepo === undefined) {
    initGitRepo = await confirm({
      message: 'Initialize git repository?',
      initialValue: true
    })
    if (isCancel(initGitRepo)) {
      process.exit(1)
    }
  }

  let installDepsNow = cliArgs.install
  if (installDepsNow === undefined) {
    installDepsNow = await confirm({
      message: 'Install dependencies?',
      initialValue: true
    })
    if (isCancel(installDepsNow)) {
      process.exit(1)
    }
  }

  // Template variables
  const gitConfig = getGitConfig()
  const vars = {
    projectName,
    projectDescription: 'A modern monorepo project',
    authorName: gitConfig.name,
    authorEmail: gitConfig.email,
    year: new Date().getFullYear().toString()
  }

  // Create project
  const s = spinner()
  s.start('Creating project...')

  try {
    // Create directories
    createDirectories(cwd, { apps, packages, codeQuality })

    // Copy templates
    copyTemplates(cwd, { apps, packages, codeQuality }, vars)

    // Generate root package.json
    writeFileSync(
      join(cwd, 'package.json'),
      generateRootPackageJson({ apps, packages, codeQuality }, vars)
    )

    // Create app files
    for (const app of apps) {
      createAppFiles(cwd, app, { apps, packages, codeQuality }, vars)
    }

    // Create package files
    for (const pkg of packages) {
      createPackageFiles(cwd, pkg, { apps, packages, codeQuality }, vars)
    }

    s.message('Copying templates...')

    // Initialize git
    if (initGitRepo) {
      s.message('Initializing git...')
      initGit(cwd, vars)
    }

    // Install dependencies
    if (installDepsNow) {
      s.message('Installing dependencies...')
      installDeps(cwd)
    }

    s.stop('Project created!')

    // Show next steps
    console.log('\n  Next steps:\n')
    if (apps.includes('desktop')) {
      console.log('    pnpm dev          # Start desktop app')
    }
    if (apps.includes('web')) {
      console.log('    pnpm dev:web      # Start web app')
    }
    if (apps.includes('api')) {
      console.log('    pnpm dev:api      # Start API server')
    }
    console.log('    pnpm check        # Check code quality')
    console.log('    pnpm fix          # Fix code issues')
    console.log('')

    outro(`${projectName} is ready!`)
  } catch (error) {
    s.stop('Failed to create project')
    console.error(error)
    process.exit(1)
  }
}

main().catch(console.error)
