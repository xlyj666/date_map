const fs = require('fs');
const path = require('path');

// 数据文件路径
const userDataPath = require('electron').app.getPath('userData');
const userDataFilePath = path.join(userDataPath, 'calendar_data.json');
const exeDir = __dirname;
const localDataFilePath = path.join(exeDir, 'calendar_data.json');

const allDataPaths = [userDataFilePath, localDataFilePath];

console.log('========================================');
console.log('🔧 开始清理 "null" 键的错误数据');
console.log('========================================');

for (const filePath of allDataPaths) {
    console.log(`\n检查文件：${filePath}`);
    
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`  ⚠️  文件不存在，跳过`);
            continue;
        }
        
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(rawData);
        
        let hasChanges = false;
        
        // 清理 dailyPlans 中的 "null" 键
        if (data.dailyPlans && data.dailyPlans['null']) {
            console.log(`  ❌ 发现错误：dailyPlans 中存在 "null" 键`);
            console.log(`  📊 错误数据:`, data.dailyPlans['null']);
            
            // 尝试将 "null" 键的数据合并到正确的日期键下（如果有 selectedDate 信息）
            // 由于无法确定正确的日期，这里直接删除
            delete data.dailyPlans['null'];
            hasChanges = true;
            console.log(`  ✅ 已删除 "null" 键`);
        }
        
        // 清理 dailyMemos 中的 "null" 键
        if (data.dailyMemos && data.dailyMemos['null']) {
            console.log(`  ❌ 发现错误：dailyMemos 中存在 "null" 键`);
            delete data.dailyMemos['null'];
            hasChanges = true;
            console.log(`  ✅ 已删除 "null" 键`);
        }
        
        // 清理 weeklyPlans 中的 "null" 键
        if (data.weeklyPlans && data.weeklyPlans['null']) {
            console.log(`  ❌ 发现错误：weeklyPlans 中存在 "null" 键`);
            delete data.weeklyPlans['null'];
            hasChanges = true;
            console.log(`  ✅ 已删除 "null" 键`);
        }
        
        // 清理 weeklyMemos 中的 "null" 键
        if (data.weeklyMemos && data.weeklyMemos['null']) {
            console.log(`  ❌ 发现错误：weeklyMemos 中存在 "null" 键`);
            delete data.weeklyMemos['null'];
            hasChanges = true;
            console.log(`  ✅ 已删除 "null" 键`);
        }
        
        if (hasChanges) {
            // 保存修复后的数据
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
            console.log(`  💾 已保存修复后的数据`);
        } else {
            console.log(`  ✅ 数据正常，无需修复`);
        }
        
    } catch (error) {
        console.error(`  ❌ 处理文件时出错:`, error.message);
    }
}

console.log('\n========================================');
console.log('✅ 清理完成！');
console.log('========================================');
console.log('\n📝 提示：请重启应用以加载修复后的数据');
