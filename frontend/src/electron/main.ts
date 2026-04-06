import {app, BrowserWindow} from 'electron'
import path from "node:path"
import { isDev } from './util.js'
import { getPreloadPath } from './pathResolver.js'

const createWindow = () => {
  const mainWin = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation:true,
      nodeIntegration:false,
    }
  })
  
  if (isDev()) {
      mainWin.loadURL('http://localhost:5123')
    } else {
        mainWin.loadFile(path.join(app.getAppPath(), '/dist-react/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})