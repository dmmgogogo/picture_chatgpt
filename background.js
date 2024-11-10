// background.js
console.log('Background script loaded'); // 添加调试日志

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated'); // 添加调试日志
  chrome.contextMenus.create({
    id: "analyzeImage",
    title: "XMM-AI智能分析",
    contexts: ["image"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('Context menu clicked', info); // 添加调试日志
  
  if (info.menuItemId === "analyzeImage") {
    try {
      // 获取图片URL
      const imageUrl = info.srcUrl;
      console.log('Image URL:', imageUrl); // 打印图片URL

      // 确保result.html存在并且路径正确
      const resultPageUrl = chrome.runtime.getURL('result.html');
      console.log('Result page URL:', resultPageUrl); // 打印结果页面URL

      // 创建结果展示窗口
      chrome.windows.create({
        url: resultPageUrl,
        type: 'popup',
        width: 800,
        height: 600
      }, (window) => {
        console.log('Window created:', window); // 打印窗口创建信息
      });

      // 暂时存储图片URL供结果页面使用
      chrome.storage.local.set({ 
        currentImageUrl: imageUrl 
      }, () => {
        console.log('Image URL saved to storage'); // 打印存储确认
      });

    } catch (error) {
      console.error('Error in analyzeImage:', error); // 打印错误信息
    }
  }
});