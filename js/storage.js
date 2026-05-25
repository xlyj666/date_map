/**
 * 存储适配器模块
 * 自动检测运行环境（Electron 或浏览器），提供统一的同步存储接口
 * 无需修改现有代码即可在两种环境中运行
 */

const StorageAdapter = {
    // 缓存数据
    _cache: null,
    
    // 存储键名
    _storageKey: 'calendar-app-data',
    
    /**
     * 检测是否在 Electron 环境中
     */
    isElectron() {
        return typeof window !== 'undefined' && 
               window.electronAPI && 
               window.electronAPI.readCalendarData;
    },
    
    /**
     * 初始化存储
     */
    init() {
        if (this.isElectron()) {
            // Electron 环境：从文件加载数据到缓存
            this._loadFromDisk();
        }
    },
    
    /**
     * 从磁盘加载数据（Electron 环境）
     */
    _loadFromDisk() {
        if (window.electronAPI && window.electronAPI.readCalendarData) {
            window.electronAPI.readCalendarData().then(data => {
                this._cache = data;
                console.log('已从文件加载数据:', data);
            }).catch(err => {
                console.error('加载数据失败:', err);
                this._cache = this._getDefaultData();
            });
        }
    },
    
    /**
     * 保存数据到磁盘（Electron 环境）
     */
    _saveToDisk() {
        if (this._cache && window.electronAPI && window.electronAPI.writeCalendarData) {
            window.electronAPI.writeCalendarData(this._cache).catch(err => {
                console.error('保存数据失败:', err);
            });
        }
    },
    
    /**
     * 获取默认数据结构
     */
    _getDefaultData() {
        return {
            dailyMemos: {},
            weeklyMemos: {},
            dailyPlans: {},
            unfinishedTasks: { global: { tasks: [] } },
            weeklyPlans: {},
            weeklyUnfinishedTasks: { global: { tasks: [] } }
        };
    },
    
    /**
     * 获取数据（同步方法）
     * @param {string} key - 数据键名
     * @returns {any} 数据
     */
    get(key) {
        if (this.isElectron()) {
            // Electron 环境：从缓存读取
            if (!this._cache) {
                this._cache = this._getDefaultData();
            }
            return this._cache[key];
        } else {
            // 浏览器环境：从 localStorage 读取
            try {
                const data = localStorage.getItem(this._storageKey);
                if (data) {
                    const parsed = JSON.parse(data);
                    return parsed[key];
                }
            } catch (error) {
                console.error('读取数据失败:', error);
            }
            return null;
        }
    },
    
    /**
     * 设置数据（同步方法）
     * @param {string} key - 数据键名
     * @param {any} value - 数据值
     */
    set(key, value) {
        if (this.isElectron()) {
            // Electron 环境：更新缓存并保存到文件
            if (!this._cache) {
                this._cache = this._getDefaultData();
            }
            this._cache[key] = value;
            // 异步保存到磁盘，不阻塞主线程
            setTimeout(() => this._saveToDisk(), 0);
        } else {
            // 浏览器环境：使用 localStorage
            try {
                const currentData = this.get(key);
                const allData = {
                    dailyMemos: key === 'dailyMemos' ? value : this.get('dailyMemos'),
                    weeklyMemos: key === 'weeklyMemos' ? value : this.get('weeklyMemos'),
                    dailyPlans: key === 'dailyPlans' ? value : this.get('dailyPlans'),
                    unfinishedTasks: key === 'unfinishedTasks' ? value : this.get('unfinishedTasks'),
                    weeklyPlans: key === 'weeklyPlans' ? value : this.get('weeklyPlans'),
                    weeklyUnfinishedTasks: key === 'weeklyUnfinishedTasks' ? value : this.get('weeklyUnfinishedTasks')
                };
                localStorage.setItem(this._storageKey, JSON.stringify(allData));
            } catch (error) {
                console.error('保存数据失败:', error);
            }
        }
    },
    
    /**
     * 获取完整数据对象
     * @returns {Object} 完整数据
     */
    getAll() {
        if (this.isElectron()) {
            return this._cache || this._getDefaultData();
        } else {
            try {
                const data = localStorage.getItem(this._storageKey);
                return data ? JSON.parse(data) : this._getDefaultData();
            } catch (error) {
                console.error('读取数据失败:', error);
                return this._getDefaultData();
            }
        }
    },
    
    /**
     * 设置完整数据对象
     * @param {Object} data - 完整数据
     */
    setAll(data) {
        if (this.isElectron()) {
            this._cache = data || this._getDefaultData();
            setTimeout(() => this._saveToDisk(), 0);
        } else {
            try {
                localStorage.setItem(this._storageKey, JSON.stringify(data));
            } catch (error) {
                console.error('保存数据失败:', error);
            }
        }
    },
    
    /**
     * 强制立即保存到磁盘（用于重要操作后）
     */
    flush() {
        if (this.isElectron() && this._cache) {
            this._saveToDisk();
        }
    }
};

// 自动初始化
StorageAdapter.init();
