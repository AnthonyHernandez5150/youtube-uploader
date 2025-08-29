const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  generateSingleVideo: () => ipcRenderer.invoke('generate-single-video'),
  generateTwoVideos: () => ipcRenderer.invoke('generate-two-videos'),
  testVoice: () => ipcRenderer.invoke('test-voice'),
  checkYoutube: () => ipcRenderer.invoke('check-youtube'),
  getLogs: () => ipcRenderer.invoke('get-logs'),
  
  // File Management APIs
  getStorageStats: () => ipcRenderer.invoke('get-storage-stats'),
  getFileList: (fileType) => ipcRenderer.invoke('get-file-list', fileType),
  organizeFiles: () => ipcRenderer.invoke('organize-files'),
  cleanOldFiles: () => ipcRenderer.invoke('clean-old-files'),
  archiveWeek: () => ipcRenderer.invoke('archive-week'),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  getUsageStats: () => ipcRenderer.invoke('get-usage-stats'),
  
  // Listen for real-time updates
  onPipelineOutput: (callback) => ipcRenderer.on('pipeline-output', callback),
  onPipelineError: (callback) => ipcRenderer.on('pipeline-error', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
