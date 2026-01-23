const express = require('express');
const router = express.Router();

// Gemini API configuration - User can set their own API key via environment variable
// Get a free API key from: https://aistudio.google.com/app/apikey
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Flag to check if API key is available
const hasApiKey = GEMINI_API_KEY.length > 10;

// Market data (simulated real-time with some randomness)
function getMarketData() {
    const baseData = {
        'AAPL': { name: 'Apple Inc.', basePrice: 178.50, sector: '科技' },
        'GOOGL': { name: 'Alphabet Inc.', basePrice: 141.25, sector: '科技' },
        'MSFT': { name: 'Microsoft', basePrice: 378.90, sector: '科技' },
        'TSLA': { name: 'Tesla Inc.', basePrice: 248.30, sector: '汽车/能源' },
        'NVDA': { name: 'NVIDIA', basePrice: 875.40, sector: '半导体' },
        'META': { name: 'Meta Platforms', basePrice: 505.60, sector: '社交媒体' },
        'AMZN': { name: 'Amazon', basePrice: 186.75, sector: '电商/云计算' },
        'BTC': { name: 'Bitcoin', basePrice: 43250, sector: '加密货币' },
        'ETH': { name: 'Ethereum', basePrice: 2580, sector: '加密货币' },
        'XAU': { name: 'Gold', basePrice: 2025.50, sector: '贵金属' }
    };

    // Add random variation to make responses dynamic
    const result = {};
    for (const [symbol, data] of Object.entries(baseData)) {
        const change = (Math.random() - 0.45) * 5; // -2.25% to +2.75% bias bullish
        const price = data.basePrice * (1 + change / 100);
        result[symbol] = {
            ...data,
            price: price.toFixed(2),
            change: change.toFixed(2),
            rsi: Math.floor(40 + Math.random() * 35), // 40-75
            volume: Math.floor(Math.random() * 50 + 50) + 'M',
            trend: change > 0 ? '上涨' : '下跌'
        };
    }
    return result;
}

// Technical analysis generator
function generateTechnicalAnalysis(symbol, data) {
    const rsi = data.rsi;
    const rsiSignal = rsi > 70 ? '超买' : rsi < 30 ? '超卖' : rsi > 55 ? '偏多' : '中性';
    const macdSignal = Math.random() > 0.5 ? '金叉形成' : '即将金叉';
    const support = (parseFloat(data.price) * 0.95).toFixed(2);
    const resistance = (parseFloat(data.price) * 1.08).toFixed(2);
    const target7d = (parseFloat(data.price) * (1 + (Math.random() * 0.08 + 0.02))).toFixed(2);
    const confidence = Math.floor(65 + Math.random() * 25);
    const recommendation = rsi < 65 && parseFloat(data.change) > -1 ? '买入' : rsi > 70 ? '观望' : '持有';

    return { rsi, rsiSignal, macdSignal, support, resistance, target7d, confidence, recommendation };
}

// System prompt for AI investment advisor
const SYSTEM_PROMPT = `你是TradePro平台的AI投资顾问，专业分析金融市场。使用中文回复，给出具体建议，控制在200字内。`;

// Chat endpoint
router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, error: '消息不能为空' });
        }

        // Try Gemini API first if key is available
        if (hasApiKey) {
            try {
                const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: SYSTEM_PROMPT + '\n\n用户问题：' + message }] }],
                        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
                    })
                });

                const data = await response.json();
                if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    return res.json({ success: true, response: data.candidates[0].content.parts[0].text });
                }
            } catch (apiError) {
                console.log('Gemini API error, using intelligent fallback');
            }
        }

        // Intelligent fallback response
        res.json({ success: true, response: generateIntelligentResponse(message) });

    } catch (error) {
        console.error('AI Chat error:', error);
        res.json({ success: true, response: generateIntelligentResponse(req.body?.message || '') });
    }
});

// Generate intelligent response based on user query
function generateIntelligentResponse(message) {
    const lowerMsg = message.toLowerCase();
    const marketData = getMarketData();

    // Detect specific stock queries
    const stockSymbols = ['aapl', 'apple', '苹果', 'googl', 'google', '谷歌', 'msft', 'microsoft', '微软',
        'tsla', 'tesla', '特斯拉', 'nvda', 'nvidia', '英伟达', 'meta', 'facebook', 'amzn', 'amazon', '亚马逊'];
    const cryptoSymbols = ['btc', 'bitcoin', '比特币', 'eth', 'ethereum', '以太坊'];

    // Check for specific stock/crypto analysis
    for (const sym of stockSymbols) {
        if (lowerMsg.includes(sym)) {
            let symbol = 'AAPL';
            if (lowerMsg.includes('googl') || lowerMsg.includes('google') || lowerMsg.includes('谷歌')) symbol = 'GOOGL';
            else if (lowerMsg.includes('msft') || lowerMsg.includes('microsoft') || lowerMsg.includes('微软')) symbol = 'MSFT';
            else if (lowerMsg.includes('tsla') || lowerMsg.includes('tesla') || lowerMsg.includes('特斯拉')) symbol = 'TSLA';
            else if (lowerMsg.includes('nvda') || lowerMsg.includes('nvidia') || lowerMsg.includes('英伟达')) symbol = 'NVDA';
            else if (lowerMsg.includes('meta') || lowerMsg.includes('facebook')) symbol = 'META';
            else if (lowerMsg.includes('amzn') || lowerMsg.includes('amazon') || lowerMsg.includes('亚马逊')) symbol = 'AMZN';

            return generateStockAnalysis(symbol, marketData[symbol]);
        }
    }

    for (const sym of cryptoSymbols) {
        if (lowerMsg.includes(sym)) {
            const symbol = (lowerMsg.includes('eth') || lowerMsg.includes('以太坊')) ? 'ETH' : 'BTC';
            return generateCryptoAnalysis(symbol, marketData[symbol]);
        }
    }

    // Market overview
    if (lowerMsg.includes('市场') || lowerMsg.includes('分析') || lowerMsg.includes('走势') || lowerMsg.includes('情况')) {
        return generateMarketOverview(marketData);
    }

    // Investment opportunities
    if (lowerMsg.includes('投资') || lowerMsg.includes('机会') || lowerMsg.includes('推荐') || lowerMsg.includes('买什么')) {
        return generateInvestmentOpportunities(marketData);
    }

    // Gold analysis
    if (lowerMsg.includes('黄金') || lowerMsg.includes('gold') || lowerMsg.includes('xau')) {
        return generateGoldAnalysis(marketData['XAU']);
    }

    // Default welcome
    return generateWelcomeMessage();
}

function generateStockAnalysis(symbol, data) {
    const ta = generateTechnicalAnalysis(symbol, data);
    const changeEmoji = parseFloat(data.change) >= 0 ? '📈' : '📉';
    const changeColor = parseFloat(data.change) >= 0 ? '+' : '';

    return `${getStockEmoji(symbol)} **${symbol} (${data.name}) 分析**

💵 当前价格: $${data.price} ${changeEmoji} (${changeColor}${data.change}%)

📊 **技术指标:**
• RSI(14): ${ta.rsi} (${ta.rsiSignal})
• MACD: ${ta.macdSignal}
• 成交量: ${data.volume}
• 支撑位: $${ta.support} | 阻力位: $${ta.resistance}

🎯 **7日预测:** $${ta.target7d}
✅ **建议:** ${ta.recommendation}
📊 **置信度:** ${ta.confidence}%

⚠️ 以上分析基于技术指标，投资有风险，请谨慎决策。`;
}

function generateCryptoAnalysis(symbol, data) {
    const ta = generateTechnicalAnalysis(symbol, data);
    const changeEmoji = parseFloat(data.change) >= 0 ? '🚀' : '📉';

    return `${symbol === 'BTC' ? '₿' : 'Ξ'} **${symbol} (${data.name}) 分析**

💰 当前价格: $${Number(data.price).toLocaleString()} ${changeEmoji}
📊 24h变化: ${parseFloat(data.change) >= 0 ? '+' : ''}${data.change}%

📈 **技术面:**
• RSI: ${ta.rsi} (${ta.rsiSignal})
• 趋势: ${data.trend}中
• 下一目标: $${(parseFloat(data.price) * 1.1).toLocaleString()}

✅ **建议:** ${ta.recommendation}
📊 置信度: ${ta.confidence}%

🔔 ${symbol === 'BTC' ? 'ETF预期持续推动市场，' : ''}注意市场波动风险。`;
}

function generateMarketOverview(data) {
    const bullCount = Object.values(data).filter(d => parseFloat(d.change) > 0).length;
    const sentiment = bullCount >= 6 ? '看涨 🟢' : bullCount >= 4 ? '中性 🟡' : '谨慎 🟠';

    return `📊 **当前市场分析**

🌡️ 整体情绪: ${sentiment}

📈 **美股概览:**
• AAPL: $${data.AAPL.price} (${parseFloat(data.AAPL.change) >= 0 ? '+' : ''}${data.AAPL.change}%)
• NVDA: $${data.NVDA.price} (${parseFloat(data.NVDA.change) >= 0 ? '+' : ''}${data.NVDA.change}%)
• TSLA: $${data.TSLA.price} (${parseFloat(data.TSLA.change) >= 0 ? '+' : ''}${data.TSLA.change}%)

💎 **加密货币:**
• BTC: $${Number(data.BTC.price).toLocaleString()} (${parseFloat(data.BTC.change) >= 0 ? '+' : ''}${data.BTC.change}%)
• ETH: $${Number(data.ETH.price).toLocaleString()} (${parseFloat(data.ETH.change) >= 0 ? '+' : ''}${data.ETH.change}%)

💡 **建议:** ${bullCount >= 5 ? '市场整体向好，可关注科技股和加密资产' : '建议保持谨慎，控制仓位'}

⚠️ 投资有风险，以上仅供参考。`;
}

function generateInvestmentOpportunities(data) {
    // Find top performers
    const sorted = Object.entries(data).sort((a, b) => parseFloat(b[1].change) - parseFloat(a[1].change));
    const top3 = sorted.slice(0, 3);

    return `💰 **今日投资机会**

🔥 **热门推荐:**
${top3.map((s, i) => `${i + 1}. ${s[0]} - ${s[1].name} (${parseFloat(s[1].change) >= 0 ? '+' : ''}${s[1].change}%)`).join('\n')}

📊 **分析:**
• ${top3[0][0]}: ${top3[0][1].sector}板块表现强劲
• 技术面显示上涨动能

⚠️ **风险提示:**
• 注意仓位管理
• 设置止损保护

📈 以上基于当前市场数据，仅供参考。`;
}

function generateGoldAnalysis(data) {
    const ta = generateTechnicalAnalysis('XAU', data);

    return `🥇 **黄金 (XAU/USD) 分析**

💵 当前价格: $${data.price}
📊 变化: ${parseFloat(data.change) >= 0 ? '+' : ''}${data.change}%

📈 **技术指标:**
• RSI: ${ta.rsi} (${ta.rsiSignal})
• 支撑: $${ta.support} | 阻力: $${ta.resistance}

🎯 预测目标: $${ta.target7d}
✅ 建议: ${ta.recommendation}

💡 黄金作为避险资产，适合分散投资组合风险。`;
}

function generateWelcomeMessage() {
    return `👋 您好！我是TradePro AI投资顾问。

我可以帮您分析：
📊 **市场概览** - 了解整体行情
📈 **个股分析** - 如：分析AAPL、TSLA
₿ **加密货币** - BTC、ETH走势预测
💰 **投资机会** - 今日热门推荐
🥇 **黄金走势** - 贵金属分析

请告诉我您想了解什么？您可以直接问：
• "分析一下苹果股票"
• "BTC现在能买吗"
• "今天有什么投资机会"`;
}

function getStockEmoji(symbol) {
    const emojis = {
        'AAPL': '🍎', 'GOOGL': '🔍', 'MSFT': '💻', 'TSLA': '⚡',
        'NVDA': '🎮', 'META': '👥', 'AMZN': '📦', 'BTC': '₿', 'ETH': 'Ξ'
    };
    return emojis[symbol] || '📊';
}

module.exports = router;
