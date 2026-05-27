/**
 * 数据流调试模块
 * 专门追踪 JSON 数据在应用中的流转过程
 */

const DataDebugger = {
    // 调试开关
    enabled: true,
    
    // 数据流记录
    flowLog: [],
    
    /**
     * 记录数据流
     * @param {string} stage - 阶段名称
     * @param {string} action - 操作类型
     * @param {any} data - 数据内容
     * @param {string} location - 代码位置
     */
    log(stage, action, data, location = '') {
        if (!this.enabled) return;
        
        const timestamp = new Date().toISOString();
        const entry = {
            timestamp,
            stage,
            action,
            data: this.cloneData(data),
            location
        };
        
        this.flowLog.push(entry);
        
        // 控制台输出（带颜色）
        const colors = {
            'StorageAdapter': '#9C27B0',  // 紫色
            'Utils': '#2196F3',            // 蓝色
            'MemoManager': '#4CAF50',     // 绿色
            'PlanManager': '#FF9800',     // 橙色
            'Main': '#F44336'             // 红色
        };
        
        const color = colors[stage] || '#000';
        console.log(
            `%c[${timestamp}] [${stage}] ${action} ${location ? `(${location})` : ''}`,
            `color: ${color}; font-weight: bold;`
        );
        
        if (data !== null && data !== undefined) {
            console.log('📦 数据:', data);
        }
        
        // 输出分隔线
        console.log('─'.repeat(80));
    },
    
    /**
     * 克隆数据（避免引用问题）
     */
    cloneData(data) {
        try {
            return JSON.parse(JSON.stringify(data));
        } catch (error) {
            return data;
        }
    },
    
    /**
     * 记录数据读取
     */
    logRead(stage, source, data, location) {
        this.log(stage, `📖 读取数据 [${source}]`, data, location);
    },
    
    /**
     * 记录数据写入
     */
    logWrite(stage, target, data, location) {
        this.log(stage, `💾 写入数据 [${target}]`, data, location);
    },
    
    /**
     * 记录数据转换
     */
    logTransform(stage, from, to, location) {
        this.log(stage, `🔄 数据转换 [${from} → ${to}]`, { from, to }, location);
    },
    
    /**
     * 记录错误
     */
    logError(stage, error, location) {
        const timestamp = new Date().toISOString();
        console.error(
            `%c[${timestamp}] [${stage}] ❌ 错误 (${location})`,
            'color: #F44336; font-weight: bold;'
        );
        console.error('错误详情:', error);
        console.log('─'.repeat(80));
        
        this.flowLog.push({
            timestamp,
            stage,
            action: 'ERROR',
            error: error.message || error,
            location
        });
    },
    
    /**
     * 获取数据流历史
     */
    getHistory() {
        return this.flowLog;
    },
    
    /**
     * 清空历史
     */
    clearHistory() {
        this.flowLog = [];
        console.log('[DataDebugger] 历史记录已清空');
    },
    
    /**
     * 导出调试报告
     */
    exportReport() {
        const report = {
            timestamp: new Date().toISOString(),
            totalOperations: this.flowLog.length,
            flowLog: this.flowLog
        };
        
        console.log('📊 调试报告:');
        console.log(JSON.stringify(report, null, 2));
        
        return report;
    },
    
    /**
     * 对比两个数据对象
     */
    compare(data1, data2, label1 = '数据1', label2 = '数据2') {
        const str1 = JSON.stringify(data1, null, 2);
        const str2 = JSON.stringify(data2, null, 2);
        
        if (str1 === str2) {
            console.log(`✅ ${label1} 和 ${label2} 相同`);
            return true;
        } else {
            console.log(`❌ ${label1} 和 ${label2} 不同`);
            console.log(`${label1}:`, data1);
            console.log(`${label2}:`, data2);
            return false;
        }
    },
    
    /**
     * 检查数据完整性
     */
    validate(data, stage = 'Unknown') {
        const requiredFields = [
            'dailyMemos',
            'weeklyMemos',
            'dailyPlans',
            'unfinishedTasks',
            'weeklyPlans',
            'weeklyUnfinishedTasks'
        ];
        
        const missing = [];
        for (const field of requiredFields) {
            if (!(field in data)) {
                missing.push(field);
            }
        }
        
        if (missing.length > 0) {
            this.logError(stage, `数据缺少字段: ${missing.join(', ')}`, 'validate');
            return false;
        }
        
        console.log(`✅ [${stage}] 数据结构完整`);
        return true;
    }
};

// 自动启用
console.log('%c🔍 数据调试器已启动', 'color: #9C27B0; font-weight: bold; font-size: 14px;');
