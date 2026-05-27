/**
 * 存储适配器模块
 * 自动检测运行环境（Electron 或浏览器），提供统一的同步存储接口
 */

const StorageAdapter = {
    // 缓存数据
    _cache: null,
    
    // 加载完成标志
    _loaded: false,
    
    // 加载 Promise
    _loadPromise: null,
    
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
            // 开始异步加载
            this._loadPromise = this._loadFromDisk();
        } else {
            this._loaded = true;
        }
    },
    
    /**
     * 从磁盘加载数据
     */
    async _loadFromDisk() {
        DataDebugger.log('StorageAdapter', '🚀 开始从磁盘加载数据', null, '_loadFromDisk');
        
        try {
            const data = await window.electronAPI.readCalendarData();
            DataDebugger.logRead('StorageAdapter', 'Electron IPC', data, '_loadFromDisk.then');
            this._cache = data;
            this._loaded = true;
            DataDebugger.log('StorageAdapter', '✅ 数据加载完成', this._cache, '_loadFromDisk.then');
            DataDebugger.validate(this._cache, 'StorageAdapter');
            return data;
        } catch (error) {
            DataDebugger.logError('StorageAdapter', error, '_loadFromDisk.catch');
            this._cache = this._getDefaultData();
            this._loaded = true;
            return this._cache;
        }
    },
    
    /**
     * 保存数据到磁盘
     */
    _saveToDisk() {
        if (this._cache && window.electronAPI && window.electronAPI.writeCalendarData) {
            DataDebugger.logWrite('StorageAdapter', 'Electron IPC', this._cache, '_saveToDisk');
            
            window.electronAPI.writeCalendarData(this._cache)
                .then(() => {
                    DataDebugger.log('StorageAdapter', '✅ 数据保存成功', null, '_saveToDisk.then');
                })
                .catch(err => {
                    DataDebugger.logError('StorageAdapter', err, '_saveToDisk.catch');
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
     * 获取数据
     */
    get(key) {
        if (this.isElectron()) {
            const cache = this._cache || this._getDefaultData();
            return cache[key];
        } else {
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
     * 设置数据
     */
    set(key, value) {
        if (this.isElectron()) {
            if (!this._cache) {
                this._cache = this._getDefaultData();
            }
            this._cache[key] = value;
            setTimeout(() => this._saveToDisk(), 0);
        } else {
            try {
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
     */
    async getAll() {
        // 等待数据加载完成
        await this.waitForLoad();
        
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
     */
    setAll(data) {
        if (this.isElectron()) {
            this._cache = data || this._getDefaultData();
            this._loaded = true;
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
     * 强制立即保存
     */
    flush() {
        if (this.isElectron() && this._cache) {
            this._saveToDisk();
        }
    },
    
    /**
     * 等待数据加载完成
     */
    async waitForLoad() {
        if (this._loaded) {
            return this._cache || this._getDefaultData();
        }
        
        if (this._loadPromise) {
            return await this._loadPromise;
        }
        
        return this._getDefaultData();
    }
};

// 暴露到全局作用域
if (typeof window !== 'undefined') {
    window.StorageAdapter = StorageAdapter;
}
