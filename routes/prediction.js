const express = require('express');
const router = express.Router();

// AI Prediction endpoint
router.get('/predict/:symbol', (req, res) => {
    const { symbol } = req.params;

    // Mock AI predictions - in production, use TensorFlow.js LSTM model
    const predictions = generatePrediction(symbol);

    res.json({
        success: true,
        symbol: symbol.toUpperCase(),
        predictions
    });
});

// Technical analysis
router.get('/analysis/:symbol', (req, res) => {
    const { symbol } = req.params;

    const analysis = {
        symbol: symbol.toUpperCase(),
        indicators: {
            rsi: {
                value: Math.floor(Math.random() * 40) + 30,
                signal: 'neutral',
                description: 'Relative Strength Index'
            },
            macd: {
                value: (Math.random() - 0.5) * 4,
                signal: Math.random() > 0.5 ? 'bullish' : 'bearish',
                description: 'Moving Average Convergence Divergence'
            },
            sma20: {
                value: 175.50,
                signal: 'bullish',
                description: '20-day Simple Moving Average'
            },
            sma50: {
                value: 168.25,
                signal: 'bullish',
                description: '50-day Simple Moving Average'
            },
            ema12: {
                value: 177.80,
                signal: 'neutral',
                description: '12-day Exponential Moving Average'
            },
            bollinger: {
                upper: 185.50,
                middle: 175.25,
                lower: 165.00,
                signal: 'neutral',
                description: 'Bollinger Bands'
            }
        },
        sentiment: {
            overall: Math.random() > 0.5 ? 'bullish' : 'bearish',
            score: Math.floor(Math.random() * 40) + 40,
            news: Math.random() > 0.5 ? 'positive' : 'negative',
            social: Math.random() > 0.5 ? 'positive' : 'mixed'
        },
        recommendation: getRecommendation(),
        supportLevels: [165.00, 158.50, 150.00],
        resistanceLevels: [185.00, 195.50, 210.00],
        timestamp: new Date().toISOString()
    };

    // Adjust RSI signal
    if (analysis.indicators.rsi.value > 70) {
        analysis.indicators.rsi.signal = 'overbought';
    } else if (analysis.indicators.rsi.value < 30) {
        analysis.indicators.rsi.signal = 'oversold';
    }

    res.json({ success: true, analysis });
});

function generatePrediction(symbol) {
    const basePrice = getBasePrice(symbol);
    const predictions = [];
    let price = basePrice;

    // Generate 7-day predictions
    for (let i = 1; i <= 7; i++) {
        const change = (Math.random() - 0.45) * 0.03 * price;
        price += change;

        predictions.push({
            day: i,
            date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            predictedPrice: parseFloat(price.toFixed(2)),
            confidence: Math.floor(90 - i * 5 + Math.random() * 10),
            range: {
                low: parseFloat((price * 0.97).toFixed(2)),
                high: parseFloat((price * 1.03).toFixed(2))
            }
        });
    }

    const lastPrediction = predictions[predictions.length - 1];
    const priceChange = lastPrediction.predictedPrice - basePrice;
    const changePercent = (priceChange / basePrice) * 100;

    return {
        currentPrice: basePrice,
        predictions,
        summary: {
            direction: priceChange > 0 ? 'up' : 'down',
            expectedChange: parseFloat(priceChange.toFixed(2)),
            expectedChangePercent: parseFloat(changePercent.toFixed(2)),
            recommendation: priceChange > basePrice * 0.02 ? 'BUY' : priceChange < -basePrice * 0.02 ? 'SELL' : 'HOLD',
            confidence: Math.floor(Math.random() * 20) + 70
        }
    };
}

function getBasePrice(symbol) {
    const prices = {
        'AAPL': 178.50,
        'GOOGL': 141.25,
        'MSFT': 378.90,
        'AMZN': 186.75,
        'TSLA': 248.30,
        'META': 505.60,
        'NVDA': 875.40,
        'BTC': 43250.00,
        'ETH': 2580.00,
        'EUR/USD': 1.0875,
        'GBP/USD': 1.2685,
        'USD/JPY': 148.25
    };
    return prices[symbol.toUpperCase()] || 100;
}

function getRecommendation() {
    const recommendations = ['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell'];
    const weights = [0.15, 0.30, 0.30, 0.15, 0.10];
    const random = Math.random();
    let cumulative = 0;

    for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (random < cumulative) return recommendations[i];
    }
    return 'Hold';
}

module.exports = router;
