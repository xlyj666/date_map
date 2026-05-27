/**
 * 工具函数模块
 * 提供日期处理、存储工具等通用功能
 */

const Utils = {
    /**
     * 格式化日期为 YYYY-MM-DD 格式
     * @param {Date} date - 日期对象
     * @returns {string} 格式化后的日期字符串
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * 获取周数（ISO 8601 标准）
     * @param {Date} date - 日期对象
     * @returns {number} 周数
     */
    getWeekNumber(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    },

    /**
     * 格式化周标识（YYYY-Www）
     * @param {Date} date - 日期对象
     * @returns {string} 周标识字符串
     */
    formatWeekKey(date) {
        const year = date.getFullYear();
        const week = String(this.getWeekNumber(date)).padStart(2, '0');
        return `${year}-W${week}`;
    },

    /**
     * 获取某周的起始日期（周日）
     * @param {Date} date - 该周内的任意日期
     * @returns {Date} 该周的起始日期
     */
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        d.setDate(d.getDate() - day);
        d.setHours(0, 0, 0, 0);
        return d;
    },

    /**
     * 获取某周的结束日期（周六）
     * @param {Date} date - 该周内的任意日期
     * @returns {Date} 该周的结束日期
     */
    getWeekEnd(date) {
        const start = this.getWeekStart(date);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return end;
    },

    /**
     * 获取某周的所有日期
     * @param {Date} date - 该周内的任意日期
     * @returns {Date[]} 包含 7 个日期的数组
     */
    getCurrentWeekDates(date) {
        const dates = [];
        const start = this.getWeekStart(date);
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            dates.push(d);
        }
        return dates;
    },

    /**
     * 格式化日期范围显示
     * @param {Date} startDate - 开始日期
     * @param {Date} endDate - 结束日期
     * @returns {string} 格式化后的日期范围字符串
     */
    formatDateRange(startDate, endDate) {
        const start = this.formatDate(startDate);
        const end = this.formatDate(endDate);
        return `${start} ~ ${end}`;
    },

    /**
     * 判断两个日期是否在同一年
     * @param {Date} date1 - 日期 1
     * @param {Date} date2 - 日期 2
     * @returns {boolean} 是否在同一年
     */
    isSameYear(date1, date2) {
        return date1.getFullYear() === date2.getFullYear();
    },

    /**
     * 判断两个日期是否在同一个月
     * @param {Date} date1 - 日期 1
     * @param {Date} date2 - 日期 2
     * @returns {boolean} 是否在同一个月
     */
    isSameMonth(date1, date2) {
        return this.isSameYear(date1, date2) && 
               date1.getMonth() === date2.getMonth();
    },

    /**
     * 判断是否是今天
     * @param {Date} date - 日期对象
     * @returns {boolean} 是否是今天
     */
    isToday(date) {
        const today = new Date();
        return this.isSameMonth(date, today) && 
               date.getDate() === today.getDate();
    },

    /**
     * 获取星期名称
     * @param {Date} date - 日期对象
     * @returns {string} 星期名称
     */
    getWeekdayName(date) {
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return weekdays[date.getDay()];
    },

    /**
     * 获取月份名称
     * @param {Date} date - 日期对象
     * @returns {string} 月份名称
     */
    getMonthName(date) {
        return `${date.getFullYear()}年${date.getMonth() + 1}月`;
    },

    /**
     * 格式化时间（HH:MM:SS）
     * @param {Date} date - 日期对象
     * @returns {string} 格式化后的时间字符串
     */
    formatTime(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    },

    /**
     * 防抖函数
     * @param {Function} func - 需要防抖的函数
     * @param {number} wait - 等待时间（毫秒）
     * @returns {Function} 防抖后的函数
     */
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },

    /**
     * 存储工具 - 保存数据
     * @param {string} key - 存储键名
     * @param {any} data - 存储数据
     */
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            return false;
        }
    },

    /**
     * 存储工具 - 读取数据
     * @param {string} key - 存储键名
     * @returns {any|null} 读取的数据，失败返回 null
     */
    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('读取数据失败:', error);
            return null;
        }
    },

    /**
     * 存储工具 - 删除数据
     * @param {string} key - 存储键名
     */
    removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('删除数据失败:', error);
            return false;
        }
    },

    /**
     * 检查 localStorage 是否可用
     * @returns {boolean} 是否可用
     */
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    },

    /**
     * 检测是否在 Electron 环境中
     * @returns {boolean} 是否在 Electron 中
     */
    isElectron() {
        return typeof window !== 'undefined' && window.electronAPI;
    },

    /**
     * 保存到存储（自动选择 localStorage 或文件存储）
     * 同步方法 - 在 Electron 中使用缓存，异步写入文件
     * @param {string} key - 存储键名
     * @param {any} data - 存储数据
     */
    saveToStorage(key, data) {
        DataDebugger.logWrite('Utils', key, data, 'saveToStorage');
        
        if (this.isElectron()) {
            // Electron 环境：使用 storage.js 的同步接口
            if (window.StorageAdapter) {
                DataDebugger.logTransform('Utils', 'data', 'StorageAdapter.setAll', 'saveToStorage');
                window.StorageAdapter.setAll(data);
                return true;
            }
            // 如果没有 StorageAdapter，使用异步方式（兼容旧代码）
            if (window.electronAPI) {
                DataDebugger.logWrite('Utils', 'Electron IPC (fallback)', data, 'saveToStorage');
                window.electronAPI.writeCalendarData(data).catch(err => {
                    DataDebugger.logError('Utils', err, 'saveToStorage.catch');
                });
                return true;
            }
        } else {
            // 浏览器环境：使用 localStorage
            try {
                localStorage.setItem(key, JSON.stringify(data));
                DataDebugger.logWrite('Utils', 'localStorage', data, 'saveToStorage');
                return true;
            } catch (error) {
                DataDebugger.logError('Utils', error, 'saveToStorage');
                return false;
            }
        }
    },

    /**
     * 从存储加载（自动选择 localStorage 或文件存储）
     * 异步方法 - 在 Electron 中等待缓存加载后读取
     * @param {string} key - 存储键名
     * @returns {Promise<any|null>} 读取的数据，失败返回 null
     */
    async loadFromStorage(key) {
        DataDebugger.logRead('Utils', key, null, 'loadFromStorage');
        
        if (this.isElectron()) {
            // Electron 环境：使用 storage.js 的异步接口
            if (window.StorageAdapter) {
                const data = await window.StorageAdapter.getAll();
                DataDebugger.logRead('Utils', 'StorageAdapter', data, 'loadFromStorage');
                return data;
            }
            // 如果没有 StorageAdapter，返回 null（兼容旧代码）
            DataDebugger.logError('Utils', 'StorageAdapter 不可用', 'loadFromStorage');
            return null;
        } else {
            // 浏览器环境：使用 localStorage
            try {
                const data = localStorage.getItem(key);
                const parsed = data ? JSON.parse(data) : null;
                DataDebugger.logRead('Utils', 'localStorage', parsed, 'loadFromStorage');
                return parsed;
            } catch (error) {
                DataDebugger.logError('Utils', error, 'loadFromStorage');
                return null;
            }
        }
    },

    /**
     * 获取数据文件路径（仅 Electron 环境）
     * @returns {Promise<string>} 文件路径
     */
    async getDataFilePath() {
        if (this.isElectron() && window.electronAPI) {
            return await window.electronAPI.getDataFilePath();
        }
        return null;
    }
};
