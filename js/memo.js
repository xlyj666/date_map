/**
 * 备忘录管理模块
 * 负责备忘录的 CRUD 操作和数据持久化
 */

const MemoManager = {
    STORAGE_KEY: 'calendar_data',
    
    // 数据缓存
    data: {
        dailyMemos: {},
        weeklyMemos: {}
    },

    /**
     * 初始化备忘录管理器
     */
    init() {
        this.load();
    },

    /**
     * 从本地存储加载数据
     */
    load() {
        const stored = Utils.loadFromStorage(this.STORAGE_KEY);
        if (stored) {
            this.data = {
                dailyMemos: stored.dailyMemos || {},
                weeklyMemos: stored.weeklyMemos || {}
            };
        }
    },

    /**
     * 保存数据到本地存储
     */
    save() {
        Utils.saveToStorage(this.STORAGE_KEY, this.data);
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
            weeklyMemos: {}
        };
        this.save();
    }
};
