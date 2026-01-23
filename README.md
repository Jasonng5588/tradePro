# TradePro - Mobile Trading Platform

A comprehensive mobile-first trading platform with broker functionality, MetaTrader5-style charts, stock analysis, and AI-powered predictions.

## 📱 Features

### 🔐 Authentication
- User registration and login with Supabase
- Google OAuth integration
- Secure session management

### 💰 Broker/Wallet
- Deposit funds (credit card, crypto, e-wallet, bank transfer)
- Withdraw funds
- Transaction history
- Balance management

### 📊 Professional Charts
- TradingView widget integration (MT5-style)
- Multiple timeframes (1m, 5m, 15m, 1H, 1D, 1W)
- Technical indicators
- Real-time price updates

### 📈 Trading
- Buy/Sell orders
- Market orders, limit orders, stop-loss
- Portfolio management
- P&L tracking

### 🤖 AI Features
- AI Chat Assistant for market analysis
- Price predictions with confidence scores
- Technical indicators analysis (RSI, MACD, Bollinger Bands)
- Investment recommendations

### 👤 Profile & Settings
- VIP membership system (3 tiers)
- Security center (2FA, fund password)
- Payment methods management
- Referral program

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Open in browser
http://localhost:3003
```

## 🛠 Tech Stack

- **Frontend**: HTML5, CSS3 (Glassmorphism), Vanilla JavaScript
- **Backend**: Node.js + Express.js
- **Database**: SQLite
- **Auth**: Supabase
- **Charts**: TradingView Widgets
- **UI**: Mobile-first responsive design

## 📂 Project Structure

```
├── server.js              # Express server
├── database.js            # SQLite setup
├── package.json           # Dependencies
├── public/
│   ├── index.html         # Main SPA
│   ├── css/styles.css     # All styles
│   └── js/app.js          # Application logic
└── routes/
    ├── wallet.js          # Wallet API
    ├── trading.js         # Trading API
    ├── stocks.js          # Stock data API
    └── prediction.js      # AI prediction API
```

## 🎨 Design

- Dark theme with neon cyan/purple accents
- Glassmorphism effects
- Smooth animations
- Mobile-optimized (430px max-width)

## ⚠️ Disclaimer

This is a demo/simulation platform. Real trading would require proper broker API integration and financial licensing.

## 📄 License

MIT License
