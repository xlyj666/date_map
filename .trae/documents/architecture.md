# 轻量级日历程序技术架构

## 1. 系统架构

### 1.1 整体架构
```
┌─────────────────────────────────────┐
│         用户界面层 (UI Layer)        │
│  - HTML 结构                          │
│  - CSS 样式（奶油色系）               │
│  - 交互组件                          │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│       业务逻辑层 (Business Logic)    │
│  - 日历渲染引擎                       │
│  - 备忘录管理器                       │
│  - 时间同步模块                       │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│       数据持久层 (Data Layer)        │
│  - LocalStorage 存储                 │
│  - 数据序列化/反序列化                │
└─────────────────────────────────────┘
```

## 2. 模块设计

### 2.1 核心模块

#### 2.1.1 CalendarEngine（日历引擎）
**职责**: 负责日历的计算和渲染
- 计算当前周的开始和结束日期
- 生成日历网格数据
- 处理周次切换逻辑

**关键方法**:
```javascript
class CalendarEngine {
  getCurrentWeekDates()  // 获取当前周所有日期
  getWeekNumber(date)    // 获取指定日期的周号
  navigateWeek(offset)   // 导航到指定周
  renderCalendar()       // 渲染日历视图
}
```

#### 2.1.2 MemoManager（备忘录管理器）
**职责**: 管理备忘录的 CRUD 操作
- 创建、读取、更新、删除备忘录
- 数据验证和格式化
- 自动保存功能

**关键方法**:
```javascript
class MemoManager {
  saveDailyMemo(date, content)      // 保存日备忘录
  saveWeeklyMemo(week, content)     // 保存周备忘录
  getDailyMemo(date)                // 获取日备忘录
  getWeeklyMemo(week)               // 获取周备忘录
  deleteMemo(type, id)              // 删除备忘录
}
```

#### 2.1.3 TimeSync（时间同步模块）
**职责**: 确保与系统时间同步
- 定期同步系统时间
- 处理时间变化事件
- 更新 UI 显示

**关键方法**:
```javascript
class TimeSync {
  syncWithSystem()     // 同步系统时间
  startAutoSync()      // 启动自动同步
  getCurrentTime()     // 获取当前时间
}
```

### 2.2 UI 组件

#### 2.2.1 CalendarGrid（日历网格）
- 7 列布局（周日到周六）
- 显示日期和星期
- 点击事件处理
- 视觉反馈（hover、选中状态）

#### 2.2.2 WeekNavigator（周导航器）
- 显示当前周范围
- 上一周/下一周按钮
- 返回今天按钮

#### 2.2.3 MemoEditor（备忘录编辑器）
- 模态框设计
- 文本输入区域
- 保存/取消按钮
- 删除功能

## 3. 数据结构

### 3.1 存储结构
```javascript
// LocalStorage 数据结构
{
  "calendar_data": {
    "dailyMemos": {
      "2026-05-25": "今天的备忘录内容",
      "2026-05-26": "明天的备忘录内容"
    },
    "weeklyMemos": {
      "2026-W21": "第 21 周的备忘录"
    }
  }
}
```

### 3.2 日期格式
- **日备忘录**: `YYYY-MM-DD` (ISO 8601)
- **周备忘录**: `YYYY-Www` (ISO 8601 周格式)

## 4. 样式设计

### 4.1 配色方案
```css
:root {
  /* 奶油色系 */
  --cream-yellow-light: #FFF8DC;
  --cream-yellow: #FFE4B5;
  --cream-orange: #FFD7A0;
  --cream-orange-dark: #FFB347;
  
  /* 强调色 */
  --accent-orange: #FF8C42;
  --accent-hover: #FF7020;
  
  /* 文字色 */
  --text-primary: #5C4033;
  --text-secondary: #8B6F47;
  
  /* 背景色 */
  --background: #FFFACD;
  --card-bg: #FFFFFF;
  
  /* 阴影 */
  --shadow-soft: 0 2px 8px rgba(92, 64, 51, 0.1);
  --shadow-hover: 0 4px 16px rgba(92, 64, 51, 0.15);
}
```

### 4.2 响应式断点
```css
/* 移动端 */
@media (max-width: 768px) {
  /* 单列布局 */
}

/* 平板 */
@media (min-width: 769px) and (max-width: 1024px) {
  /* 优化布局 */
}

/* 桌面 */
@media (min-width: 1025px) {
  /* 完整布局 */
}
```

## 5. 文件结构

```
datamap/
├── index.html          # 主页面
├── css/
│   └── style.css      # 样式文件
├── js/
│   ├── app.js         # 应用入口
│   ├── calendar.js    # 日历引擎
│   ├── memo.js        # 备忘录管理
│   └── utils.js       # 工具函数
└── .trae/
    └── documents/
        ├── prd.md
        └── architecture.md
```

## 6. 关键技术实现

### 6.1 周计算
```javascript
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
```

### 6.2 本地存储
```javascript
// 数据持久化
const storage = {
  save: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
  load: (key) => JSON.parse(localStorage.getItem(key)),
  remove: (key) => localStorage.removeItem(key)
};
```

### 6.3 自动保存
```javascript
// 防抖保存
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};
```

## 7. 性能优化

### 7.1 渲染优化
- 使用 DocumentFragment 减少 DOM 操作
- 事件委托处理日历点击
- CSS 动画替代 JavaScript 动画

### 7.2 存储优化
- 数据压缩存储
- 增量更新
- 定期清理过期数据

## 8. 错误处理

### 8.1 异常捕获
```javascript
try {
  // 关键操作
} catch (error) {
  console.error('Error:', error);
  // 降级处理
}
```

### 8.2 数据验证
- 检查 localStorage 可用性
- 验证数据格式
- 处理数据迁移
