import { BrowserView }  from 'electron'
import { FrameInstance } from './frameInstances'

import store from '../../store'
import webPreferences from './webPreferences'

export default {
  // Create a view instance on a frame
  create: (frameInstance: FrameInstance, view: ViewMetadata) => {
    const viewInstance = new BrowserView({ webPreferences })
  
    frameInstance.addBrowserView(viewInstance)
    viewInstance.setBackgroundColor('#0fff')

    const { width, height } = frameInstance.getBounds()
    viewInstance.setBounds({ x: 73, y: 16, width: width - 73, height: height - 16 })
    viewInstance.setAutoResize({ width: true, height: true })
  
    viewInstance.webContents.loadURL(view.url)
    viewInstance.webContents.setVisualZoomLevelLimits(1, 3)
  
    frameInstance.removeBrowserView(viewInstance)

    viewInstance.webContents.on('did-finish-load', () => {
      store.updateFrameView(frameInstance.frameId, view.id, { ready: true })
      // if (dev) viewInstance.webContents.openDevTools({ mode: 'detach' })
    })
  
    // Keep reference to view on frame instance
    frameInstance.views = { ...(frameInstance.views || {}), [view.id]: viewInstance }
  },
  // Destroy a view instance on a frame
  destroy: (frameInstance: FrameInstance, viewId: string) => {
    const views = frameInstance.views || {}

    frameInstance.removeBrowserView(views[viewId])

    const webcontents = (views[viewId].webContents as any)
    webcontents.destroy()

    delete views[viewId]
  },
  position: (frameInstance: FrameInstance, viewId: string) => {
    const viewInstance = (frameInstance.views || {})[viewId]
    if (viewInstance) {
      const { width, height } = frameInstance.getBounds()
      viewInstance.setBounds({ x: 73, y: 16, width: width - 73, height: height - 16 })
      viewInstance.setAutoResize({ width: true, height: true })
    }
  }
}