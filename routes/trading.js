const express = require('express');
const router = express.Router();
const db = require('../database');

// Get portfolio
router.get('/portfolio/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const portfolio = db.prepare('SELECT * FROM portfolio WHERE user_id = ?').all(userId);
        res.json({ success: true, portfolio });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Place order (Buy/Sell)
router.post('/order', (req, res) => {
    try {
        const { userId, symbol, type, side, quantity, price } = req.body;

        if (quantity <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid quantity' });
        }

        const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
        const orderPrice = price || getMarketPrice(symbol);
        const totalCost = quantity * orderPrice;

        if (side === 'buy') {
            if (!wallet || wallet.balance < totalCost) {
                return res.status(400).json({ success: false, error: 'Insufficient balance' });
            }

            // Deduct from wallet
            db.prepare('UPDATE wallets SET balance = balance - ? WHERE user_id = ?').run(totalCost, userId);

            // Update portfolio
            const existing = db.prepare('SELECT * FROM portfolio WHERE user_id = ? AND symbol = ?').get(userId, symbol);
            if (existing) {
                const newQty = existing.quantity + quantity;
                const newAvg = ((existing.quantity * existing.avg_price) + totalCost) / newQty;
                db.prepare('UPDATE portfolio SET quantity = ?, avg_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newQty, newAvg, existing.id);
            } else {
                db.prepare('INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (?, ?, ?, ?)').run(userId, symbol, quantity, orderPrice);
            }

            // Record transaction
            db.prepare('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)').run(
                userId, 'trade', -totalCost, `Buy ${quantity} ${symbol} @ $${orderPrice}`
            );

        } else if (side === 'sell') {
            const existing = db.prepare('SELECT * FROM portfolio WHERE user_id = ? AND symbol = ?').get(userId, symbol);
            if (!existing || existing.quantity < quantity) {
                return res.status(400).json({ success: false, error: 'Insufficient holdings' });
            }

            // Add to wallet
            db.prepare('UPDATE wallets SET balance = balance + ? WHERE user_id = ?').run(totalCost, userId);

            // Update portfolio
            const newQty = existing.quantity - quantity;
            if (newQty === 0) {
                db.prepare('DELETE FROM portfolio WHERE id = ?').run(existing.id);
            } else {
                db.prepare('UPDATE portfolio SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newQty, existing.id);
            }

            // Record transaction
            db.prepare('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)').run(
                userId, 'trade', totalCost, `Sell ${quantity} ${symbol} @ $${orderPrice}`
            );
        }

        // Record order
        db.prepare('INSERT INTO orders (user_id, symbol, type, side, quantity, price, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
            userId, symbol, type, side, quantity, orderPrice, 'filled'
        );

        const newBalance = db.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(userId);

        res.json({
            success: true,
            message: `${side.toUpperCase()} order executed`,
            balance: newBalance.balance
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get order history
router.get('/orders/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(userId);
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

function getMarketPrice(symbol) {
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
    return prices[symbol] || 100;
}

module.exports = router;
