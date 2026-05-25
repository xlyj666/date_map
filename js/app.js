/**
 * 应用入口文件
 * 负责初始化各模块和绑定事件
 */

// 当前选中的日期和周
let selectedDate = null;
let currentWeekKey = null;

// 模态框相关元素
const memoModal = document.getElementById('memoModal');
const weeklyMemoModal = document.getElementById('weeklyMemoModal');

/**
 * 初始化应用
 */
function initApp() {
    // 初始化备忘录管理器
    MemoManager.init();

    // 初始化计划管理器
    PlanManager.init();

    // 初始化日历引擎
    const calendarGrid = document.getElementById('calendarGrid');
    CalendarEngine.init(calendarGrid, handleDayClick);

    // 渲染日历
    CalendarEngine.render();

    // 更新周备忘录显示
    updateWeeklyMemoDisplay();

    // 更新时间显示
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 1000);

    // 绑定导航事件
    bindNavigationEvents();

    // 绑定模态框事件
    bindModalEvents();

    // 检查 localStorage 可用性
    if (!Utils.isStorageAvailable()) {
        alert('警告：您的浏览器不支持本地存储，数据可能无法保存！');
    }

    console.log('轻量级日历初始化完成！');
}

/**
 * 处理日期点击事件
 * @param {Date} date - 点击的日期
 */
function handleDayClick(date) {
    selectedDate = date;
    const dateKey = Utils.formatDate(date);
    const mode = MemoManager.getDailyMode(dateKey);
    
    // 根据模式打开不同的编辑器
    if (mode === 'plan') {
        PlanManager.openDailyPlan(date);
    } else {
        // 设置模态框标题
        const modalTitle = document.getElementById('modalTitle');
        modalTitle.textContent = `${Utils.formatDate(date)} ${Utils.getWeekdayName(date)} - 备忘录`;
        
        // 设置输入框内容
        const memoInput = document.getElementById('memoInput');
        const memo = MemoManager.getDailyMemo(dateKey);
        memoInput.value = memo || '';
        
        // 显示模态框
        memoModal.classList.add('active');
        memoInput.focus();
    }
}

/**
 * 更新周备忘录显示
 */
function updateWeeklyMemoDisplay() {
    const weekKey = Utils.formatWeekKey(CalendarEngine.currentDate);
    currentWeekKey = weekKey;
    
    const memoDisplay = document.getElementById('weeklyMemoDisplay');
    const memo = MemoManager.getWeeklyMemo(weekKey);
    
    if (memo) {
        memoDisplay.innerHTML = `<p>${escapeHtml(memo)}</p>`;
    } else {
        memoDisplay.innerHTML = '<p class="placeholder-text">点击"编辑"添加本周备忘录...</p>';
    }
}

/**
 * 更新时间显示
 */
function updateTimeDisplay() {
    const currentTime = document.getElementById('currentTime');
    if (currentTime) {
        currentTime.textContent = Utils.formatTime(new Date());
    }
}

/**
 * 绑定导航事件
 */
function bindNavigationEvents() {
    // 上一周
    const prevWeekBtn = document.getElementById('prevWeek');
    prevWeekBtn.addEventListener('click', () => {
        CalendarEngine.prevWeek();
        updateWeeklyMemoDisplay();
    });

    // 下一周
    const nextWeekBtn = document.getElementById('nextWeek');
    nextWeekBtn.addEventListener('click', () => {
        CalendarEngine.nextWeek();
        updateWeeklyMemoDisplay();
    });

    // 回到今天
    const todayBtn = document.getElementById('todayBtn');
    todayBtn.addEventListener('click', () => {
        CalendarEngine.goToToday();
        updateWeeklyMemoDisplay();
    });

    // 编辑周备忘录
    const editWeeklyBtn = document.getElementById('editWeeklyMemo');
    editWeeklyBtn.addEventListener('click', openWeeklyMemoEditor);
}

/**
 * 打开周备忘录编辑器
 */
function openWeeklyMemoEditor() {
    const weekKey = Utils.formatWeekKey(CalendarEngine.currentDate);
    const mode = MemoManager.getWeeklyMode(weekKey);
    
    // 根据模式打开不同的编辑器
    if (mode === 'plan') {
        PlanManager.openWeeklyPlan(weekKey);
    } else {
        const weeklyMemoInput = document.getElementById('weeklyMemoInput');
        const memo = MemoManager.getWeeklyMemo(weekKey);
        weeklyMemoInput.value = memo || '';
        
        weeklyMemoModal.classList.add('active');
        weeklyMemoInput.focus();
    }
}

/**
 * 绑定模态框事件
 */
function bindModalEvents() {
    // 日备忘录模态框
    const closeModalBtn = document.getElementById('closeModal');
    closeModalBtn.addEventListener('click', closeMemoModal);

    const cancelBtn = document.getElementById('cancelBtn');
    cancelBtn.addEventListener('click', closeMemoModal);

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.addEventListener('click', saveDailyMemo);

    const deleteBtn = document.getElementById('deleteMemo');
    deleteBtn.addEventListener('click', deleteDailyMemo);

    // 周备忘录模态框
    const closeWeeklyModalBtn = document.getElementById('closeWeeklyModal');
    closeWeeklyModalBtn.addEventListener('click', closeWeeklyMemoModal);

    const cancelWeeklyBtn = document.getElementById('cancelWeeklyBtn');
    cancelWeeklyBtn.addEventListener('click', closeWeeklyMemoModal);

    const saveWeeklyBtn = document.getElementById('saveWeeklyBtn');
    saveWeeklyBtn.addEventListener('click', saveWeeklyMemo);

    const deleteWeeklyBtn = document.getElementById('deleteWeeklyMemo');
    deleteWeeklyBtn.addEventListener('click', deleteWeeklyMemo);

    // 点击模态框背景关闭
    memoModal.addEventListener('click', (e) => {
        if (e.target === memoModal) {
            closeMemoModal();
        }
    });

    weeklyMemoModal.addEventListener('click', (e) => {
        if (e.target === weeklyMemoModal) {
            closeWeeklyMemoModal();
        }
    });

    // 键盘事件
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMemoModal();
            closeWeeklyMemoModal();
        }
    });
}

/**
 * 关闭日备忘录模态框
 */
function closeMemoModal() {
    memoModal.classList.remove('active');
    selectedDate = null;
}

/**
 * 关闭周备忘录模态框
 */
function closeWeeklyMemoModal() {
    weeklyMemoModal.classList.remove('active');
}

/**
 * 保存日备忘录
 */
function saveDailyMemo() {
    if (!selectedDate) return;
    
    const memoInput = document.getElementById('memoInput');
    const content = memoInput.value;
    const dateKey = Utils.formatDate(selectedDate);
    
    MemoManager.saveDailyMemo(dateKey, content);
    
    // 刷新日历显示
    CalendarEngine.refresh();
    
    // 关闭模态框
    closeMemoModal();
    
    // 显示保存提示
    showToast('备忘录已保存！');
}

/**
 * 删除日备忘录
 */
function deleteDailyMemo() {
    if (!selectedDate) return;
    
    const dateKey = Utils.formatDate(selectedDate);
    MemoManager.deleteDailyMemo(dateKey);
    
    // 刷新日历显示
    CalendarEngine.refresh();
    
    // 关闭模态框
    closeMemoModal();
    
    // 显示删除提示
    showToast('备忘录已删除！');
}

/**
 * 保存周备忘录
 */
function saveWeeklyMemo() {
    const weeklyMemoInput = document.getElementById('weeklyMemoInput');
    const content = weeklyMemoInput.value;
    const weekKey = currentWeekKey || Utils.formatWeekKey(CalendarEngine.currentDate);
    
    MemoManager.saveWeeklyMemo(weekKey, content);
    
    // 更新显示
    updateWeeklyMemoDisplay();
    
    // 关闭模态框
    closeWeeklyMemoModal();
    
    // 显示保存提示
    showToast('周备忘录已保存！');
}

/**
 * 删除周备忘录
 */
function deleteWeeklyMemo() {
    const weekKey = currentWeekKey || Utils.formatWeekKey(CalendarEngine.currentDate);
    MemoManager.deleteWeeklyMemo(weekKey);
    
    // 更新显示
    updateWeeklyMemoDisplay();
    
    // 关闭模态框
    closeWeeklyMemoModal();
    
    // 显示删除提示
    showToast('周备忘录已删除！');
}

/**
 * HTML 转义函数（防止 XSS）
 * @param {string} text - 原始文本
 * @returns {string} 转义后的文本
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 显示提示消息
 * @param {string} message - 提示消息
 */
function showToast(message) {
    // 创建提示元素
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, var(--accent-orange) 0%, var(--accent-hover) 100%);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(92, 64, 51, 0.2);
        z-index: 2000;
        animation: slideUp 0.3s ease;
    `;
    
    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from {
                transform: translateX(-50%) translateY(20px);
                opacity: 0;
            }
            to {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toast);
    
    // 3 秒后移除
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease reverse';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// DOM 加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);
