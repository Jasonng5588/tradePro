const express = require('express');
const router = express.Router();
const db = require('../database');

// Get portfolio
router.get('/portfolio/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await db.query('SELECT * FROM portfolio WHERE user_id = $1', [userId]);
        res.json({ success: true, portfolio: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Place order (Buy/Sell)
router.post('/order', async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { userId, symbol, type, side, quantity, price } = req.body;

        if (quantity <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid quantity' });
        }

        await client.query('BEGIN');

        const walletResult = await client.query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
        const wallet = walletResult.rows[0];
        const orderPrice = price || getMarketPrice(symbol);
        const totalCost = quantity * orderPrice;

        if (side === 'buy') {
            if (!wallet || parseFloat(wallet.balance) < totalCost) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, error: 'Insufficient balance' });
            }

            // Deduct from wallet
            await client.query('UPDATE wallets SET balance = balance - $1 WHERE user_id = $2', [totalCost, userId]);

            // Update portfolio
            const existingResult = await client.query('SELECT * FROM portfolio WHERE user_id = $1 AND symbol = $2', [userId, symbol]);
            const existing = existingResult.rows[0];

            if (existing) {
                const newQty = parseFloat(existing.quantity) + parseFloat(quantity);
                const newAvg = ((parseFloat(existing.quantity) * parseFloat(existing.avg_price)) + totalCost) / newQty;
                await client.query('UPDATE portfolio SET quantity = $1, avg_price = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3', [newQty, newAvg, existing.id]);
            } else {
                await client.query('INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES ($1, $2, $3, $4)', [userId, symbol, quantity, orderPrice]);
            }

            // Record transaction
            await client.query('INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, $2, $3, $4)', [
                userId, 'trade', -totalCost, `Buy ${quantity} ${symbol} @ $${orderPrice}`
            ]);

        } else if (side === 'sell') {
            const existingResult = await client.query('SELECT * FROM portfolio WHERE user_id = $1 AND symbol = $2', [userId, symbol]);
            const existing = existingResult.rows[0];

            if (!existing || parseFloat(existing.quantity) < quantity) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, error: 'Insufficient holdings' });
            }

            // Add to wallet
            await client.query('UPDATE wallets SET balance = balance + $1 WHERE user_id = $2', [totalCost, userId]);

            // Update portfolio
            const newQty = parseFloat(existing.quantity) - parseFloat(quantity);
            if (newQty === 0) {
                await client.query('DELETE FROM portfolio WHERE id = $1', [existing.id]);
            } else {
                await client.query('UPDATE portfolio SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newQty, existing.id]);
            }

            // Record transaction
            await client.query('INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, $2, $3, $4)', [
                userId, 'trade', totalCost, `Sell ${quantity} ${symbol} @ $${orderPrice}`
            ]);
        }

        // Record order
        await client.query('INSERT INTO orders (user_id, symbol, type, side, quantity, price, status) VALUES ($1, $2, $3, $4, $5, $6, $7)', [
            userId, symbol, type, side, quantity, orderPrice, 'filled'
        ]);

        const newBalanceResult = await client.query('SELECT balance FROM wallets WHERE user_id = $1', [userId]);
        const newBalance = newBalanceResult.rows[0].balance;

        await client.query('COMMIT');

        res.json({
            success: true,
            message: `${side.toUpperCase()} order executed`,
            balance: parseFloat(newBalance)
        });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// Get order history
router.get('/orders/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await db.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId]);
        res.json({ success: true, orders: result.rows });
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
