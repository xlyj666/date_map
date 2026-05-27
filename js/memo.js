/**
 * 备忘录管理模块
 * 负责备忘录的 CRUD 操作和数据持久化
 */

const MemoManager = {
    STORAGE_KEY: 'calendar_data',
    
    // 数据缓存
    data: {
        dailyMemos: {},
        weeklyMemos: {},
        // 计划模式数据
        dailyPlans: {},           // 当日计划：{ 'YYYY-MM-DD': { tasks: [], mode: 'plan' } }
        unfinishedTasks: {},      // 日未完成清单：{ 'global': { tasks: [] } } (所有日子共享)
        weeklyPlans: {},          // 周计划：{ 'YYYY-Www': { tasks: [], mode: 'plan' } }
        weeklyUnfinishedTasks: {} // 周未完成清单：{ 'global': { tasks: [] } } (所有周共享)
    },

    /**
     * 初始化备忘录管理器
     */
    async init() {
        DataDebugger.log('MemoManager', '🚀 初始化开始', null, 'init');
        
        // 等待 StorageAdapter 加载完成
        if (window.StorageAdapter && window.StorageAdapter.waitForLoad) {
            DataDebugger.log('MemoManager', '⏳ 等待 StorageAdapter 加载完成...', null, 'init');
            await window.StorageAdapter.waitForLoad();
            DataDebugger.log('MemoManager', '✅ StorageAdapter 加载完成', null, 'init');
        }
        
        await this.load();
    },

    /**
     * 从本地存储加载数据
     */
    async load() {
        DataDebugger.log('MemoManager', '📖 开始加载数据', null, 'load');
        
        const stored = await Utils.loadFromStorage(this.STORAGE_KEY);
        
        if (stored) {
            DataDebugger.logRead('MemoManager', 'Utils', stored, 'load');
            this.data = {
                dailyMemos: stored.dailyMemos || {},
                weeklyMemos: stored.weeklyMemos || {},
                dailyPlans: stored.dailyPlans || {},
                unfinishedTasks: stored.unfinishedTasks || { global: { tasks: [] } },
                weeklyPlans: stored.weeklyPlans || {},
                weeklyUnfinishedTasks: stored.weeklyUnfinishedTasks || { global: { tasks: [] } }
            };
            DataDebugger.log('MemoManager', '✅ 数据加载完成', this.data, 'load');
        } else {
            DataDebugger.log('MemoManager', '⚠️ 无存储数据，使用默认数据', null, 'load');
        }
        
        // 确保未完成清单存在
        if (!this.data.unfinishedTasks.global) {
            this.data.unfinishedTasks.global = { tasks: [] };
        }
        if (!this.data.weeklyUnfinishedTasks.global) {
            this.data.weeklyUnfinishedTasks.global = { tasks: [] };
        }
        
        DataDebugger.validate(this.data, 'MemoManager');
    },

    /**
     * 重新从文件加载数据（用于保存后刷新）
     */
    async reload() {
        DataDebugger.log('MemoManager', '🔄 重新加载数据...', null, 'reload');
        
        // 等待 StorageAdapter 加载完成
        if (window.StorageAdapter && window.StorageAdapter.waitForLoad) {
            await window.StorageAdapter.waitForLoad();
        }
        
        const stored = await Utils.loadFromStorage(this.STORAGE_KEY);
        
        if (stored) {
            DataDebugger.logRead('MemoManager', 'Utils', stored, 'reload');
            this.data = {
                dailyMemos: stored.dailyMemos || {},
                weeklyMemos: stored.weeklyMemos || {},
                dailyPlans: stored.dailyPlans || {},
                unfinishedTasks: stored.unfinishedTasks || { global: { tasks: [] } },
                weeklyPlans: stored.weeklyPlans || {},
                weeklyUnfinishedTasks: stored.weeklyUnfinishedTasks || { global: { tasks: [] } }
            };
            DataDebugger.log('MemoManager', '✅ 重新加载完成', this.data, 'reload');
        } else {
            DataDebugger.log('MemoManager', '⚠️ 重新加载失败，使用当前数据', null, 'reload');
        }
        
        // 确保未完成清单存在
        if (!this.data.unfinishedTasks.global) {
            this.data.unfinishedTasks.global = { tasks: [] };
        }
        if (!this.data.weeklyUnfinishedTasks.global) {
            this.data.weeklyUnfinishedTasks.global = { tasks: [] };
        }
    },

    /**
     * 保存数据到本地存储，保存后重新加载以确保与文件一致
     */
    async save() {
        DataDebugger.logWrite('MemoManager', 'Utils', this.data, 'save');
        
        // 先保存当前数据
        await Utils.saveToStorage(this.STORAGE_KEY, this.data);
        
        // 等待一小段时间让文件写入完成
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 重新从文件加载数据
        DataDebugger.log('MemoManager', '🔄 保存后重新加载数据...', null, 'save');
        await this.reload();
        
        // 触发数据刷新事件，通知 UI 更新
        window.dispatchEvent(new CustomEvent('dataRefreshed'));
        
        DataDebugger.log('MemoManager', '✅ 数据保存并重新加载完成', this.data, 'save');
    },

    /**
     * 获取日备忘录
     * @param {string} dateKey - 日期键（YYYY-MM-DD）
     * @returns {string|null} 备忘录内容
     */
    getDailyMemo(dateKey) {
        return this.data.dailyMemos[dateKey] || null;
    },

    /**
     * 获取周备忘录
     * @param {string} weekKey - 周键（YYYY-Www）
     * @returns {string|null} 备忘录内容
     */
    getWeeklyMemo(weekKey) {
        return this.data.weeklyMemos[weekKey] || null;
    },

    /**
     * 保存日备忘录
     * @param {string} dateKey - 日期键（YYYY-MM-DD）
     * @param {string} content - 备忘录内容
     */
    saveDailyMemo(dateKey, content) {
        if (content && content.trim()) {
            this.data.dailyMemos[dateKey] = content.trim();
        } else {
            delete this.data.dailyMemos[dateKey];
        }
        this.save();
    },

    /**
     * 保存周备忘录
     * @param {string} weekKey - 周键（YYYY-Www）
     * @param {string} content - 备忘录内容
     */
    saveWeeklyMemo(weekKey, content) {
        if (content && content.trim()) {
            this.data.weeklyMemos[weekKey] = content.trim();
        } else {
            delete this.data.weeklyMemos[weekKey];
        }
        this.save();
    },

    /**
     * 删除日备忘录
     * @param {string} dateKey - 日期键（YYYY-MM-DD）
     */
    deleteDailyMemo(dateKey) {
        delete this.data.dailyMemos[dateKey];
        this.save();
    },

    /**
     * 删除周备忘录
     * @param {string} weekKey - 周键（YYYY-Www）
     */
    deleteWeeklyMemo(weekKey) {
        delete this.data.weeklyMemos[weekKey];
        this.save();
    },

    /**
     * 检查是否有日备忘录
     * @param {string} dateKey - 日期键（YYYY-MM-DD）
     * @returns {boolean} 是否存在备忘录
     */
    hasDailyMemo(dateKey) {
        return !!this.data.dailyMemos[dateKey];
    },

    /**
     * 检查是否有周备忘录
     * @param {string} weekKey - 周键（YYYY-Www）
     * @returns {boolean} 是否存在备忘录
     */
    hasWeeklyMemo(weekKey) {
        return !!this.data.weeklyMemos[weekKey];
    },

    /**
     * 获取日备忘录的预览（前 20 个字符）
     * @param {string} dateKey - 日期键（YYYY-MM-DD）
     * @returns {string|null} 预览文本
     */
    getDailyMemoPreview(dateKey) {
        const memo = this.getDailyMemo(dateKey);
        if (!memo) return null;
        
        const preview = memo.substring(0, 20);
        return memo.length > 20 ? preview + '...' : preview;
    },

    /**
     * 清空所有数据
     */
    clearAll() {
        this.data = {
            dailyMemos: {},
            weeklyMemos: {},
            dailyPlans: {},
            unfinishedTasks: { global: { tasks: [] } },
            weeklyPlans: {},
            weeklyUnfinishedTasks: { global: { tasks: [] } }
        };
        this.save();
    },

    // ========== 计划模式相关方法 ==========

    /**
     * 获取日计划模式
     * @param {string} dateKey - 日期键（YYYY-MM-DD）
     * @returns {string} 'plan' 或 'memo'
     */
    getDailyMode(dateKey) {
        return this.data.dailyPlans[dateKey]?.mode || 'memo';
    },

    /**
     * 设置日计划模式
     * @param {string} dateKey - 日期键（YYYY-MM-DD）
     * @param {string} mode - 'plan' 或 'memo'
     */
    setDailyMode(dateKey, mode) {
        if (!this.data.dailyPlans[dateKey]) {
            this.data.dailyPlans[dateKey] = { tasks: [] };
        }
        this.data.dailyPlans[dateKey].mode = mode;
        this.save();
    },

    /**
     * 获取日计划任务列表
     * @param {string} dateKey - 日期键（YYYY-MM-DD）
     * @returns {Array} 任务数组
     */
    getDailyTasks(dateKey) {
        const tasks = this.data.dailyPlans[dateKey]?.tasks || [];
        // 返回深拷贝，避免直接修改缓存
        return JSON.parse(JSON.stringify(tasks));
    },

    /**
     * 添加日计划任务
     * @param {string} dateKey - 日期键（YYYY-MM-DD）
     * @param {string} task - 任务内容
     */
    addDailyTask(dateKey, task) {
        if (!this.data.dailyPlans[dateKey]) {
            this.data.dailyPlans[dateKey] = { tasks: [], mode: 'plan' };
        }
        const newTask = {
            id: Date.now(),
            content: task.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };
        this.data.dailyPlans[dateKey].tasks.push(newTask);
        this.save();
        return newTask;
    },

    /**
     * 切换日计划任务完成状态
     * @param {string} dateKey - 日期键（YYYY-MM-DD）
     * @param {number} taskId - 任务 ID
     * @returns {boolean} 新的完成状态
     */
    toggleDailyTask(dateKey, taskId) {
        const plan = this.data.dailyPlans[dateKey];
        if (!plan) return false;
        
        const task = plan.tasks.find(t => t.id === taskId);
        if (!task) return false;
        
        task.completed = !task.completed;
        
        if (task.completed) {
            task.completedAt = new Date().toISOString();
        } else {
            delete task.completedAt;
        }
        
        this.save();
        return task.completed;
    },

    /**
     * 删除日计划任务
     * @param {string} dateKey - 日期键（YYYY-MM-DD）
     * @param {number} taskId - 任务 ID
     */
    deleteDailyTask(dateKey, taskId) {
        const plan = this.data.dailyPlans[dateKey];
        if (!plan) return;
        
        plan.tasks = plan.tasks.filter(t => t.id !== taskId);
        this.save();
    },

    /**
     * 将日计划任务移到未完成清单
     * @param {string} dateKey - 日期键（YYYY-MM-DD）
     * @param {number} taskId - 任务 ID
     */
    moveDailyTaskToUnfinished(dateKey, taskId) {
        const plan = this.data.dailyPlans[dateKey];
        if (!plan) return;
        
        const taskIndex = plan.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;
        
        const task = plan.tasks[taskIndex];
        task.unfinishedSince = new Date().toISOString();
        
        // 从未完成清单中移除旧任务（如果存在）
        this.data.unfinishedTasks.global.tasks = 
            this.data.unfinishedTasks.global.tasks.filter(t => t.id !== taskId);
        
        // 添加到未完成清单
        this.data.unfinishedTasks.global.tasks.push(task);
        
        // 从日计划中删除
        plan.tasks.splice(taskIndex, 1);
        
        this.save();
    },

    /**
     * 从未完成清单移回日计划
     * @param {string} dateKey - 日期键（YYYY-MM-DD）
     * @param {number} taskId - 任务 ID
     */
    moveUnfinishedToDaily(dateKey, taskId) {
        const unfinishedTaskIndex = this.data.unfinishedTasks.global.tasks.findIndex(t => t.id === taskId);
        if (unfinishedTaskIndex === -1) return;
        
        const task = this.data.unfinishedTasks.global.tasks[unfinishedTaskIndex];
        delete task.unfinishedSince;
        task.completed = false;
        delete task.completedAt;
        
        // 添加到日计划
        if (!this.data.dailyPlans[dateKey]) {
            this.data.dailyPlans[dateKey] = { tasks: [], mode: 'plan' };
        }
        this.data.dailyPlans[dateKey].tasks.push(task);
        
        // 从未完成清单删除
        this.data.unfinishedTasks.global.tasks.splice(unfinishedTaskIndex, 1);
        
        this.save();
    },

    /**
     * 获取未完成清单
     * @returns {Array} 未完成任务数组
     */
    getUnfinishedTasks() {
        return this.data.unfinishedTasks.global?.tasks || [];
    },

    /**
     * 删除未完成任务
     * @param {number} taskId - 任务 ID
     */
    deleteUnfinishedTask(taskId) {
        this.data.unfinishedTasks.global.tasks = 
            this.data.unfinishedTasks.global.tasks.filter(t => t.id !== taskId);
        this.save();
    },

    /**
     * 获取周计划模式
     * @param {string} weekKey - 周键（YYYY-Www）
     * @returns {string} 'plan' 或 'memo'
     */
    getWeeklyMode(weekKey) {
        return this.data.weeklyPlans[weekKey]?.mode || 'memo';
    },

    /**
     * 设置周计划模式
     * @param {string} weekKey - 周键（YYYY-Www）
     * @param {string} mode - 'plan' 或 'memo'
     */
    setWeeklyMode(weekKey, mode) {
        if (!this.data.weeklyPlans[weekKey]) {
            this.data.weeklyPlans[weekKey] = { tasks: [] };
        }
        this.data.weeklyPlans[weekKey].mode = mode;
        this.save();
    },

    /**
     * 获取周计划任务列表
     * @param {string} weekKey - 周键（YYYY-Www）
     * @returns {Array} 任务数组
     */
    getWeeklyTasks(weekKey) {
        const tasks = this.data.weeklyPlans[weekKey]?.tasks || [];
        // 返回深拷贝，避免直接修改缓存
        return JSON.parse(JSON.stringify(tasks));
    },

    /**
     * 添加周计划任务
     * @param {string} weekKey - 周键（YYYY-Www）
     * @param {string} task - 任务内容
     */
    addWeeklyTask(weekKey, task) {
        if (!this.data.weeklyPlans[weekKey]) {
            this.data.weeklyPlans[weekKey] = { tasks: [], mode: 'plan' };
        }
        const newTask = {
            id: Date.now(),
            content: task.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };
        this.data.weeklyPlans[weekKey].tasks.push(newTask);
        this.save();
        return newTask;
    },

    /**
     * 切换周计划任务完成状态
     * @param {string} weekKey - 周键（YYYY-Www）
     * @param {number} taskId - 任务 ID
     * @returns {boolean} 新的完成状态
     */
    toggleWeeklyTask(weekKey, taskId) {
        const plan = this.data.weeklyPlans[weekKey];
        if (!plan) return false;
        
        const task = plan.tasks.find(t => t.id === taskId);
        if (!task) return false;
        
        task.completed = !task.completed;
        
        if (task.completed) {
            task.completedAt = new Date().toISOString();
        } else {
            delete task.completedAt;
        }
        
        this.save();
        return task.completed;
    },

    /**
     * 删除周计划任务
     * @param {string} weekKey - 周键（YYYY-Www）
     * @param {number} taskId - 任务 ID
     */
    deleteWeeklyTask(weekKey, taskId) {
        const plan = this.data.weeklyPlans[weekKey];
        if (!plan) return;
        
        plan.tasks = plan.tasks.filter(t => t.id !== taskId);
        this.save();
    },

    /**
     * 检查日计划是否有任务
     * @param {string} dateKey - 日期键（YYYY-MM-DD）
     * @returns {boolean} 是否有任务
     */
    hasDailyTasks(dateKey) {
        return this.data.dailyPlans[dateKey]?.tasks?.length > 0;
    },

    /**
     * 检查周计划是否有任务
     * @param {string} weekKey - 周键（YYYY-Www）
     * @returns {boolean} 是否有任务
     */
    hasWeeklyTasks(weekKey) {
        return this.data.weeklyPlans[weekKey]?.tasks?.length > 0;
    },

    // ========== 周计划未完成清单相关方法 ==========

    /**
     * 将周计划任务移到未完成清单
     * @param {string} weekKey - 周键（YYYY-Www）
     * @param {number} taskId - 任务 ID
     */
    moveWeeklyTaskToUnfinished(weekKey, taskId) {
        const plan = this.data.weeklyPlans[weekKey];
        if (!plan) return;
        
        const taskIndex = plan.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;
        
        const task = plan.tasks[taskIndex];
        task.unfinishedSince = new Date().toISOString();
        
        // 从未完成清单中移除旧任务（如果存在）
        this.data.weeklyUnfinishedTasks.global.tasks = 
            this.data.weeklyUnfinishedTasks.global.tasks.filter(t => t.id !== taskId);
        
        // 添加到周未完成清单
        this.data.weeklyUnfinishedTasks.global.tasks.push(task);
        
        // 从周计划中删除
        plan.tasks.splice(taskIndex, 1);
        
        this.save();
    },

    /**
     * 从未完成清单移回周计划
     * @param {string} weekKey - 周键（YYYY-Www）
     * @param {number} taskId - 任务 ID
     */
    moveUnfinishedToWeekly(weekKey, taskId) {
        const unfinishedTaskIndex = this.data.weeklyUnfinishedTasks.global.tasks.findIndex(t => t.id === taskId);
        if (unfinishedTaskIndex === -1) return;
        
        const task = this.data.weeklyUnfinishedTasks.global.tasks[unfinishedTaskIndex];
        delete task.unfinishedSince;
        task.completed = false;
        delete task.completedAt;
        
        // 添加到周计划
        if (!this.data.weeklyPlans[weekKey]) {
            this.data.weeklyPlans[weekKey] = { tasks: [], mode: 'plan' };
        }
        this.data.weeklyPlans[weekKey].tasks.push(task);
        
        // 从未完成清单删除
        this.data.weeklyUnfinishedTasks.global.tasks.splice(unfinishedTaskIndex, 1);
        
        this.save();
    },

    /**
     * 获取周未完成清单
     * @returns {Array} 未完成任务数组
     */
    getWeeklyUnfinishedTasks() {
        return this.data.weeklyUnfinishedTasks.global?.tasks || [];
    },

    /**
     * 删除周未完成任务
     * @param {number} taskId - 任务 ID
     */
    deleteWeeklyUnfinishedTask(taskId) {
        this.data.weeklyUnfinishedTasks.global.tasks = 
            this.data.weeklyUnfinishedTasks.global.tasks.filter(t => t.id !== taskId);
        this.save();
    }
};
