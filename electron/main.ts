import { app, BrowserWindow, 
  // dialog,
   screen } from 'electron'
// import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 🚧PS：build时会检查未使用的导入或函数，需要注释完全才不会报错

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    width: width, // 屏幕宽度
    height: height, // 屏幕高度
    webPreferences: {
      // 使用 path.dirname 获取当前文件的上级目录
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })
  // 一般在win窗口load之前做通信
// ipcMain.on('某个a事件在preload已声明监听', (event, arg) => {})
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // 加载 HTML 文件
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
  // showAlert()
  win.webContents.openDevTools() // 本地调试打开开发工具
}

// 在主进程事件中调用提示弹窗
// function showAlert() {
//     dialog.showMessageBox({
//         type: 'info',
//         title: '提示',
//         message: '这是一个来自主进程的系统原生弹窗。',
//         buttons: ['确定']
//     }).then((result) => {
//         console.log('用户点击了:', result.response);
//     });
// }

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
// 只在WIN环境，当所有窗口关闭后，app退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})
// 只在MACOS环境，app被激活时，如果窗口数量为0时，创建新窗口
app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
// 当app ready时，创建窗口
app.whenReady().then(createWindow)
