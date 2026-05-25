/**
 * 日历引擎模块
 * 负责日历的计算、渲染和周导航
 */

const CalendarEngine = {
    // 当前显示的日期（该周内的任意一天）
    currentDate: new Date(),
    
    // 日历网格元素
    gridElement: null,
    
    // 回调函数
    onDayClick: null,

    /**
     * 初始化日历引擎
     * @param {HTMLElement} gridElement - 日历网格 DOM 元素
     * @param {Function} onDayClick - 日期点击回调函数
     */
    init(gridElement, onDayClick) {
        this.gridElement = gridElement;
        this.onDayClick = onDayClick;
        this.currentDate = new Date();
    },

    /**
     * 获取当前周的所有日期
     * @returns {Date[]} 日期数组
     */
    getCurrentWeekDates() {
        return Utils.getCurrentWeekDates(this.currentDate);
    },

    /**
     * 获取当前周数
     * @returns {number} 周数
     */
    getCurrentWeekNumber() {
        return Utils.getWeekNumber(this.currentDate);
    },

    /**
     * 获取当前周的起始日期
     * @returns {Date} 起始日期
     */
    getWeekStart() {
        return Utils.getWeekStart(this.currentDate);
    },

    /**
     * 获取当前周的结束日期
     * @returns {Date} 结束日期
     */
    getWeekEnd() {
        return Utils.getWeekEnd(this.currentDate);
    },

    /**
     * 导航到上一周
     */
    prevWeek() {
        this.currentDate.setDate(this.currentDate.getDate() - 7);
        this.render();
    },

    /**
     * 导航到下一周
     */
    nextWeek() {
        this.currentDate.setDate(this.currentDate.getDate() + 7);
        this.render();
    },

    /**
     * 回到今天
     */
    goToToday() {
        this.currentDate = new Date();
        this.render();
    },

    /**
     * 跳转到指定日期所在的周
     * @param {Date} date - 目标日期
     */
    goToWeek(date) {
        this.currentDate = new Date(date);
        this.render();
    },

    /**
     * 渲染日历
     */
    render() {
        if (!this.gridElement) {
            console.error('日历网格元素未初始化');
            return;
        }

        // 清除旧的日期格子（保留星期标题）
        const weekdayHeaders = this.gridElement.querySelectorAll('.weekday-header');
        this.gridElement.innerHTML = '';
        weekdayHeaders.forEach(header => {
            this.gridElement.appendChild(header.cloneNode(true));
        });

        // 获取当前周的日期
        const dates = this.getCurrentWeekDates();
        const today = new Date();

        // 创建日期格子
        dates.forEach(date => {
            const dayCell = this.createDayCell(date, today);
            this.gridElement.appendChild(dayCell);
        });

        // 更新周显示
        this.updateWeekDisplay();
    },

    /**
     * 创建日期格子元素
     * @param {Date} date - 日期对象
     * @param {Date} today - 今天的日期
     * @returns {HTMLElement} 日期格子 DOM 元素
     */
    createDayCell(date, today) {
        const cell = document.createElement('div');
        cell.className = 'day-cell';
        cell.dataset.date = Utils.formatDate(date);

        // 判断是否是今天
        if (Utils.isToday(date)) {
            cell.classList.add('today');
        }

        // 判断是否在当前月份
        if (!Utils.isSameMonth(date, this.currentDate)) {
            cell.classList.add('other-month');
        }

        // 创建日期数字
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        cell.appendChild(dayNumber);

        // 创建星期标签
        const dayLabel = document.createElement('div');
        dayLabel.className = 'day-label';
        dayLabel.textContent = Utils.getWeekdayName(date);
        cell.appendChild(dayLabel);

        // 检查是否有备忘录
        const dateKey = Utils.formatDate(date);
        if (MemoManager.hasDailyMemo(dateKey)) {
            const indicator = document.createElement('div');
            indicator.className = 'memo-indicator';
            indicator.textContent = MemoManager.getDailyMemoPreview(dateKey);
            cell.appendChild(indicator);
        } else {
            const noMemo = document.createElement('div');
            noMemo.className = 'no-memo';
            noMemo.textContent = '无备忘录';
            cell.appendChild(noMemo);
        }

        // 绑定点击事件
        cell.addEventListener('click', () => {
            if (this.onDayClick) {
                this.onDayClick(date);
            }
        });

        return cell;
    },

    /**
     * 更新周显示信息
     */
    updateWeekDisplay() {
        const weekLabel = document.getElementById('currentWeekLabel');
        const weekRange = document.getElementById('currentWeekRange');

        if (weekLabel) {
            const weekNum = this.getCurrentWeekNumber();
            weekLabel.textContent = `第${weekNum}周`;
        }

        if (weekRange) {
            const start = this.getWeekStart();
            const end = this.getWeekEnd();
            weekRange.textContent = Utils.formatDateRange(start, end);
        }
    },

    /**
     * 刷新日历显示（用于备忘录更新后）
     */
    refresh() {
        this.render();
    }
};
