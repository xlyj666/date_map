const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// 数据文件路径（存储在用户文档目录）
const userDataPath = app.getPath('userData');
const dataFilePath = path.join(userDataPath, 'calendar_data.json');

let mainWindow;

/**
 * 读取数据文件
 */
function readDataFile() {
    try {
        if (fs.existsSync(dataFilePath)) {
            const data = fs.readFileSync(dataFilePath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('读取数据文件失败:', error);
    }
    
    // 返回默认数据结构
    return {
        dailyMemos: {},
        weeklyMemos: {},
        dailyPlans: {},
        unfinishedTasks: { global: { tasks: [] } },
        weeklyPlans: {},
        weeklyUnfinishedTasks: { global: { tasks: [] } }
    };
}

/**
 * 写入数据文件
 */
function writeDataFile(data) {
    try {
        // 确保目录存在
        if (!fs.existsSync(userDataPath)) {
            fs.mkdirSync(userDataPath, { recursive: true });
        }
        
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error('写入数据文件失败:', error);
        return false;
    }
}

/**
 * 创建主窗口
 */
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        icon: path.join(__dirname, 'build/icon.png'),
        title: '轻量级日历',
        backgroundColor: '#FFFACD'
    });

    mainWindow.loadFile('index.html');

    // 开发模式下打开 DevTools
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Electron 初始化完成后创建窗口
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// 所有窗口关闭时退出应用（Mac 除外）
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// ========== IPC 通信处理 ==========

/**
 * 读取日历数据
 */
ipcMain.handle('calendar-data:read', () => {
    return readDataFile();
});

/**
 * 写入日历数据
 */
ipcMain.handle('calendar-data:write', (event, data) => {
    return writeDataFile(data);
});

/**
 * 获取数据文件路径
 */
ipcMain.handle('calendar-data:getPath', () => {
    return dataFilePath;
});

/**
 * 备份数据到指定位置
 */
ipcMain.handle('calendar-data:backup', (event, backupPath) => {
    try {
        const data = readDataFile();
        fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error('备份数据失败:', error);
        return false;
    }
});

/**
 * 从备份文件恢复数据
 */
ipcMain.handle('calendar-data:restore', (event, backupPath) => {
    try {
        const data = fs.readFileSync(backupPath, 'utf-8');
        const parsed = JSON.parse(data);
        writeDataFile(parsed);
        return true;
    } catch (error) {
        console.error('恢复数据失败:', error);
        return false;
    }
});
