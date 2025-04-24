let isRunning = false;

// 添加一个变量来存储滚动的计时器ID
let scrollTimer = null;

// 随机延迟函数
async function randomDelay() {
    const delay = Math.floor(Math.random() * 2000) + 1000; // 1-3秒随机延迟
    await new Promise(resolve => setTimeout(resolve, delay));
}

// 平滑滚动函数
async function smoothScroll(distance) {
    // 清除之前的滚动计时器
    if (scrollTimer) {
        clearInterval(scrollTimer);
    }
    
    await new Promise((resolve) => {
        let scrolled = 0;
        scrollTimer = setInterval(() => {
            if (!isRunning) {
                clearInterval(scrollTimer);
                scrollTimer = null;
                resolve();
                return;
            }
            window.scrollBy(0, 10);
            scrolled += 10;
            if (scrolled >= distance) {
                clearInterval(scrollTimer);
                scrollTimer = null;
                resolve();
            }
        }, 20);
    });
}

// 添加一个函数来停止所有操作
function stopAllOperations() {
    isRunning = false;
    // 清除滚动计时器
    if (scrollTimer) {
        clearInterval(scrollTimer);
        scrollTimer = null;
    }
    const button = document.getElementById('auto-apply-button');
    if (button) {
        button.className = 'auto-apply-button';
        button.textContent = '无法继续投递';
    }
}

// 主要的自动投递函数
async function autoApply() {
    if (!isRunning) return;

    try {
        // 等待职位列表加载
        const jobCards = document.querySelectorAll('.card-area:not([data-processed="true"])');
        
        if (jobCards.length === 0) {
          window.scrollBy(0, 500);
          await randomDelay();
          autoApply();
          return;
        }

        for (const jobCard of jobCards) {
            try {
                // 标记该卡片为已处理
                jobCard.setAttribute('data-processed', 'true');

                // 点击职位卡片
                jobCard.click();

                // 查找并点击"立即沟通"按钮
                const chatButton = document.querySelector('.op-btn-chat');
                if (chatButton && chatButton.textContent.trim() === '立即沟通') {
                    // 创建并触发自定义点击事件
                    const clickEvent = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                  chatButton.dispatchEvent(clickEvent);
                  await randomDelay();

                    // 检查是否达到上限
                    const limitText = document.querySelector('.chat-block-body p');
                    if (limitText && limitText.textContent.trim() === '今日沟通人数已达上限，请明天再试') {
                        stopAllOperations();
                        return;
                    }

                    // 处理"留在此页"按钮
                    const buttons = document.querySelectorAll('button');
                    const stayButton = Array.from(buttons).find(button => 
                        button.textContent.includes('留在此页')
                    );
                    if (stayButton) {
                        stayButton.click();
                        await randomDelay();
                    }

                }
            } catch (error) {
                console.error('处理职位卡片时出错:', error);
                continue;
            }
      }
      
        setTimeout(autoApply, 1000);

    } catch (error) {
      console.log('发生错误', error);
      stopAllOperations();
      
        
    }
}

// 创建控制按钮
function createControlButton() {
  const button = document.createElement('button');
  button.id = 'auto-apply-button';
  button.className = 'auto-apply-button';
  button.textContent = '开始自动投递';
  document.body.appendChild(button);

  button.addEventListener('click', () => {
    isRunning = !isRunning;
    button.textContent = isRunning ? '停止自动投递' : '开始自动投递';
    button.className = isRunning ? 'auto-apply-button running' : 'auto-apply-button';
    if (isRunning) {
      autoApply();
    }
  });

  return button;
}

// 在页面加载完成后运行
createControlButton();

