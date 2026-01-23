const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/trading', require('./routes/trading'));
app.use('/api/stocks', require('./routes/stocks'));
app.use('/api/prediction', require('./routes/prediction'));
app.use('/api/ai', require('./routes/ai'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve the main app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Trading Platform running on http://localhost:${PORT}`);
});
