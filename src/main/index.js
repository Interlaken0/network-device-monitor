import { app, shell, BrowserWindow, session } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ out
// │ │ ├── main/index.js
// │ │ ├── preload/index.js
// │ │ └── renderer/index.html
process.env.APP_ROOT = path.join(__dirname, '../..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
// Fallback to default dev server port if env var not set
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'] || 'http://localhost:5173'
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'out/main')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'out/renderer')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let win // BrowserWindow reference

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.animate.svg'),
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,    // Security: Disable Node.js integration
      contextIsolation: true,    // Security: Enable context isolation
      sandbox: true,             // Security: Enable sandbox
      preload: path.join(__dirname, '../preload/index.cjs'), // Secure preload bridge
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      enableBlinkFeatures: ''
    },
    show: false // Show when ready to prevent flash
  })

  // Security: Prevent new window creation
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Security: Prevent navigation to external URLs
  win.webContents.on('will-navigate', (event, url) => {
    if (url !== win.webContents.getURL()) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })


  // Show window when ready
  win.once('ready-to-show', () => {
    win.show()
    win.focus()
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Security: Configure Content Security Policy headers
function configureCSP() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self';" +
          "script-src 'self' 'unsafe-inline';" +
          "style-src 'self' 'unsafe-inline';" +
          "img-src 'self' data: https:;" +
          "font-src 'self';" +
          "connect-src 'self';" +
          "media-src 'self';" +
          "object-src 'none';" +
          "frame-src 'none';" +
          "base-uri 'self';" +
          "form-action 'self';"
        ]
      }
    })
  })
}

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(async () => {
  // Security: Apply CSP headers to prevent XSS and code injection
  configureCSP()

  // Register IPC handlers (optional - allows MVP to run without database)
  try {
    const { registerDatabaseHandlers } = await import('./ipc-handlers.js')
    await registerDatabaseHandlers()
  } catch (error) {
    console.warn('Database not available, running without persistence:', error.message)
  }

  createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// IPC handlers are now registered in registerDatabaseHandlers()
