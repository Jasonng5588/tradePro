const express = require('express');
const router = express.Router();
const db = require('../database');

// Get wallet balance
router.get('/balance/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await db.query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
        let wallet = result.rows[0];

        if (!wallet) {
            await db.query('INSERT INTO wallets (user_id, balance) VALUES ($1, $2)', [userId, 10000]);
            wallet = { user_id: userId, balance: 10000 };
        }

        res.json({ success: true, balance: parseFloat(wallet.balance) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Deposit
router.post('/deposit', async (req, res) => {
    try {
        const { userId, amount, method } = req.body;

        if (amount <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid amount' });
        }

        const result = await db.query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
        let wallet = result.rows[0];

        if (!wallet) {
            await db.query('INSERT INTO wallets (user_id, balance) VALUES ($1, $2)', [userId, 0]);
            wallet = { balance: 0 };
        }

        const newBalance = parseFloat(wallet.balance) + parseFloat(amount);
        await db.query('UPDATE wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', [newBalance, userId]);

        await db.query('INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, $2, $3, $4)', [
            userId, 'deposit', amount, `Deposit via ${method}`
        ]);

        res.json({ success: true, balance: newBalance, message: 'Deposit successful' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Withdraw
router.post('/withdraw', async (req, res) => {
    try {
        const { userId, amount, method } = req.body;

        if (amount <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid amount' });
        }

        const result = await db.query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
        const wallet = result.rows[0];

        if (!wallet || parseFloat(wallet.balance) < amount) {
            return res.status(400).json({ success: false, error: 'Insufficient balance' });
        }

        const newBalance = parseFloat(wallet.balance) - parseFloat(amount);
        await db.query('UPDATE wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', [newBalance, userId]);

        await db.query('INSERT INTO transactions (user_id, type, amount, description, status) VALUES ($1, $2, $3, $4, $5)', [
            userId, 'withdraw', -amount, `Withdrawal to ${method}`, 'pending'
        ]);

        res.json({ success: true, balance: newBalance, message: 'Withdrawal request submitted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Transaction history
router.get('/transactions/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await db.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId]);
        res.json({ success: true, transactions: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
