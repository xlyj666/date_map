/**
 * 日志模块
 * 提供分级日志记录功能，支持控制台和文件输出
 */

const Logger = {
    // 日志级别
    LEVELS: {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    },
    
    // 当前日志级别
    currentLevel: 0, // 默认记录所有级别
    
    // 日志存储
    logs: [],
    
    // 最大日志条数（内存中）
    maxLogs: 1000,
    
    /**
     * 初始化日志系统
     */
    init() {
        console.log('[Logger] 日志系统已初始化');
        this.info('Logger', '日志系统初始化完成');
    },
    
    /**
     * 设置日志级别
     * @param {number} level - 日志级别
     */
    setLevel(level) {
        this.currentLevel = level;
        this.info('Logger', `日志级别已设置为：${level}`);
    },
    
    /**
     * 记录日志
     * @param {number} level - 日志级别
     * @param {string} module - 模块名称
     * @param {string} message - 日志消息
     * @param {any} data - 附加数据
     */
    log(level, module, message, data = null) {
        if (level < this.currentLevel) return;
        
        const timestamp = new Date().toISOString();
        const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
        const logEntry = {
            timestamp,
            level: levelNames[level],
            module,
            message,
            data
        };
        
        // 添加到日志数组
        this.logs.push(logEntry);
        
        // 限制日志数量
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        // 输出到控制台
        const color = this.getLevelColor(level);
        const consoleMessage = `[${timestamp}] [${levelNames[level]}] [${module}] ${message}`;
        
        if (color) {
            console.log(`%c${consoleMessage}`, `color: ${color}`);
        } else {
            console.log(consoleMessage);
        }
        
        if (data !== null) {
            console.log('Data:', data);
        }
        
        // 如果是错误级别，同时输出到错误控制台
        if (level === this.LEVELS.ERROR) {
            console.error(consoleMessage);
            if (data) console.error(data);
        }
    },
    
    /**
     * 获取日志级别对应的颜色
     * @param {number} level - 日志级别
     * @returns {string|null} 颜色值
     */
    getLevelColor(level) {
        const colors = {
            [this.LEVELS.DEBUG]: '#6c757d',    // 灰色
            [this.LEVELS.INFO]: '#007bff',     // 蓝色
            [this.LEVELS.WARN]: '#ffc107',     // 黄色
            [this.LEVELS.ERROR]: '#dc3545'     // 红色
        };
        return colors[level] || null;
    },
    
    /**
     * 调试日志
     * @param {string} module - 模块名称
     * @param {string} message - 日志消息
     * @param {any} data - 附加数据
     */
    debug(module, message, data = null) {
        this.log(this.LEVELS.DEBUG, module, message, data);
    },
    
    /**
     * 信息日志
     * @param {string} module - 模块名称
     * @param {string} message - 日志消息
     * @param {any} data - 附加数据
     */
    info(module, message, data = null) {
        this.log(this.LEVELS.INFO, module, message, data);
    },
    
    /**
     * 警告日志
     * @param {string} module - 模块名称
     * @param {string} message - 日志消息
     * @param {any} data - 附加数据
     */
    warn(module, message, data = null) {
        this.log(this.LEVELS.WARN, module, message, data);
    },
    
    /**
     * 错误日志
     * @param {string} module - 模块名称
     * @param {string} message - 日志消息
     * @param {any} data - 附加数据
     */
    error(module, message, data = null) {
        this.log(this.LEVELS.ERROR, module, message, data);
    },
    
    /**
     * 获取最近的日志
     * @param {number} count - 获取的日志条数
     * @returns {Array} 日志数组
     */
    getRecentLogs(count = 100) {
        return this.logs.slice(-count);
    },
    
    /**
     * 清空日志
     */
    clear() {
        this.logs = [];
        this.info('Logger', '日志已清空');
    },
    
    /**
     * 导出日志为 JSON 格式
     * @returns {string} JSON 字符串
     */
    exportLogs() {
        return JSON.stringify(this.logs, null, 2);
    },
    
    /**
     * 保存日志到文件（仅 Electron 环境）
     */
    async saveToFile() {
        if (typeof window !== 'undefined' && window.electronAPI) {
            try {
                const logsPath = await window.electronAPI.getLogsPath();
                const fs = require('fs');
                fs.writeFileSync(logsPath, this.exportLogs(), 'utf-8');
                this.info('Logger', `日志已保存到：${logsPath}`);
                return true;
            } catch (error) {
                this.error('Logger', '保存日志失败', error);
                return false;
            }
        }
        return false;
    }
};

// 自动初始化
Logger.init();
