const express = require('express');
const router = express.Router();

// Mock stock data - in production, use Alpha Vantage or Yahoo Finance API
const stocksData = {
    'AAPL': { name: 'Apple Inc.', price: 178.50, change: 2.35, changePercent: 1.33, volume: 52345678 },
    'GOOGL': { name: 'Alphabet Inc.', price: 141.25, change: -0.85, changePercent: -0.60, volume: 23456789 },
    'MSFT': { name: 'Microsoft Corp.', price: 378.90, change: 4.20, changePercent: 1.12, volume: 34567890 },
    'AMZN': { name: 'Amazon.com Inc.', price: 186.75, change: 1.50, changePercent: 0.81, volume: 45678901 },
    'TSLA': { name: 'Tesla Inc.', price: 248.30, change: -5.40, changePercent: -2.13, volume: 87654321 },
    'META': { name: 'Meta Platforms', price: 505.60, change: 8.90, changePercent: 1.79, volume: 21345678 },
    'NVDA': { name: 'NVIDIA Corp.', price: 875.40, change: 15.60, changePercent: 1.81, volume: 43215678 },
    'BTC': { name: 'Bitcoin', price: 43250.00, change: 850.00, changePercent: 2.00, volume: 28765432 },
    'ETH': { name: 'Ethereum', price: 2580.00, change: 45.00, changePercent: 1.77, volume: 15432678 },
    'EUR/USD': { name: 'Euro/US Dollar', price: 1.0875, change: 0.0025, changePercent: 0.23, volume: 0 },
    'GBP/USD': { name: 'British Pound/USD', price: 1.2685, change: -0.0015, changePercent: -0.12, volume: 0 },
    'USD/JPY': { name: 'US Dollar/Yen', price: 148.25, change: 0.45, changePercent: 0.30, volume: 0 },
    'XAU/USD': { name: 'Gold', price: 2025.50, change: 12.30, changePercent: 0.61, volume: 0 },
};

// Get all stocks
router.get('/list', (req, res) => {
    const stocks = Object.entries(stocksData).map(([symbol, data]) => ({
        symbol,
        ...data
    }));
    res.json({ success: true, stocks });
});

// Get single stock
router.get('/quote/:symbol', (req, res) => {
    const { symbol } = req.params;
    const stock = stocksData[symbol.toUpperCase()];

    if (!stock) {
        return res.status(404).json({ success: false, error: 'Stock not found' });
    }

    // Add some random fluctuation to simulate live data
    const fluctuation = (Math.random() - 0.5) * 2;
    const currentPrice = stock.price + fluctuation;

    res.json({
        success: true,
        quote: {
            symbol: symbol.toUpperCase(),
            ...stock,
            currentPrice: parseFloat(currentPrice.toFixed(2)),
            timestamp: new Date().toISOString()
        }
    });
});

// Get historical data (mock)
router.get('/history/:symbol', (req, res) => {
    const { symbol } = req.params;
    const { period = '1M' } = req.query;

    const stock = stocksData[symbol.toUpperCase()];
    if (!stock) {
        return res.status(404).json({ success: false, error: 'Stock not found' });
    }

    // Generate mock historical data
    const days = period === '1W' ? 7 : period === '1M' ? 30 : period === '3M' ? 90 : 365;
    const history = [];
    let price = stock.price * 0.85; // Start 15% lower

    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        price = price * (1 + (Math.random() - 0.48) * 0.03);

        history.push({
            date: date.toISOString().split('T')[0],
            open: parseFloat((price * 0.998).toFixed(2)),
            high: parseFloat((price * 1.01).toFixed(2)),
            low: parseFloat((price * 0.99).toFixed(2)),
            close: parseFloat(price.toFixed(2)),
            volume: Math.floor(Math.random() * 50000000)
        });
    }

    res.json({ success: true, symbol: symbol.toUpperCase(), history });
});

// Market overview
router.get('/market-overview', (req, res) => {
    const indices = {
        'S&P 500': { value: 4927.85, change: 28.45, changePercent: 0.58 },
        'NASDAQ': { value: 15628.95, change: 156.70, changePercent: 1.01 },
        'DOW': { value: 38654.20, change: -45.30, changePercent: -0.12 },
        'Crypto': { value: 1.68, change: 0.05, changePercent: 3.06 }
    };

    const topGainers = Object.entries(stocksData)
        .filter(([_, data]) => data.changePercent > 0)
        .sort((a, b) => b[1].changePercent - a[1].changePercent)
        .slice(0, 5)
        .map(([symbol, data]) => ({ symbol, ...data }));

    const topLosers = Object.entries(stocksData)
        .filter(([_, data]) => data.changePercent < 0)
        .sort((a, b) => a[1].changePercent - b[1].changePercent)
        .slice(0, 5)
        .map(([symbol, data]) => ({ symbol, ...data }));

    res.json({ success: true, indices, topGainers, topLosers });
});

module.exports = router;
