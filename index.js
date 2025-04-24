import { chromium } from 'playwright';
import dotenv from 'dotenv';
import { setTimeout } from 'timers/promises';

// 加载环境变量
dotenv.config();

// 随机延迟函数，模拟人类操作
const randomDelay = async (min = 1000, max = 3000) => {
  // [1s, 3s]
  const delay = Math.floor(Math.random() * (max - min) + min);
  await setTimeout(delay);
};

// 滚动函数
async function smoothScroll(page, distance) {
  await page.evaluate(async (scrollDistance) => {
    await new Promise((resolve) => {
      let scrolled = 0;
      const timer = setInterval(() => {
        window.scrollBy(0, 10);
        scrolled += 10;
        if (scrolled >= scrollDistance) {
          clearInterval(timer);
          resolve();
        }
      }, 20);
    });
  }, distance);
}

// 连接到浏览器函数，如果连接失败，则重试
async function connectToBrowser(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      // 获取可用的调试目标
      const response = await fetch('http://localhost:9222/json');
      const targets = await response.json();
      // 查找 BOSS 直聘的标签页
      const bossTarget = targets.find(target =>
        target.url.includes('zhipin.com')
      );
      if (!bossTarget) {
        console.log('未找到 BOSS 直聘标签页，可用的标签页:');
        targets.forEach(target => {
          console.log(`- ${target.url}`);
        });
        throw new Error('请先打开 BOSS 直聘网站 (https://www.zhipin.com/web/geek/jobs)');
      }
      const browser = await chromium.connectOverCDP('http://localhost:9222');
      console.log('成功连接到浏览器！');
      return browser;
    } catch (error) {
      console.error(`连接失败 (尝试 ${i + 1}/${retries}):`, error.message);
      if (i < retries - 1) {
        console.log('等待 5 秒后重试...');
        await setTimeout(5000);
      } else {
        throw new Error(`
无法连接到 Chrome 浏览器。请确保：
1. Chrome 已经使用以下命令启动：
   Windows PowerShell:
   & "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\temp\chrome-debug-profile"
   
2. Chrome 正在运行并且端口 9222 没有被其他程序占用
3. 已经打开了 BOSS 直聘网站 (https://www.zhipin.com/web/geek/jobs)
4. 确保已经登录了 BOSS 直聘账号
                `);
      }
    }
  }
}

// 获取活动页面函数
async function getActivePage(browser) {
    // 获取所有上下文
    const contexts = browser.contexts();
    // 获取默认上下文
    const context = contexts[0];
    // 获取所有页面
    const pages = await context.pages();
    // 找到 BOSS 直聘的页面
    for (const page of pages) {
      const url = page.url();
      if (url.includes('zhipin.com')) {
        return page;
      }
    }
    return null;
}

// 等待页面加载完成
async function waitForPageLoad(page) {
  try {
    // 等待页面加载完成
    await page.waitForLoadState('networkidle', { timeout: 3000 });
    // 尝试等待选择器
    return await page.waitForSelector('.rec-job-list', { timeout: 3000 });
  } catch (error) {
    console.error('页面加载出错:', error.message);
    return null;
  }
}

async function main() {
  try {
    // 连接到已经打开的浏览器
    const browser = await connectToBrowser();
    // 获取当前活动页面
    const page = await getActivePage(browser);
    if (!page) {
      throw new Error('没有找到活动的页面，请确保 Chrome 中已经打开了 BOSS 直聘网站');
    }
    // 等待页面加载完成
    const jobListSelector = await waitForPageLoad(page);
    if (!jobListSelector) {
      throw new Error('页面加载失败，请确保已经打开了 BOSS 直聘的职位搜索页面');
    }
    console.log('开始自动投递流程...');
    // 获取实际的职位卡片选择器
    const jobCardSelector = await page.evaluate(() => {
      if (document.querySelector('.card-area')) {
        return '.card-area';
      }
      return null;
    });
    if (!jobCardSelector) {
      throw new Error('无法找到职位卡片元素');
    }
    while (true) {
        // 等待职位列表加载
        await page.waitForSelector(jobCardSelector, { timeout: 3000 });

        // 获取所有未处理的岗位卡片
        const jobCards = await page.$$(`${jobCardSelector}:not([data-processed="true"])`);

        if (jobCards.length === 0) {
          await smoothScroll(page, 500);
          await randomDelay(1000, 3000);
          continue;
        }

        // 处理每个岗位
        for (const jobCard of jobCards) {
          try {
            // 标记该卡片为已处理
            await page.evaluate(card => {
              card.setAttribute('data-processed', 'true');
            }, jobCard);
            // 确保元素可见
            await jobCard.scrollIntoViewIfNeeded();
            // 点击岗位卡片
            await jobCard.click();
            // 查找并点击"立即沟通"按钮
            const chatImmeBtnSelector = '[class*="btn"]:has-text("立即沟通")';
            try {
                // 等待并点击"立即沟通"按钮
                const chatImmeBtn = await page.waitForSelector(chatImmeBtnSelector, { timeout: 1000 });
                await chatImmeBtn.click();
                // 检查是否达到沟通上限
                try {
                    await page.waitForSelector('text="今日沟通人数已达上限，请明天再试"', { timeout: 2000 });
                    // 如果找到了上限提示，说明达到上限了
                    console.log('投递已达上限！')
                    return; // 终止整个函数，跳出 while 循环
                } catch {
                    // 没有找到上限提示，继续处理
                    try {
                        // 处理可能出现的弹窗
                        const stayButton = await page.waitForSelector('[class*="btn"]:has-text("留在此页")', { timeout: 2000 });
                        await stayButton.click();
                    } catch {
                        // 如果没有出现"留在此页"按钮，继续执行
                    }
                }
            } catch {
                // 如果没有找到"立即沟通"按钮，继续处理下一个职位
                continue;
            }
          } catch (error) {
            console.error('处理岗位卡片时出错:', error.message);
            continue;
          }
        }

        // 滚动加载更多
        await smoothScroll(page, 500);
        await randomDelay(2000, 4000);
    }

  } catch (error) {
    console.error('致命错误:', error.message);
  }
}

main().catch(console.error); 