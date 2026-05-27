const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    // 读取日历数据
    readCalendarData: () => ipcRenderer.invoke('calendar-data:read'),
    
    // 写入日历数据
    writeCalendarData: (data) => ipcRenderer.invoke('calendar-data:write', data),
    
    // 获取数据文件路径
    getDataFilePath: () => ipcRenderer.invoke('calendar-data:getPath'),
    
    // 备份数据
    backupData: (backupPath) => ipcRenderer.invoke('calendar-data:backup', backupPath),
    
    // 恢复数据
    restoreData: (backupPath) => ipcRenderer.invoke('calendar-data:restore', backupPath),
    
    // 应用信息
    getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
    
    // 平台信息
    getPlatform: () => ipcRenderer.invoke('app:getPlatform')
});
