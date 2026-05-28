/**
 * 计划模式管理模块
 * 负责计划模式的 UI 渲染和交互
 */

const PlanManager = {
    // 当前选中的日期
    currentDateKey: null,
    currentWeekKey: null,

    /**
     * 初始化计划管理器
     */
    init() {
        this.bindDailyEvents();
        this.bindWeeklyEvents();
    },

    // ========== 日计划相关 ==========

    /**
     * 打开日计划编辑器
     * @param {Date} date - 日期对象
     */
    openDailyPlan(date) {
        this.currentDateKey = Utils.formatDate(date);
        const mode = MemoManager.getDailyMode(this.currentDateKey);
        
        // 设置模态框标题
        const modalTitle = document.getElementById('modalTitle');
        modalTitle.textContent = `${Utils.formatDate(date)} ${Utils.getWeekdayName(date)} - 计划`;
        
        // 设置模式切换器状态
        this.setDailyMode(mode);
        
        // 渲染计划列表
        this.renderDailyPlanList();
        this.renderUnfinishedList();
        
        // 显示模态框
        const memoModal = document.getElementById('memoModal');
        memoModal.classList.add('active');
    },

    /**
     * 设置日计划模式
     * @param {string} mode - 'plan' 或 'memo'
     */
    setDailyMode(mode) {
        const switcher = document.getElementById('dailyModeSwitcher');
        const buttons = switcher.querySelectorAll('.mode-btn');
        
        buttons.forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // 切换容器显示
        const memoContainer = document.getElementById('memoModeContainer');
        const planContainer = document.getElementById('planModeContainer');
        const memoFooter = document.getElementById('memoModalFooter');
        const planFooter = document.getElementById('planModalFooter');
        
        if (mode === 'plan') {
            memoContainer.classList.add('hidden');
            planContainer.classList.remove('hidden');
            memoFooter.classList.add('hidden');
            planFooter.classList.remove('hidden');
        } else {
            memoContainer.classList.remove('hidden');
            planContainer.classList.add('hidden');
            memoFooter.classList.remove('hidden');
            planFooter.classList.add('hidden');
        }
    },

    /**
     * 渲染日计划列表
     */
    renderDailyPlanList() {
        const listContainer = document.getElementById('dailyPlanList');
        const tasks = MemoManager.getDailyTasks(this.currentDateKey);
        
        if (tasks.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <p>还没有计划，添加一个吧！</p>
                </div>
            `;
            return;
        }
        
        listContainer.innerHTML = '';
        tasks.forEach(task => {
            const item = this.createPlanItem(task, 'daily');
            listContainer.appendChild(item);
        });
    },

    /**
     * 编辑任务内容
     * @param {number} taskId - 任务 ID
     * @param {string} type - 类型：'daily' 或 'weekly' 或 'unfinished' 或 'weeklyUnfinished'
     * @param {HTMLElement} contentElement - 内容 DOM 元素
     */
    editTaskContent(taskId, type, contentElement) {
        const currentText = contentElement.textContent;
        
        // 创建输入框
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.className = 'plan-input';
        input.style.padding = '5px 10px';
        input.style.flex = '1';
        
        // 替换内容
        contentElement.replaceWith(input);
        input.focus();
        input.select();
        
        // 保存函数
        const saveEdit = () => {
            const newText = input.value.trim();
            if (newText && newText !== currentText) {
                if (type === 'daily') {
                    const tasks = MemoManager.getDailyTasks(this.currentDateKey);
                    const task = tasks.find(t => t.id === taskId);
                    if (task) {
                        task.content = newText;
                        MemoManager.save();
                    }
                } else if (type === 'weekly') {
                    const tasks = MemoManager.getWeeklyTasks(this.currentWeekKey);
                    const task = tasks.find(t => t.id === taskId);
                    if (task) {
                        task.content = newText;
                        MemoManager.save();
                    }
                } else if (type === 'unfinished') {
                    const tasks = MemoManager.getUnfinishedTasks();
                    const task = tasks.find(t => t.id === taskId);
                    if (task) {
                        task.content = newText;
                        MemoManager.save();
                    }
                } else if (type === 'weeklyUnfinished') {
                    const tasks = MemoManager.getWeeklyUnfinishedTasks(this.currentWeekKey);
                    const task = tasks.find(t => t.id === taskId);
                    if (task) {
                        task.content = newText;
                        MemoManager.save();
                    }
                }
                showToast('任务已更新');
            }
            // 重新渲染
            if (type === 'daily') {
                this.renderDailyPlanList();
            } else if (type === 'weekly') {
                this.renderWeeklyPlanList();
            } else if (type === 'unfinished') {
                this.renderUnfinishedList();
            } else if (type === 'weeklyUnfinished') {
                this.renderWeeklyUnfinishedList();
            }
        };
        
        // 失去焦点或按回车保存
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            }
        });
        
        // 按 ESC 取消
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                input.replaceWith(contentElement);
            }
        });
    },

    /**
     * 创建计划项元素
     * @param {Object} task - 任务对象
     * @param {string} type - 类型：'daily' 或 'weekly' 或 'unfinished'
     * @returns {HTMLElement} 计划项 DOM 元素
     */
    createPlanItem(task, type) {
        const item = document.createElement('div');
        item.className = `plan-item ${task.completed ? 'completed' : ''}`;
        item.dataset.taskId = task.id;
        
        // 完成状态圆圈
        const checkbox = document.createElement('div');
        checkbox.className = `plan-checkbox ${task.completed ? 'checked' : ''}`;
        checkbox.title = task.completed ? '已完成' : '标记为完成';
        checkbox.addEventListener('click', () => {
            this.handleTaskToggle(task.id, type);
        });
        item.appendChild(checkbox);
        
        // 任务内容（支持双击编辑）
        const content = document.createElement('div');
        content.className = 'plan-content';
        content.textContent = task.content;
        content.title = '双击编辑任务内容';
        content.style.cursor = 'text';
        content.addEventListener('dblclick', () => {
            this.editTaskContent(task.id, type, content);
        });
        item.appendChild(content);
        
        // 操作按钮
        const actions = document.createElement('div');
        actions.className = 'plan-actions';
        
        if (type === 'daily' && !task.completed) {
            // 移到未完成清单按钮
            const unfinishedBtn = document.createElement('button');
            unfinishedBtn.className = 'plan-action-btn unfinished';
            unfinishedBtn.textContent = '↓';
            unfinishedBtn.title = '将其标记为未完成任务';
            unfinishedBtn.addEventListener('click', () => {
                this.handleMoveToUnfinished(task.id);
            });
            actions.appendChild(unfinishedBtn);
        } else if (type === 'weekly' && !task.completed) {
            // 移到周未完成清单按钮
            const unfinishedBtn = document.createElement('button');
            unfinishedBtn.className = 'plan-action-btn unfinished';
            unfinishedBtn.textContent = '↓';
            unfinishedBtn.title = '将其标记为未完成任务';
            unfinishedBtn.addEventListener('click', () => {
                this.handleMoveToWeeklyUnfinished(task.id);
            });
            actions.appendChild(unfinishedBtn);
        } else if (type === 'unfinished') {
            // 移回日计划按钮
            const moveToDailyBtn = document.createElement('button');
            moveToDailyBtn.className = 'plan-action-btn';
            moveToDailyBtn.style.background = 'var(--accent-orange)';
            moveToDailyBtn.style.color = 'white';
            moveToDailyBtn.textContent = '↑';
            moveToDailyBtn.title = '将其添加到当前计划中';
            moveToDailyBtn.addEventListener('click', () => {
                this.handleMoveToDaily(task.id);
            });
            actions.appendChild(moveToDailyBtn);
        } else if (type === 'weeklyUnfinished') {
            // 移回周计划按钮
            const moveToWeeklyBtn = document.createElement('button');
            moveToWeeklyBtn.className = 'plan-action-btn';
            moveToWeeklyBtn.style.background = 'var(--accent-orange)';
            moveToWeeklyBtn.style.color = 'white';
            moveToWeeklyBtn.textContent = '↑';
            moveToWeeklyBtn.title = '将其添加到本周计划中';
            moveToWeeklyBtn.addEventListener('click', () => {
                this.handleMoveToWeekly(task.id);
            });
            actions.appendChild(moveToWeeklyBtn);
            
            // 使未完成项目可拖拽
            item.draggable = true;
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    taskId: task.id,
                    type: type
                }));
            });
        }
        
        // 删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'plan-action-btn delete';
        deleteBtn.textContent = '×';
        deleteBtn.title = '删除';
        deleteBtn.addEventListener('click', () => {
            this.handleDeleteTask(task.id, type);
        });
        actions.appendChild(deleteBtn);
        
        item.appendChild(actions);
        
        return item;
    },

    /**
     * 渲染未完成清单
     */
    renderUnfinishedList() {
        const listContainer = document.getElementById('unfinishedList');
        const tasks = MemoManager.getUnfinishedTasks();
        
        if (tasks.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <p class="drag-hint">没有未完成的任务</p>
                </div>
            `;
            return;
        }
        
        listContainer.innerHTML = '';
        tasks.forEach(task => {
            const item = this.createPlanItem(task, 'unfinished');
            listContainer.appendChild(item);
        });
        
        // 绑定拖拽放置事件
        this.bindDropEvents(listContainer);
    },

    /**
     * 绑定拖拽放置事件
     * @param {HTMLElement} container - 容器元素
     */
    bindDropEvents(container) {
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.style.borderColor = 'var(--accent-orange)';
        });
        
        container.addEventListener('dragleave', () => {
            container.style.borderColor = 'var(--cream-yellow)';
        });
        
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.style.borderColor = 'var(--cream-yellow)';
            
            const data = e.dataTransfer.getData('text/plain');
            if (!data) return;
            
            try {
                const { taskId, type } = JSON.parse(data);
                if (type === 'unfinished') {
                    this.handleMoveToDaily(taskId);
                } else if (type === 'weeklyUnfinished') {
                    this.handleMoveToWeekly(taskId);
                }
            } catch (err) {
                console.error('拖拽数据解析失败:', err);
            }
        });
    },

    /**
     * 处理任务完成状态切换
     * @param {number} taskId - 任务 ID
     * @param {string} type - 类型：'daily' 或 'weekly'
     */
    handleTaskToggle(taskId, type) {
        if (type === 'daily') {
            const completed = MemoManager.toggleDailyTask(this.currentDateKey, taskId);
            this.renderDailyPlanList();
            
            if (completed) {
                showToast('任务已完成！🎉');
            }
        } else if (type === 'weekly') {
            const completed = MemoManager.toggleWeeklyTask(this.currentWeekKey, taskId);
            this.renderWeeklyPlanList();
            
            if (completed) {
                showToast('任务已完成！🎉');
            }
        }
    },

    /**
     * 处理移到未完成清单
     * @param {number} taskId - 任务 ID
     */
    handleMoveToUnfinished(taskId) {
        const success = MemoManager.moveDailyTaskToUnfinished(this.currentDateKey, taskId);
        if (success) {
            this.renderDailyPlanList();
            this.renderUnfinishedList();
            showToast('已移到未完成清单');
        } else {
            showToast('移动任务失败');
        }
    },

    /**
     * 处理移回日计划
     * @param {number} taskId - 任务 ID
     */
    handleMoveToDaily(taskId) {
        MemoManager.moveUnfinishedToDaily(this.currentDateKey, taskId);
        this.renderDailyPlanList();
        this.renderUnfinishedList();
        showToast('已移回当日计划');
    },

    /**
     * 处理移到周未完成清单
     * @param {number} taskId - 任务 ID
     */
    handleMoveToWeeklyUnfinished(taskId) {
        MemoManager.moveWeeklyTaskToUnfinished(this.currentWeekKey, taskId);
        this.renderWeeklyPlanList();
        this.renderWeeklyUnfinishedList();
        showToast('已移到未完成清单');
    },

    /**
     * 处理移回周计划
     * @param {number} taskId - 任务 ID
     */
    handleMoveToWeekly(taskId) {
        MemoManager.moveUnfinishedToWeekly(this.currentWeekKey, taskId);
        this.renderWeeklyPlanList();
        this.renderWeeklyUnfinishedList();
        showToast('已移回本周计划');
    },

    /**
     * 处理删除任务
     * @param {number} taskId - 任务 ID
     * @param {string} type - 类型：'daily' 或 'weekly' 或 'unfinished' 或 'weeklyUnfinished'
     */
    handleDeleteTask(taskId, type) {
        if (!confirm('确定要删除这个任务吗？')) return;
        
        if (type === 'daily') {
            MemoManager.deleteDailyTask(this.currentDateKey, taskId);
            // save() 会触发 dataRefreshed 事件，自动刷新 UI
        } else if (type === 'weekly') {
            MemoManager.deleteWeeklyTask(this.currentWeekKey, taskId);
            // save() 会触发 dataRefreshed 事件，自动刷新 UI
        } else if (type === 'unfinished') {
            MemoManager.deleteUnfinishedTask(taskId);
            // save() 会触发 dataRefreshed 事件，自动刷新 UI
        } else if (type === 'weeklyUnfinished') {
            MemoManager.deleteWeeklyUnfinishedTask(taskId);
            // save() 会触发 dataRefreshed 事件，自动刷新 UI
        }
        
        showToast('任务已删除');
        
        // 重新聚焦输入框（如果是日计划）
        if (type === 'unfinished' || type === 'daily') {
            setTimeout(() => {
                const input = document.getElementById('planInput');
                if (input) {
                    input.focus();
                }
            }, 100);
        }
        
        // 重新聚焦输入框（如果是周计划）
        if (type === 'weeklyUnfinished' || type === 'weekly') {
            setTimeout(() => {
                const input = document.getElementById('weeklyPlanInput');
                if (input) {
                    input.focus();
                }
            }, 100);
        }
    },

    /**
     * 添加日计划任务
     */
    addDailyTask() {
        const input = document.getElementById('planInput');
        const content = input.value.trim();
        
        if (!content) {
            showToast('请输入计划内容');
            return;
        }
        
        MemoManager.addDailyTask(this.currentDateKey, content);
        input.value = '';
        this.renderDailyPlanList();
        showToast('计划已添加');
    },

    /**
     * 绑定日计划事件
     */
    bindDailyEvents() {
        // 模式切换器
        const dailySwitcher = document.getElementById('dailyModeSwitcher');
        dailySwitcher.addEventListener('click', (e) => {
            if (e.target.classList.contains('mode-btn')) {
                const mode = e.target.dataset.mode;
                MemoManager.setDailyMode(this.currentDateKey, mode);
                this.setDailyMode(mode);
            }
        });
        
        // 添加计划按钮
        const addBtn = document.getElementById('addPlanBtn');
        addBtn.addEventListener('click', () => this.addDailyTask());
        
        // 回车添加
        const planInput = document.getElementById('planInput');
        planInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addDailyTask();
            }
        });
        
        // 关闭计划模式按钮
        const closeBtn = document.getElementById('closePlanBtn');
        closeBtn.addEventListener('click', () => {
            document.getElementById('memoModal').classList.remove('active');
        });
    },

    // ========== 周计划相关 ==========

    /**
     * 打开周计划编辑器
     * @param {string} weekKey - 周键（YYYY-Www）
     */
    openWeeklyPlan(weekKey) {
        this.currentWeekKey = weekKey;
        const mode = MemoManager.getWeeklyMode(weekKey);
        
        // 设置模式切换器状态
        this.setWeeklyMode(mode);
        
        // 渲染周计划列表
        this.renderWeeklyPlanList();
        this.renderWeeklyUnfinishedList();
        
        // 显示模态框
        const weeklyMemoModal = document.getElementById('weeklyMemoModal');
        weeklyMemoModal.classList.add('active');
    },

    /**
     * 设置周计划模式
     * @param {string} mode - 'plan' 或 'memo'
     */
    setWeeklyMode(mode) {
        const switcher = document.getElementById('weeklyModeSwitcher');
        const buttons = switcher.querySelectorAll('.mode-btn');
        
        buttons.forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // 切换容器显示
        const memoContainer = document.getElementById('weeklyMemoModeContainer');
        const planContainer = document.getElementById('weeklyPlanModeContainer');
        const memoFooter = document.getElementById('weeklyMemoModalFooter');
        const planFooter = document.getElementById('weeklyPlanModalFooter');
        
        if (mode === 'plan') {
            memoContainer.classList.add('hidden');
            planContainer.classList.remove('hidden');
            memoFooter.classList.add('hidden');
            planFooter.classList.remove('hidden');
        } else {
            memoContainer.classList.remove('hidden');
            planContainer.classList.add('hidden');
            memoFooter.classList.remove('hidden');
            planFooter.classList.add('hidden');
        }
    },

    /**
     * 渲染周计划列表
     */
    renderWeeklyPlanList() {
        const listContainer = document.getElementById('weeklyPlanList');
        const tasks = MemoManager.getWeeklyTasks(this.currentWeekKey);
        
        if (tasks.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <p>还没有周计划，添加一个吧！</p>
                </div>
            `;
            return;
        }
        
        listContainer.innerHTML = '';
        tasks.forEach(task => {
            const item = this.createPlanItem(task, 'weekly');
            listContainer.appendChild(item);
        });
    },

    /**
     * 渲染周未完成清单
     */
    renderWeeklyUnfinishedList() {
        const listContainer = document.getElementById('weeklyUnfinishedList');
        if (!listContainer) return;
        
        const tasks = MemoManager.getWeeklyUnfinishedTasks();
        
        if (tasks.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <p class="drag-hint">没有未完成的任务</p>
                </div>
            `;
            return;
        }
        
        listContainer.innerHTML = '';
        tasks.forEach(task => {
            const item = this.createPlanItem(task, 'weeklyUnfinished');
            listContainer.appendChild(item);
        });
        
        // 绑定拖拽放置事件
        this.bindDropEvents(listContainer);
    },

    /**
     * 添加周计划任务
     */
    addWeeklyTask() {
        const input = document.getElementById('weeklyPlanInput');
        const content = input.value.trim();
        
        if (!content) {
            showToast('请输入计划内容');
            return;
        }
        
        MemoManager.addWeeklyTask(this.currentWeekKey, content);
        input.value = '';
        this.renderWeeklyPlanList();
        showToast('计划已添加');
    },

    /**
     * 绑定周计划事件
     */
    bindWeeklyEvents() {
        // 模式切换器
        const weeklySwitcher = document.getElementById('weeklyModeSwitcher');
        weeklySwitcher.addEventListener('click', (e) => {
            if (e.target.classList.contains('mode-btn')) {
                const mode = e.target.dataset.mode;
                MemoManager.setWeeklyMode(this.currentWeekKey, mode);
                this.setWeeklyMode(mode);
            }
        });
        
        // 添加计划按钮
        const addBtn = document.getElementById('addWeeklyPlanBtn');
        addBtn.addEventListener('click', () => this.addWeeklyTask());
        
        // 回车添加
        const weeklyPlanInput = document.getElementById('weeklyPlanInput');
        weeklyPlanInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addWeeklyTask();
            }
        });
        
        // 关闭周计划模式按钮
        const closeBtn = document.getElementById('closeWeeklyPlanBtn');
        closeBtn.addEventListener('click', () => {
            document.getElementById('weeklyMemoModal').classList.remove('active');
        });
    }
};
