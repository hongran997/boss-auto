# BOSS直聘自动投递简历脚本

这是一个用于BOSS直聘网站的自动投递简历脚本，使用 Playwright 实现。

## 功能特点

- 自动点击"立即沟通"按钮
- 自动处理弹窗提示
- 智能处理页面滚动
- 模拟真实用户行为
- 支持连接到已打开的浏览器

## 使用前提

1. 安装 Node.js (推荐 v16 或更高版本)
2. 安装依赖：
   ```bash
   npm install
   ```

## 使用方法

1. 首先打开 Chrome 浏览器，并使用以下命令启动（Windows）：
   ```bash
   "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\temp\chrome-debug-profile"
   ```

2. 在浏览器中登录 BOSS 直聘，并导航到目标职位搜索页面

3. 运行脚本：
   ```bash
   npm start
   ```

## 注意事项

- 请确保在运行脚本前已经登录 BOSS 直聘
- 脚本会自动处理页面滚动和新职位加载
- 如需停止脚本，请按 Ctrl+C
- 建议合理设置使用频率，避免账号风险

## 自定义配置

如果需要调整脚本行为，可以修改以下参数：
- 滚动速度：修改 `smoothScroll` 函数中的参数
- 延迟时间：修改 `randomDelay` 函数中的参数

