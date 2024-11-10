// 保存设置
document.getElementById('save').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value.trim();
    const statusDiv = document.getElementById('status');

    // 验证 API 密钥格式
    if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
        showStatus('请输入有效的 OpenAI API 密钥', 'error');
        return;
    }

    // 保存到 Chrome 存储
    chrome.storage.sync.set({
        openaiApiKey: apiKey
    }, () => {
        if (chrome.runtime.lastError) {
            showStatus('保存失败: ' + chrome.runtime.lastError.message, 'error');
        } else {
            showStatus('设置已保存', 'success');
        }
    });
});

// 加载已保存的设置
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get('openaiApiKey', (data) => {
        if (data.openaiApiKey) {
            document.getElementById('apiKey').value = data.openaiApiKey;
        }
    });
});

// 显示状态信息
function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = type;
    statusDiv.style.display = 'block';

    // 3秒后自动隐藏
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 3000);
}