/**
 * Mock Electron Module
 * 
 * Provides mock implementations of Electron APIs for testing
 */

export const app = {
  getPath: jest.fn((name) => {
    const paths = {
      userData: '/mock/user/data',
      appData: '/mock/app/data',
      temp: '/mock/temp'
    }
    return paths[name] || `/mock/${name}`
  }),
  
  on: jest.fn(),
  whenReady: jest.fn(() => Promise.resolve()),
  quit: jest.fn()
}

export const ipcMain = {
  handle: jest.fn(),
  on: jest.fn(),
  removeHandler: jest.fn()
}

export const BrowserWindow = jest.fn().mockImplementation(() => ({
  loadURL: jest.fn(),
  loadFile: jest.fn(),
  webContents: {
    send: jest.fn(),
    setWindowOpenHandler: jest.fn(),
    on: jest.fn()
  },
  on: jest.fn(),
  once: jest.fn(),
  show: jest.fn(),
  focus: jest.fn()
}))

export const shell = {
  openExternal: jest.fn()
}

export default {
  app,
  ipcMain,
  BrowserWindow,
  shell
}
