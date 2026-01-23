const express = require('express');
const router = express.Router();
const db = require('../database');

// Get wallet balance
router.get('/balance/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        let wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);

        if (!wallet) {
            db.prepare('INSERT INTO wallets (user_id, balance) VALUES (?, ?)').run(userId, 10000);
            wallet = { user_id: userId, balance: 10000 };
        }

        res.json({ success: true, balance: wallet.balance });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Deposit
router.post('/deposit', (req, res) => {
    try {
        const { userId, amount, method } = req.body;

        if (amount <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid amount' });
        }

        let wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);

        if (!wallet) {
            db.prepare('INSERT INTO wallets (user_id, balance) VALUES (?, ?)').run(userId, 0);
            wallet = { balance: 0 };
        }

        const newBalance = wallet.balance + amount;
        db.prepare('UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(newBalance, userId);

        db.prepare('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)').run(
            userId, 'deposit', amount, `Deposit via ${method}`
        );

        res.json({ success: true, balance: newBalance, message: 'Deposit successful' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Withdraw
router.post('/withdraw', (req, res) => {
    try {
        const { userId, amount, method } = req.body;

        if (amount <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid amount' });
        }

        const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);

        if (!wallet || wallet.balance < amount) {
            return res.status(400).json({ success: false, error: 'Insufficient balance' });
        }

        const newBalance = wallet.balance - amount;
        db.prepare('UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(newBalance, userId);

        db.prepare('INSERT INTO transactions (user_id, type, amount, description, status) VALUES (?, ?, ?, ?, ?)').run(
            userId, 'withdraw', -amount, `Withdrawal to ${method}`, 'pending'
        );

        res.json({ success: true, balance: newBalance, message: 'Withdrawal request submitted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Transaction history
router.get('/transactions/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(userId);
        res.json({ success: true, transactions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
