const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Data file path 1: User data directory (AppData)
const userDataPath = app.getPath('userData');
const userDataFilePath = path.join(userDataPath, 'calendar_data.json');
const logsPath = path.join(userDataPath, 'app.log');

// Data file path 2: EXE directory (project root in development mode)
const exeDir = app.isPackaged 
    ? path.dirname(app.getPath('exe')) 
    : __dirname;
const localDataFilePath = path.join(exeDir, 'calendar_data.json');

// All data file paths
const allDataPaths = [userDataFilePath, localDataFilePath];

let mainWindow;

/**
 * Log helper function
 */
function log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] [Main] ${message}`;
    
    if (level === 'ERROR') {
        console.error(logMessage);
        if (data) console.error(data);
    } else if (level === 'WARN') {
        console.warn(logMessage);
        if (data) console.warn(data);
    } else {
        console.log(logMessage);
        if (data) console.log(data);
    }
    
    // Write to log file
    try {
        const logEntry = `${logMessage}\n`;
        fs.appendFileSync(logsPath, logEntry);
        if (data) {
            fs.appendFileSync(logsPath, JSON.stringify(data, null, 2) + '\n');
        }
    } catch (error) {
        console.error('Failed to write to log file:', error);
    }
}

/**
 * Read data file (iterate through all paths, prefer non-empty data)
 */
function readDataFile() {
    log('INFO', '========== Starting to read data file ==========');
    log('INFO', `Data file paths: [${allDataPaths.join(', ')}]`);
    
    for (const filePath of allDataPaths) {
        log('INFO', `Attempting to read: ${filePath}`);
        try {
            if (fs.existsSync(filePath)) {
                const rawData = fs.readFileSync(filePath, 'utf-8');
                log('INFO', `File exists, read successful`);
                
                // Check if file is empty or empty JSON
                if (!rawData || rawData.trim() === '') {
                    log('WARN', `File exists but content is empty: ${filePath}`);
                    continue;
                }
                
                const data = JSON.parse(rawData);
                
                // Check if data is empty (all fields are empty objects/arrays)
                if (isDataEmpty(data)) {
                    log('WARN', `File exists but data is empty: ${filePath}`);
                    log('WARN', 'Empty data content:', data);
                    continue;
                }
                
                log('INFO', `✓ Read valid data from ${filePath}`);
                log('INFO', 'Current JSON data content:', data);
                return data;
            } else {
                log('INFO', `File does not exist: ${filePath}`);
            }
        } catch (error) {
            log('ERROR', `Failed to read ${filePath}`, error.message);
        }
    }
    
    // No valid data in all paths
    log('WARN', '========================================');
    log('WARN', '⚠️ All data files do not exist or are empty, using default data');
    log('WARN', '========================================');
    
    const defaultData = getDefaultData();
    log('INFO', 'Default data content:', defaultData);
    
    // Write default data to both paths
    for (const filePath of allDataPaths) {
        try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                log('INFO', `Created directory: ${dir}`);
            }
            fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
            log('INFO', `Default data written to: ${filePath}`);
        } catch (error) {
            log('ERROR', `Failed to write default data to ${filePath}`, error.message);
        }
    }
    
    return defaultData;
}

/**
 * Check if data is empty (all fields have no actual data)
 */
function isDataEmpty(data) {
    if (!data) return true;
    
    const hasDailyMemos = data.dailyMemos && Object.keys(data.dailyMemos).length > 0;
    const hasWeeklyMemos = data.weeklyMemos && Object.keys(data.weeklyMemos).length > 0;
    
    const hasDailyPlans = data.dailyPlans && Object.keys(data.dailyPlans).length > 0;
    const hasWeeklyPlans = data.weeklyPlans && Object.keys(data.weeklyPlans).length > 0;
    
    const hasUnfinishedTasks = data.unfinishedTasks?.global?.tasks?.length > 0;
    const hasWeeklyUnfinishedTasks = data.weeklyUnfinishedTasks?.global?.tasks?.length > 0;
    
    return !hasDailyMemos && !hasWeeklyMemos && 
           !hasDailyPlans && !hasWeeklyPlans && 
           !hasUnfinishedTasks && !hasWeeklyUnfinishedTasks;
}

/**
 * Get default data structure
 */
function getDefaultData() {
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
 * Write data file (write to both paths simultaneously, direct write without merging)
 */
function writeDataFile(newData) {
    log('INFO', 'JSON data content to be written:', newData);
    
    let allSuccess = true;
    
    for (const filePath of allDataPaths) {
        try {
            log('INFO', `Writing data file: ${filePath}`);
            
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                log('INFO', `Creating directory: ${dir}`);
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf-8');
            log('INFO', `✓ Write successful: ${filePath}`);
        } catch (error) {
            log('ERROR', `Failed to write ${filePath}`, error.message);
            allSuccess = false;
        }
    }
    
    if (allSuccess) {
        // Read one file to verify
        try {
            const writtenData = JSON.parse(fs.readFileSync(allDataPaths[0], 'utf-8'));
            log('INFO', 'Written JSON data content (verified):', writtenData);
        } catch (error) {
            log('ERROR', 'Failed to verify written data', error.message);
        }
    }
    
    return allSuccess;
}

/**
 * Merge two data objects (take union of all fields)
 * @param {Object} existingData - Existing data
 * @param {Object} newData - New data
 * @returns {Object} Merged data
 */
function mergeData(existingData, newData) {
    const merged = {
        dailyMemos: {},
        weeklyMemos: {},
        dailyPlans: {},
        unfinishedTasks: { global: { tasks: [] } },
        weeklyPlans: {},
        weeklyUnfinishedTasks: { global: { tasks: [] } }
    };
    
    // Merge dailyMemos (take union by date key)
    if (existingData.dailyMemos) {
        Object.assign(merged.dailyMemos, existingData.dailyMemos);
    }
    if (newData.dailyMemos) {
        Object.assign(merged.dailyMemos, newData.dailyMemos);
    }
    
    // Merge weeklyMemos (take union by week key)
    if (existingData.weeklyMemos) {
        Object.assign(merged.weeklyMemos, existingData.weeklyMemos);
    }
    if (newData.weeklyMemos) {
        Object.assign(merged.weeklyMemos, newData.weeklyMemos);
    }
    
    // Merge dailyPlans (take union by date key)
    if (existingData.dailyPlans) {
        Object.assign(merged.dailyPlans, existingData.dailyPlans);
    }
    if (newData.dailyPlans) {
        Object.assign(merged.dailyPlans, newData.dailyPlans);
    }
    
    // Merge weeklyPlans (take union by week key)
    if (existingData.weeklyPlans) {
        Object.assign(merged.weeklyPlans, existingData.weeklyPlans);
    }
    if (newData.weeklyPlans) {
        Object.assign(merged.weeklyPlans, newData.weeklyPlans);
    }
    
    // Merge unfinishedTasks (take union by task id)
    const existingUnfinishedIds = new Set();
    if (existingData.unfinishedTasks?.global?.tasks) {
        merged.unfinishedTasks.global.tasks = [...existingData.unfinishedTasks.global.tasks];
        merged.unfinishedTasks.global.tasks.forEach(task => {
            existingUnfinishedIds.add(task.id);
        });
    }
    if (newData.unfinishedTasks?.global?.tasks) {
        newData.unfinishedTasks.global.tasks.forEach(task => {
            if (!existingUnfinishedIds.has(task.id)) {
                merged.unfinishedTasks.global.tasks.push(task);
            }
        });
    }
    
    // Merge weeklyUnfinishedTasks (take union by task id)
    const existingWeeklyUnfinishedIds = new Set();
    if (existingData.weeklyUnfinishedTasks?.global?.tasks) {
        merged.weeklyUnfinishedTasks.global.tasks = [...existingData.weeklyUnfinishedTasks.global.tasks];
        merged.weeklyUnfinishedTasks.global.tasks.forEach(task => {
            existingWeeklyUnfinishedIds.add(task.id);
        });
    }
    if (newData.weeklyUnfinishedTasks?.global?.tasks) {
        newData.weeklyUnfinishedTasks.global.tasks.forEach(task => {
            if (!existingWeeklyUnfinishedIds.has(task.id)) {
                merged.weeklyUnfinishedTasks.global.tasks.push(task);
            }
        });
    }
    
    return merged;
}

/**
 * Create main window
 */
function createWindow() {
    log('INFO', 'Creating main window');
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
        title: 'Lightweight Calendar',
        backgroundColor: '#FFFACD'
    });

    mainWindow.loadFile('index.html');
    log('INFO', 'Loading index.html');

    // Open DevTools in development mode
    mainWindow.webContents.openDevTools();
    log('INFO', 'DevTools opened');

    mainWindow.on('closed', () => {
        log('INFO', 'Main window closed');
        mainWindow = null;
    });
}

// Create window after Electron is ready
app.whenReady().then(() => {
    log('INFO', 'Electron app is ready');
    createWindow();

    app.on('activate', () => {
        log('INFO', 'App activated');
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit app when all windows are closed (except Mac)
app.on('window-all-closed', () => {
    log('INFO', 'All windows closed, exiting app');
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// ========== IPC Communication Handlers ==========

/**
 * Read calendar data
 */
ipcMain.handle('calendar-data:read', () => {
    return readDataFile();
});

/**
 * Write calendar data
 */
ipcMain.handle('calendar-data:write', (event, data) => {
    return writeDataFile(data);
});

/**
 * Get data file paths
 */
ipcMain.handle('calendar-data:getPath', () => {
    return {
        userData: userDataFilePath,
        local: localDataFilePath
    };
});

/**
 * Backup data to specified location
 */
ipcMain.handle('calendar-data:backup', (event, backupPath) => {
    log('INFO', `Backing up data to: ${backupPath}`);
    try {
        const data = readDataFile();
        log('INFO', 'Data content to backup:', data);
        fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf-8');
        log('INFO', 'Data backup successful');
        
        // Read backup file to verify
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
        log('INFO', 'Data content in backup file:', backupData);
        return true;
    } catch (error) {
        log('ERROR', 'Failed to backup data', error);
        return false;
    }
});

/**
 * Restore data from backup file
 */
ipcMain.handle('calendar-data:restore', (event, backupPath) => {
    log('INFO', `Restoring from backup file: ${backupPath}`);
    try {
        const data = fs.readFileSync(backupPath, 'utf-8');
        const parsed = JSON.parse(data);
        log('INFO', 'Data content read from backup file:', parsed);
        writeDataFile(parsed);
        log('INFO', 'Data restore successful');
        return true;
    } catch (error) {
        log('ERROR', 'Failed to restore data', error);
        return false;
    }
});

/**
 * Get app version
 */
ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
});

/**
 * Get platform info
 */
ipcMain.handle('app:getPlatform', () => {
    return process.platform;
});
