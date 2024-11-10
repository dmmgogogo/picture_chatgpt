// 点击打开选项页面
document.getElementById('openOptions').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    // 关闭弹出窗口
    window.close();
});