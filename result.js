console.log('Result page script loaded');

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded');
    
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const resultDiv = document.getElementById('analysisResult');
    const imagePreviewDiv = document.getElementById('imagePreview');

    // 图片压缩函数
    async function compressImage(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            
            img.onload = () => {
                // 创建 canvas
                const canvas = document.createElement('canvas');
                
                // 计算新的尺寸，最大宽度为 800px
                let width = img.width;
                let height = img.height;
                const maxWidth = 800;
                
                if (width > maxWidth) {
                    const ratio = maxWidth / width;
                    width = maxWidth;
                    height = height * ratio;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // 绘制压缩后的图片
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'white'; // 设置白色背景
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                
                // 转换为 base64，使用较低的质量
                const base64 = canvas.toDataURL('image/jpeg', 0.6);
                console.log('Compressed image size:', Math.round(base64.length / 1024), 'KB');
                
                // 验证 base64 格式
                if (!base64.startsWith('data:image/')) {
                    reject(new Error('Invalid image format'));
                    return;
                }

                // 检查大小
                const imageSizeKB = Math.round(base64.length / 1024);
                if (imageSizeKB > 10000) {
                    reject(new Error(`图片太大 (${imageSizeKB}KB)，请使用更小的图片`));
                    return;
                }

                resolve(base64);
            };
            
            img.onerror = (err) => {
                console.error('Image load error:', err);
                reject(new Error('图片加载失败'));
            };

            img.src = imageUrl;
        });
    }

    try {
        loadingDiv.style.display = 'block';
        errorDiv.style.display = 'none';
        
        // 从存储中获取图片URL
        chrome.storage.local.get(['currentImageUrl'], async (data) => {
            console.log('Retrieved from storage:', data);
            
            if (!data.currentImageUrl) {
                throw new Error('未找到图片URL');
            }

            // 显示图片预览
            const img = document.createElement('img');
            img.src = data.currentImageUrl;
            img.style.maxWidth = '400px';
            imagePreviewDiv.appendChild(img);

            // 获取API密钥
            chrome.storage.sync.get('openaiApiKey', async (data) => {
                console.log('API Key retrieved:', data.openaiApiKey ? 'Yes' : 'No');
                
                if (!data.openaiApiKey) {
                    throw new Error('请先在扩展设置中配置OpenAI API密钥');
                }

                try {
                    // 压缩图片
                    const compressedImage = await compressImage(img.src);
                    
                    // 打印请求参数用于调试
                    const requestBody = {
                        model: "gpt-4o",
                        messages: [
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "text",
                                        text: "请分析这张图片并提供以下信息：\n1. 图片内容翻译\n2. 翻译内容整理并总结\n请尽量简明扼要。"
                                    },
                                    {
                                        type: "image_url",
                                        image_url: {
                                            url: compressedImage
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens: 500
                    };
                    
                    console.log('Request body:', JSON.stringify(requestBody).slice(0, 500) + '...');

                    // 调用API进行分析
                    const response = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${data.openaiApiKey}`
                        },
                        body: JSON.stringify(requestBody)
                    });

                    console.log('API Response status:', response.status);
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        console.error('API Error Details:', errorData);
                        throw new Error(`API请求失败: ${response.status} - ${errorData.error?.message || '未知错误'}`);
                    }

                    const result = await response.json();
                    console.log('API Response:', result);

                    // 显示结果
                    loadingDiv.style.display = 'none';
                    resultDiv.innerHTML = `
                        <div style="white-space: pre-line; padding: 15px; background: #f5f5f5; border-radius: 5px;">
                            ${result.choices[0].message.content}
                        </div>
                    `;
                    
                } catch (error) {
                    console.error('API Error:', error);
                    errorDiv.style.display = 'block';
                    errorDiv.textContent = `分析失败: ${error.message}`;
                    loadingDiv.style.display = 'none';
                }
            });
        });

    } catch (error) {
        console.error('Error:', error);
        errorDiv.style.display = 'block';
        errorDiv.textContent = `错误: ${error.message}`;
        loadingDiv.style.display = 'none';
    }
});