const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  generateSingleVideo: () => ipcRenderer.invoke('generate-single-video'),
  generateTwoVideos: () => ipcRenderer.invoke('generate-two-videos'),
  testVoice: () => ipcRenderer.invoke('test-voice'),
  checkYoutube: () => ipcRenderer.invoke('check-youtube'),
  getLogs: () => ipcRenderer.invoke('get-logs'),
  
  // Listen for real-time updates
  onPipelineOutput: (callback) => ipcRenderer.on('pipeline-output', callback),
  onPipelineError: (callback) => ipcRenderer.on('pipeline-error', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
