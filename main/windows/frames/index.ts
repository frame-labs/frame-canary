// Frames are the windows that run dapps and other functionality
// They are rendered based on the state of `main.frames`

import log from 'electron-log'
import store from '../../store'

import frameInstances, { FrameInstance } from './frameInstances.js'
import viewInstances from './viewInstances'

function getFrames (): Record<string, Frame> {
  return store('main.frames')
}

export default class FrameManager {
  private frameInstances: Record<string, FrameInstance> = {}

  start () {
    store.observer(() => {
      const inFocus = store('main.focusedFrame')

      const frames = getFrames()

      this.manageFrames(frames, inFocus)
      this.manageViews(frames)
      // manageOverlays(frames)
    })
  }

  manageFrames (frames: Record<string, Frame>, inFocus: string) {
    const frameIds = Object.keys(frames)
    const instanceIds = Object.keys(this.frameInstances)
  
    // create an instance for each new frame in the store
    frameIds
      .filter(frameId => !instanceIds.includes(frameId))
      .forEach(frameId => {
        const frameInstance = frameInstances.create(frames[frameId])

        this.frameInstances[frameId] = frameInstance

        frameInstance.on('closed', () => {
          this.removeFrameInstance(frameId)
          store.removeFrame(frameId)
        })
      })

    // destroy each frame instance that is no longer in the store
    instanceIds
      .filter(instanceId => !frameIds.includes(instanceId))
      .forEach(instanceId => {
        const frameInstance = this.removeFrameInstance(instanceId)

        if (frameInstance) {
          frameInstance.destroy()
        }
      })

    if (inFocus) {
      const focusedFrame = this.frameInstances[inFocus] || { isFocused: () => true }

      if (!focusedFrame.isFocused()) {
        focusedFrame.show()
      }
    }
  }

  manageViews (frames: Record<string, Frame>) {
    const frameIds = Object.keys(frames)
  
    frameIds.forEach(frameId => {
      const frameInstance = this.frameInstances[frameId]
      if (!frameInstance) return log.error('Instance not found when managing views')
  
      const frame = frames[frameId]
      const frameInstanceViews = frameInstance.views || {}
      const frameViewIds = Object.keys(frame.views)
      const instanceViewIds = Object.keys(frameInstanceViews)
    
      instanceViewIds
        .filter(instanceViewId => !frameViewIds.includes(instanceViewId))
        .forEach(instanceViewId => viewInstances.destroy(frameInstance, instanceViewId))
  
      // For each view in the store that belongs to this frame
      frameViewIds.forEach(frameViewId => {
        const viewData = frame.views[frameViewId] || {}
        const viewInstance = frameInstanceViews[frameViewId] || {}

        // Create them
        if (!instanceViewIds.includes(frameViewId)) viewInstances.create(frameInstance, viewData)
        
        // Show the correct one
        if (frame.currentView === frameViewId && viewData.ready) {
          frameInstance.addBrowserView(viewInstance)
          viewInstances.position(frameInstance, frameViewId)
        } else {
          frameInstance.removeBrowserView(viewInstance)
        }
      })
    })
  }

  removeFrameInstance (frameId: string) {
    const frameInstance = this.frameInstances[frameId]

    delete this.frameInstances[frameId]

    if (frameInstance) {
      frameInstance.removeAllListeners('closed')
    }

    return frameInstance
  }

  private sendMessageToFrame (frameId: string, channel: string, ...args: any) {
    const frameInstance = this.frameInstances[frameId]

    if (frameInstance && !frameInstance.isDestroyed()) {
      const webContents = frameInstance.webContents
      webContents.send(channel, ...args)
    } else {
      log.error(new Error(`Tried to send a message to frame with id ${frameId} but it does not exist or has been destroyed`))
    }
  }

  broadcast (channel: string, args: any[]) {
    Object.keys(this.frameInstances).forEach(id => this.sendMessageToFrame(id, channel, ...args))
  }
}

// Test actions