// ============================================
// TradePro - Mobile Trading Platform
// Main Application JavaScript
// ============================================

// Supabase Configuration
const SUPABASE_URL = 'https://ewxgsbhujolsdvjriivq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3eGdzYmh1am9sc2R2anJpaXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMzU5NTAsImV4cCI6MjA4NDcxMTk1MH0.f61XEH064GNXfVAavgfNKALCiCdt1FEiS1VOQv2qUEE';

// Initialize Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// App State
const state = {
    user: null,
    balance: 10000,
    portfolio: [],
    transactions: [],
    currentSymbol: 'AAPL',
    currentPage: 'dashboard',
    previousPage: 'dashboard',
    balanceVisible: true,
    tradingViewWidget: null
};

// Stock Data
const stocksData = {
    'AAPL': { name: 'Apple Inc.', price: 178.50, change: 2.35, changePercent: 1.33, category: 'stocks' },
    'GOOGL': { name: 'Alphabet Inc.', price: 141.25, change: -0.85, changePercent: -0.60, category: 'stocks' },
    'MSFT': { name: 'Microsoft', price: 378.90, change: 4.20, changePercent: 1.12, category: 'stocks' },
    'AMZN': { name: 'Amazon', price: 186.75, change: 1.50, changePercent: 0.81, category: 'stocks' },
    'TSLA': { name: 'Tesla Inc.', price: 248.30, change: -5.40, changePercent: -2.13, category: 'stocks' },
    'META': { name: 'Meta Platforms', price: 505.60, change: 8.90, changePercent: 1.79, category: 'stocks' },
    'NVDA': { name: 'NVIDIA Corp.', price: 875.40, change: 15.60, changePercent: 1.81, category: 'stocks' },
    'BTC': { name: 'Bitcoin', price: 43250.00, change: 850.00, changePercent: 2.00, category: 'crypto' },
    'ETH': { name: 'Ethereum', price: 2580.00, change: 45.00, changePercent: 1.77, category: 'crypto' },
    'EUR/USD': { name: 'Euro/USD', price: 1.0875, change: 0.0025, changePercent: 0.23, category: 'forex' },
    'GBP/USD': { name: 'GBP/USD', price: 1.2685, change: -0.0015, changePercent: -0.12, category: 'forex' },
    'USD/JPY': { name: 'USD/JPY', price: 148.25, change: 0.45, changePercent: 0.30, category: 'forex' },
    'XAU/USD': { name: 'Gold', price: 2025.50, change: 12.30, changePercent: 0.61, category: 'forex' }
};

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    // Show splash screen for 2 seconds
    setTimeout(async () => {
        // Check if user is logged in
        const { data: { session } } = await supabaseClient.auth.getSession();

        if (session) {
            state.user = session.user;
            await loadUserData();
            showMainApp();
        } else {
            showAuthScreen();
        }
    }, 2000);

    // Setup event listeners
    setupEventListeners();

    // Listen for auth changes
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            state.user = session.user;
            await loadUserData();
            showMainApp();
        } else if (event === 'SIGNED_OUT') {
            state.user = null;
            showAuthScreen();
        }
    });
}

function setupEventListeners() {
    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
    });

    // Auth forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);

    // Bottom navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => navigateTo(item.dataset.page));
    });

    // Market tabs
    document.querySelectorAll('.market-tab').forEach(tab => {
        tab.addEventListener('click', () => filterMarket(tab.dataset.market));
    });

    // Trade type tabs
    document.querySelectorAll('.trade-type-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTradeType(tab.dataset.type));
    });

    // Order type change
    document.getElementById('order-type')?.addEventListener('change', (e) => {
        const limitGroup = document.getElementById('limit-price-group');
        limitGroup.style.display = e.target.value !== 'market' ? 'block' : 'none';
    });

    // Trade quantity change
    document.getElementById('trade-quantity')?.addEventListener('input', updateTradeTotal);
    document.getElementById('trade-symbol')?.addEventListener('change', updateTradePrice);

    // Deposit methods
    document.querySelectorAll('.method-card').forEach(card => {
        card.addEventListener('click', () => selectDepositMethod(card));
    });

    // Quick amounts
    document.querySelectorAll('.quick-amount').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('deposit-amount').value = btn.dataset.amount;
            updateBonusAmount();
        });
    });

    // Deposit amount
    document.getElementById('deposit-amount')?.addEventListener('input', updateBonusAmount);

    // Confirm deposit
    document.getElementById('confirm-deposit-btn')?.addEventListener('click', handleDeposit);

    // Confirm withdraw
    document.getElementById('confirm-withdraw-btn')?.addEventListener('click', handleWithdraw);

    // Execute trade
    document.getElementById('execute-trade-btn')?.addEventListener('click', handleTrade);

    // Modal quantity
    document.getElementById('modal-quantity')?.addEventListener('input', updateModalTotal);

    // History tabs
    document.querySelectorAll('.history-tab').forEach(tab => {
        tab.addEventListener('click', () => filterHistory(tab.dataset.type));
    });

    // Chart timeframes
    document.querySelectorAll('.tf-btn').forEach(btn => {
        btn.addEventListener('click', () => changeTimeframe(btn));
    });

    // Stock search
    document.getElementById('stock-search')?.addEventListener('input', (e) => {
        searchStocks(e.target.value);
    });

    // Prediction symbol
    document.getElementById('prediction-symbol')?.addEventListener('change', loadPrediction);
}

// ============================================
// Authentication
// ============================================

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

    document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}-form`).classList.add('active');
}

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        showToast('登录中...');

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        showToast('登录成功！');
    } catch (error) {
        showToast(error.message || '登录失败');
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    const referral = document.getElementById('register-referral').value;

    if (password !== confirm) {
        showToast('密码不匹配');
        return;
    }

    try {
        showToast('注册中...');

        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    referral_code: referral
                }
            }
        });

        if (error) throw error;

        showToast('注册成功！请查收验证邮件');
    } catch (error) {
        showToast(error.message || '注册失败');
    }
}

async function socialLogin(provider) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) throw error;
    } catch (error) {
        showToast(error.message || '登录失败');
    }
}

async function logout() {
    try {
        await supabaseClient.auth.signOut();
        showToast('已退出登录');
    } catch (error) {
        showToast('退出失败');
    }
}

// ============================================
// Screen Navigation
// ============================================

function showAuthScreen() {
    document.getElementById('splash-screen').classList.remove('active');
    document.getElementById('main-app').classList.remove('active');
    document.getElementById('auth-screen').classList.add('active');
}

function showMainApp() {
    document.getElementById('splash-screen').classList.remove('active');
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('main-app').classList.add('active');

    // Load initial data
    updateUI();
    loadStockList();
    loadMarketList();
}

function navigateTo(page) {
    if (page === state.currentPage) return;

    state.previousPage = state.currentPage;
    state.currentPage = page;

    // Update pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) {
        pageEl.classList.add('active');
    }

    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    // Page-specific actions
    switch (page) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'markets':
            loadMarketList();
            break;
        case 'trading':
            updateTradingPage();
            break;
        case 'wallet':
            loadTransactions();
            break;
        case 'predictions':
            loadPrediction();
            break;
        case 'charts':
            initTradingViewWidget();
            break;
        case 'history':
            loadFullHistory();
            break;
        case 'profile':
            updateProfilePage();
            break;
    }

    // Scroll to top
    document.getElementById('page-container').scrollTop = 0;
}

function goBack() {
    navigateTo(state.previousPage);
}

// ============================================
// Data Loading
// ============================================

async function loadUserData() {
    if (!state.user) return;

    try {
        // Load balance from API
        const response = await fetch(`/api/wallet/balance/${state.user.id}`);
        const data = await response.json();
        if (data.success) {
            state.balance = data.balance;
        }

        // Load portfolio
        const portfolioResponse = await fetch(`/api/trading/portfolio/${state.user.id}`);
        const portfolioData = await portfolioResponse.json();
        if (portfolioData.success) {
            state.portfolio = portfolioData.portfolio;
        }

        // Load transactions
        const transResponse = await fetch(`/api/wallet/transactions/${state.user.id}`);
        const transData = await transResponse.json();
        if (transData.success) {
            state.transactions = transData.transactions;
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// ============================================
// UI Updates
// ============================================

function updateUI() {
    updateDashboard();
    updateUserInfo();
}

function updateUserInfo() {
    if (!state.user) return;

    const email = state.user.email || 'User';
    const name = email.split('@')[0];

    document.getElementById('user-greeting').textContent = `Hi, ${name}`;
    document.getElementById('profile-name').textContent = name;
    document.getElementById('profile-email').textContent = email;

    // Generate avatar
    const avatarInitial = name.charAt(0).toUpperCase();
    const avatarColor = `hsl(${name.charCodeAt(0) * 10}, 70%, 50%)`;

    // Set avatar placeholder
    const avatarElements = document.querySelectorAll('#user-avatar, #profile-avatar');
    avatarElements.forEach(el => {
        el.style.background = `linear-gradient(135deg, ${avatarColor}, hsl(${name.charCodeAt(0) * 10 + 30}, 70%, 50%))`;
        el.alt = avatarInitial;
    });

    // Generate referral code
    const referralCode = generateReferralCode(state.user.id);
    document.getElementById('my-referral-code').textContent = referralCode;
}

function updateDashboard() {
    // Update balance
    const balanceEl = document.getElementById('total-balance');
    if (state.balanceVisible) {
        balanceEl.textContent = formatCurrency(state.balance);
    } else {
        balanceEl.textContent = '****';
    }

    // Calculate P&L
    const portfolioValue = calculatePortfolioValue();
    const totalValue = state.balance + portfolioValue;
    const pnl = portfolioValue * 0.0245; // Mock P&L
    const pnlPercent = (pnl / totalValue) * 100;

    const changeEl = document.getElementById('balance-change');
    changeEl.textContent = `${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)} (${pnlPercent.toFixed(2)}%)`;
    changeEl.className = `balance-change ${pnl >= 0 ? 'positive' : 'negative'}`;
}

function loadStockList() {
    const container = document.getElementById('hot-stocks');
    if (!container) return;

    const stocks = Object.entries(stocksData).slice(0, 5);
    container.innerHTML = stocks.map(([symbol, data]) => createStockItem(symbol, data)).join('');
}

function loadMarketList(filter = 'all') {
    const container = document.getElementById('market-list');
    if (!container) return;

    let stocks = Object.entries(stocksData);

    if (filter !== 'all') {
        stocks = stocks.filter(([_, data]) => data.category === filter);
    }

    container.innerHTML = stocks.map(([symbol, data]) => createStockItem(symbol, data)).join('');
}

function createStockItem(symbol, data) {
    const isPositive = data.changePercent >= 0;
    return `
    <div class="stock-item" onclick="openChart('${symbol}')">
      <div class="stock-icon" style="background: linear-gradient(135deg, ${getStockColor(symbol)}, ${getStockColor(symbol, true)})">${symbol.slice(0, 2)}</div>
      <div class="stock-info">
        <div class="stock-symbol">${symbol}</div>
        <div class="stock-name">${data.name}</div>
      </div>
      <div class="stock-price-info">
        <div class="stock-price">${formatPrice(symbol, data.price)}</div>
        <div class="stock-change ${isPositive ? 'positive' : 'negative'}">${isPositive ? '+' : ''}${data.changePercent.toFixed(2)}%</div>
      </div>
    </div>
  `;
}

function getStockColor(symbol, secondary = false) {
    const colors = {
        'AAPL': ['#555555', '#888888'],
        'GOOGL': ['#4285f4', '#34a853'],
        'MSFT': ['#00a4ef', '#7fba00'],
        'AMZN': ['#ff9900', '#146eb4'],
        'TSLA': ['#cc0000', '#e31937'],
        'META': ['#0084ff', '#00c6ff'],
        'NVDA': ['#76b900', '#00ff00'],
        'BTC': ['#f7931a', '#4d4d4d'],
        'ETH': ['#627eea', '#c99d66'],
        'EUR/USD': ['#003399', '#ffcc00'],
        'GBP/USD': ['#012169', '#c8102e'],
        'USD/JPY': ['#bc002d', '#ffffff'],
        'XAU/USD': ['#ffd700', '#b8860b']
    };
    return colors[symbol]?.[secondary ? 1 : 0] || '#7b2ff7';
}

function formatPrice(symbol, price) {
    if (symbol.includes('/')) {
        return price.toFixed(4);
    } else if (['BTC', 'ETH'].includes(symbol)) {
        return '$' + price.toLocaleString();
    }
    return '$' + price.toFixed(2);
}

function formatCurrency(amount) {
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ============================================
// Trading Functions
// ============================================

function openChart(symbol) {
    state.currentSymbol = symbol;
    const data = stocksData[symbol];

    document.getElementById('chart-symbol').textContent = symbol;
    document.getElementById('chart-name').textContent = data.name;
    document.getElementById('chart-price').textContent = formatPrice(symbol, data.price);

    const changeText = `${data.change >= 0 ? '+' : ''}${formatPrice(symbol, data.change).replace('$', '')} (${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%)`;
    document.getElementById('chart-change').textContent = changeText;
    document.getElementById('chart-change').className = `price-change ${data.changePercent >= 0 ? 'positive' : 'negative'}`;

    navigateTo('charts');
}

function initTradingViewWidget() {
    const container = document.getElementById('tradingview-widget');
    if (!container) return;

    // Clear existing widget
    container.innerHTML = '';

    // Map symbols to TradingView format
    const tvSymbol = getTradingViewSymbol(state.currentSymbol);

    try {
        new TradingView.widget({
            autosize: true,
            symbol: tvSymbol,
            interval: '60',
            timezone: 'Asia/Singapore',
            theme: 'dark',
            style: '1',
            locale: 'zh_CN',
            toolbar_bg: '#0a0a1a',
            enable_publishing: false,
            hide_side_toolbar: true,
            allow_symbol_change: false,
            container_id: 'tradingview-widget',
            hide_volume: true,
            studies: ['MASimple@tv-basicstudies']
        });
    } catch (error) {
        console.log('TradingView widget error:', error);
        container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: rgba(255,255,255,0.5);">
        <div style="text-align: center;">
          <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
          <div>图表加载中...</div>
        </div>
      </div>
    `;
    }
}

function getTradingViewSymbol(symbol) {
    const map = {
        'AAPL': 'NASDAQ:AAPL',
        'GOOGL': 'NASDAQ:GOOGL',
        'MSFT': 'NASDAQ:MSFT',
        'AMZN': 'NASDAQ:AMZN',
        'TSLA': 'NASDAQ:TSLA',
        'META': 'NASDAQ:META',
        'NVDA': 'NASDAQ:NVDA',
        'BTC': 'BINANCE:BTCUSDT',
        'ETH': 'BINANCE:ETHUSDT',
        'EUR/USD': 'FX:EURUSD',
        'GBP/USD': 'FX:GBPUSD',
        'USD/JPY': 'FX:USDJPY',
        'XAU/USD': 'TVC:GOLD'
    };
    return map[symbol] || 'NASDAQ:AAPL';
}

function changeTimeframe(btn) {
    document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // Reinitialize chart with new timeframe
    initTradingViewWidget();
}

function openTradeModal(side) {
    const symbol = state.currentSymbol;
    const data = stocksData[symbol];

    document.getElementById('modal-trade-title').textContent = `${side === 'buy' ? '买入' : '卖出'} ${symbol}`;
    document.getElementById('modal-price').textContent = formatPrice(symbol, data.price);
    document.getElementById('modal-quantity').value = 1;

    updateModalTotal();

    const confirmBtn = document.getElementById('modal-confirm-btn');
    confirmBtn.textContent = side === 'buy' ? '确认买入' : '确认卖出';
    confirmBtn.className = `btn-primary ${side}-btn`;
    confirmBtn.onclick = () => executeModalTrade(side);

    document.getElementById('trade-modal').classList.add('active');
}

function closeTradeModal() {
    document.getElementById('trade-modal').classList.remove('active');
}

function updateModalTotal() {
    const symbol = state.currentSymbol;
    const data = stocksData[symbol];
    const quantity = parseFloat(document.getElementById('modal-quantity').value) || 0;
    const total = quantity * data.price;

    document.getElementById('modal-total').textContent = formatCurrency(total);
}

async function executeModalTrade(side) {
    const symbol = state.currentSymbol;
    const quantity = parseFloat(document.getElementById('modal-quantity').value);

    if (quantity <= 0) {
        showToast('请输入有效数量');
        return;
    }

    try {
        const response = await fetch('/api/trading/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: state.user.id,
                symbol,
                type: 'market',
                side,
                quantity
            })
        });

        const data = await response.json();

        if (data.success) {
            state.balance = data.balance;
            showToast(data.message);
            closeTradeModal();
            await loadUserData();
            updateUI();
        } else {
            showToast(data.error);
        }
    } catch (error) {
        showToast('交易失败');
    }
}

function updateTradingPage() {
    document.getElementById('trading-balance').textContent = formatCurrency(state.balance);
    updateTradePrice();
    loadPortfolio();
}

function updateTradePrice() {
    const symbol = document.getElementById('trade-symbol').value;
    const data = stocksData[symbol];

    document.getElementById('current-trade-price').textContent = formatPrice(symbol, data.price);
    updateTradeTotal();
}

function updateTradeTotal() {
    const symbol = document.getElementById('trade-symbol').value;
    const data = stocksData[symbol];
    const quantity = parseFloat(document.getElementById('trade-quantity').value) || 0;
    const total = quantity * data.price;

    document.getElementById('trade-total').textContent = formatCurrency(total);
    document.getElementById('trade-fee').textContent = formatCurrency(total * 0.001);
}

function switchTradeType(type) {
    document.querySelectorAll('.trade-type-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.type === type);
    });

    const btn = document.getElementById('execute-trade-btn');
    btn.textContent = type === 'buy' ? '确认买入' : '确认卖出';
    btn.className = `btn-primary ${type}-btn`;
    btn.dataset.side = type;
}

async function handleTrade() {
    const symbol = document.getElementById('trade-symbol').value;
    const quantity = parseFloat(document.getElementById('trade-quantity').value);
    const side = document.getElementById('execute-trade-btn').dataset.side || 'buy';
    const orderType = document.getElementById('order-type').value;

    if (quantity <= 0) {
        showToast('请输入有效数量');
        return;
    }

    try {
        const response = await fetch('/api/trading/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: state.user.id,
                symbol,
                type: orderType,
                side,
                quantity
            })
        });

        const data = await response.json();

        if (data.success) {
            state.balance = data.balance;
            showToast(data.message);
            await loadUserData();
            updateTradingPage();
        } else {
            showToast(data.error);
        }
    } catch (error) {
        showToast('交易失败');
    }
}

function loadPortfolio() {
    const container = document.getElementById('portfolio-list');
    if (!container) return;

    if (state.portfolio.length === 0) {
        container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">
        <div style="font-size: 48px; margin-bottom: 10px;">📦</div>
        <div>暂无持仓</div>
      </div>
    `;
        return;
    }

    container.innerHTML = state.portfolio.map(item => {
        const data = stocksData[item.symbol] || { price: item.avg_price };
        const currentValue = item.quantity * data.price;
        const costBasis = item.quantity * item.avg_price;
        const pnl = currentValue - costBasis;
        const pnlPercent = (pnl / costBasis) * 100;

        return `
      <div class="portfolio-item" onclick="openChart('${item.symbol}')">
        <div class="stock-icon" style="background: linear-gradient(135deg, ${getStockColor(item.symbol)}, ${getStockColor(item.symbol, true)})">${item.symbol.slice(0, 2)}</div>
        <div class="stock-info">
          <div class="stock-symbol">${item.symbol}</div>
          <div class="stock-name">${item.quantity} 股 @ ${formatCurrency(item.avg_price)}</div>
        </div>
        <div class="stock-price-info">
          <div class="stock-price">${formatCurrency(currentValue)}</div>
          <div class="stock-pnl ${pnl >= 0 ? 'positive' : 'negative'}">${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)} (${pnlPercent.toFixed(2)}%)</div>
        </div>
      </div>
    `;
    }).join('');
}

function calculatePortfolioValue() {
    return state.portfolio.reduce((total, item) => {
        const data = stocksData[item.symbol] || { price: item.avg_price };
        return total + (item.quantity * data.price);
    }, 0);
}

// ============================================
// Wallet Functions
// ============================================

function selectDepositMethod(card) {
    document.querySelectorAll('.method-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
}

function updateBonusAmount() {
    const amount = parseFloat(document.getElementById('deposit-amount').value) || 0;
    const bonus = amount * 0.5; // 50% bonus for first deposit
    document.getElementById('bonus-amount').textContent = `+${formatCurrency(bonus)}`;
}

async function handleDeposit() {
    const amount = parseFloat(document.getElementById('deposit-amount').value);
    const method = document.querySelector('.method-card.active')?.dataset.method || 'card';

    if (!amount || amount < 10) {
        showToast('最低充值金额为 $10');
        return;
    }

    try {
        const response = await fetch('/api/wallet/deposit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: state.user.id,
                amount,
                method
            })
        });

        const data = await response.json();

        if (data.success) {
            state.balance = data.balance;
            showToast('充值成功！');
            document.getElementById('deposit-amount').value = '';
            updateBonusAmount();
            await loadUserData();
            navigateTo('wallet');
        } else {
            showToast(data.error);
        }
    } catch (error) {
        showToast('充值失败');
    }
}

function withdrawAll() {
    document.getElementById('withdraw-amount').value = state.balance;
}

async function handleWithdraw() {
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    const method = document.getElementById('withdraw-method').value;

    if (!amount || amount < 50) {
        showToast('最低提现金额为 $50');
        return;
    }

    if (amount > state.balance) {
        showToast('余额不足');
        return;
    }

    try {
        const response = await fetch('/api/wallet/withdraw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: state.user.id,
                amount,
                method
            })
        });

        const data = await response.json();

        if (data.success) {
            state.balance = data.balance;
            showToast('提现申请已提交！');
            document.getElementById('withdraw-amount').value = '';
            await loadUserData();
            navigateTo('wallet');
        } else {
            showToast(data.error);
        }
    } catch (error) {
        showToast('提现失败');
    }
}

async function loadTransactions() {
    document.getElementById('wallet-balance').textContent = formatCurrency(state.balance);
    document.getElementById('withdrawable-balance').textContent = formatCurrency(state.balance);

    const container = document.getElementById('recent-transactions');
    if (!container) return;

    if (state.transactions.length === 0) {
        container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">
        <div>暂无交易记录</div>
      </div>
    `;
        return;
    }

    container.innerHTML = state.transactions.slice(0, 5).map(tx => createTransactionItem(tx)).join('');
}

function loadFullHistory() {
    const container = document.getElementById('transaction-history');
    if (!container) return;

    container.innerHTML = state.transactions.map(tx => createTransactionItem(tx)).join('');
}

function createTransactionItem(tx) {
    const icons = {
        'deposit': '➕',
        'withdraw': '➖',
        'trade': '📈'
    };

    const typeNames = {
        'deposit': '充值',
        'withdraw': '提现',
        'trade': '交易'
    };

    const isPositive = tx.amount > 0;

    return `
    <div class="transaction-item">
      <div class="transaction-icon ${tx.type}">${icons[tx.type] || '💰'}</div>
      <div class="transaction-info">
        <div class="transaction-type">${typeNames[tx.type] || tx.type}</div>
        <div class="transaction-date">${formatDate(tx.created_at)}</div>
      </div>
      <div class="transaction-amount ${isPositive ? 'positive' : 'negative'}">
        ${isPositive ? '+' : ''}${formatCurrency(Math.abs(tx.amount))}
      </div>
    </div>
  `;
}

function filterHistory(type) {
    document.querySelectorAll('.history-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.type === type);
    });

    const container = document.getElementById('transaction-history');
    let filtered = state.transactions;

    if (type !== 'all') {
        filtered = state.transactions.filter(tx => tx.type === type);
    }

    container.innerHTML = filtered.map(tx => createTransactionItem(tx)).join('');
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ============================================
// Predictions
// ============================================

async function loadPrediction() {
    const symbol = document.getElementById('prediction-symbol')?.value || 'AAPL';

    try {
        const response = await fetch(`/api/prediction/predict/${symbol}`);
        const data = await response.json();

        if (data.success) {
            displayPrediction(symbol, data.predictions);
        }

        // Load technical analysis
        const analysisResponse = await fetch(`/api/prediction/analysis/${symbol}`);
        const analysisData = await analysisResponse.json();

        if (analysisData.success) {
            displayTechnicalAnalysis(analysisData.analysis);
        }
    } catch (error) {
        console.error('Error loading prediction:', error);
    }
}

function displayPrediction(symbol, predictions) {
    document.getElementById('pred-symbol').textContent = symbol;

    const summary = predictions.summary;
    const recEl = document.getElementById('pred-recommendation');
    recEl.textContent = summary.recommendation;
    recEl.className = `pred-recommendation ${summary.recommendation.toLowerCase()}`;

    document.getElementById('confidence-fill').style.width = `${summary.confidence}%`;
    document.getElementById('confidence-value').textContent = `${summary.confidence}%`;

    document.getElementById('pred-current').textContent = formatCurrency(predictions.currentPrice);
    document.getElementById('pred-target').textContent = formatCurrency(predictions.predictions[6].predictedPrice);

    const returnEl = document.getElementById('pred-return');
    returnEl.textContent = `${summary.expectedChangePercent >= 0 ? '+' : ''}${summary.expectedChangePercent.toFixed(2)}%`;
    returnEl.className = summary.expectedChangePercent >= 0 ? 'positive' : 'negative';
}

function displayTechnicalAnalysis(analysis) {
    const container = document.getElementById('technical-analysis');
    if (!container) return;

    const indicators = analysis.indicators;

    container.innerHTML = Object.entries(indicators).map(([key, ind]) => `
    <div class="indicator-item">
      <span class="indicator-name">${ind.description}</span>
      <div class="indicator-value">
        <span>${typeof ind.value === 'number' ? ind.value.toFixed(2) : '-'}</span>
        <span class="indicator-signal ${ind.signal}">${getSignalText(ind.signal)}</span>
      </div>
    </div>
  `).join('');
}

function getSignalText(signal) {
    const texts = {
        'bullish': '看涨',
        'bearish': '看跌',
        'neutral': '中性',
        'overbought': '超买',
        'oversold': '超卖'
    };
    return texts[signal] || signal;
}

function openTradeFromPrediction() {
    const symbol = document.getElementById('prediction-symbol').value;
    state.currentSymbol = symbol;
    openTradeModal('buy');
}

// ============================================
// Market Functions
// ============================================

function filterMarket(market) {
    document.querySelectorAll('.market-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.market === market);
    });

    loadMarketList(market);
}

function searchStocks(query) {
    const container = document.getElementById('market-list');
    if (!container) return;

    query = query.toLowerCase();

    const filtered = Object.entries(stocksData).filter(([symbol, data]) =>
        symbol.toLowerCase().includes(query) ||
        data.name.toLowerCase().includes(query)
    );

    container.innerHTML = filtered.map(([symbol, data]) => createStockItem(symbol, data)).join('');
}

// ============================================
// Profile Functions
// ============================================

function updateProfilePage() {
    document.getElementById('total-trades').textContent = state.transactions.filter(t => t.type === 'trade').length;

    const totalPnl = state.transactions
        .filter(t => t.type === 'trade')
        .reduce((sum, t) => sum + t.amount, 0);
    document.getElementById('total-profit').textContent = formatCurrency(totalPnl);

    const wins = state.transactions.filter(t => t.type === 'trade' && t.amount > 0).length;
    const total = state.transactions.filter(t => t.type === 'trade').length;
    const winRate = total > 0 ? (wins / total * 100) : 0;
    document.getElementById('win-rate').textContent = `${winRate.toFixed(0)}%`;
}

function showReferral() {
    document.getElementById('referral-modal').classList.add('active');
}

function closeReferralModal() {
    document.getElementById('referral-modal').classList.remove('active');
}

function copyReferralCode() {
    const code = document.getElementById('my-referral-code').textContent;
    navigator.clipboard.writeText(code).then(() => {
        showToast('邀请码已复制');
    });
}

function generateReferralCode(userId) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// ============================================
// Utility Functions
// ============================================

function toggleBalance() {
    state.balanceVisible = !state.balanceVisible;
    updateDashboard();
}

function showNotifications() {
    showToast('暂无新通知');
}

function toggleWatchlist() {
    showToast('已添加到自选');
}

function toggleFAQ(element) {
    const item = element.closest('.faq-item');
    item.classList.toggle('open');
}

function openChat() {
    openAIChat();
}

function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// ============================================
// AI Chat Functions
// ============================================

function openAIChat() {
    document.getElementById('ai-chat-modal').classList.add('active');
    document.getElementById('ai-chat-btn').style.display = 'none';
}

function closeAIChat() {
    document.getElementById('ai-chat-modal').classList.remove('active');
    document.getElementById('ai-chat-btn').style.display = 'flex';
}

function handleChatKeypress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

function sendQuickMessage(message) {
    document.getElementById('chat-input').value = message;
    sendChatMessage();
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    // Add user message
    addChatMessage(message, 'user');
    input.value = '';

    // Show typing indicator
    showTypingIndicator();

    try {
        // Call Gemini AI API
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        removeTypingIndicator();

        if (data.success && data.response) {
            // Format the response for HTML display
            let formattedResponse = data.response
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
            addChatMessage(formattedResponse, 'ai');
        } else {
            addChatMessage('抱歉，暂时无法获取分析结果，请稍后再试。', 'ai');
        }
    } catch (error) {
        console.error('AI Chat error:', error);
        removeTypingIndicator();
        addChatMessage('网络错误，请检查网络连接后重试。', 'ai');
    }
}

function addChatMessage(content, type) {
    const container = document.getElementById('chat-messages');
    const avatar = type === 'ai' ? '🤖' : '👤';

    const messageHtml = `
        <div class="chat-message ${type}">
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <p>${content}</p>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', messageHtml);
    container.scrollTop = container.scrollHeight;
}

function showTypingIndicator() {
    const container = document.getElementById('chat-messages');
    const typingHtml = `
        <div class="chat-message ai typing-message">
            <div class="message-avatar">🤖</div>
            <div class="message-content typing-indicator">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', typingHtml);
    container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
    const typing = document.querySelector('.typing-message');
    if (typing) typing.remove();
}

function generateAIResponse(message) {
    const lowerMsg = message.toLowerCase();

    // Market analysis
    if (lowerMsg.includes('市场') || lowerMsg.includes('分析') || lowerMsg.includes('走势')) {
        const sentiment = Math.random() > 0.5 ? '看涨' : '谨慎乐观';
        return `📊 <strong>当前市场分析</strong><br><br>
        整体市场情绪: <span style="color: #00ff88;">${sentiment}</span><br><br>
        📈 美股三大指数今日表现稳定，科技股领涨<br>
        💎 加密货币市场回暖，BTC站稳43000关口<br>
        💹 外汇市场波动较小，美元指数微跌<br><br>
        <strong>建议:</strong> 当前可关注科技股和优质加密资产的逢低布局机会。`;
    }

    // Investment opportunities
    if (lowerMsg.includes('投资') || lowerMsg.includes('机会') || lowerMsg.includes('推荐')) {
        return `💰 <strong>今日投资机会</strong><br><br>
        🔥 <strong>热门推荐:</strong><br>
        1. NVDA - AI芯片需求持续增长 (+1.81%)<br>
        2. BTC - 技术面突破，上涨动能强 (+2.00%)<br>
        3. META - VR/AR业务前景看好 (+1.79%)<br><br>
        ⚠️ <strong>风险提示:</strong><br>
        - TSLA近期波动较大，建议观望<br>
        - 外汇市场关注美联储利率决议<br><br>
        <em>以上建议仅供参考，请根据自身风险承受能力做出决策。</em>`;
    }

    // AAPL analysis
    if (lowerMsg.includes('aapl') || lowerMsg.includes('苹果') || lowerMsg.includes('apple')) {
        return `🍎 <strong>AAPL (Apple Inc.) 分析</strong><br><br>
        💵 当前价格: $178.50 <span style="color: #00ff88;">(+1.33%)</span><br><br>
        📊 <strong>技术指标:</strong><br>
        • RSI: 58 (中性偏多)<br>
        • MACD: 金叉形成<br>
        • 支撑位: $172 | 阻力位: $185<br><br>
        📈 <strong>AI预测 (7天):</strong> $186.20 (+4.32%)<br>
        ✅ <strong>建议:</strong> 买入<br>
        📊 置信度: 78%<br><br>
        <em>Vision Pro发布后市场反应积极，长期看好。</em>`;
    }

    // BTC analysis
    if (lowerMsg.includes('btc') || lowerMsg.includes('比特币') || lowerMsg.includes('bitcoin')) {
        return `₿ <strong>BTC (Bitcoin) 分析</strong><br><br>
        💵 当前价格: $43,250 <span style="color: #00ff88;">(+2.00%)</span><br><br>
        📊 <strong>技术指标:</strong><br>
        • RSI: 62 (偏多)<br>
        • 突破关键阻力位$42,000<br>
        • 下一目标: $45,000-$48,000<br><br>
        📈 <strong>AI预测 (7天):</strong> $46,800 (+8.21%)<br>
        ✅ <strong>建议:</strong> 买入<br>
        📊 置信度: 72%<br><br>
        <em>ETF审批预期持续推动价格上涨，注意波动风险。</em>`;
    }

    // Default response
    return `感谢您的问题！<br><br>
    我可以帮您分析以下内容:<br>
    • 📊 整体市场情况<br>
    • 💰 热门投资机会<br>
    • 📈 个股技术分析 (如AAPL、TSLA等)<br>
    • ₿ 加密货币走势预测<br><br>
    请告诉我您想了解什么？`;
}

// ============================================
// VIP & Security Functions
// ============================================

function upgradeVIP(tier) {
    const prices = { 1: 99, 2: 199, 3: 499 };
    const names = { 1: 'VIP 1', 2: 'VIP 2', 3: 'VIP 3' };

    if (state.balance < prices[tier]) {
        showToast(`余额不足，需要 $${prices[tier]}`);
        return;
    }

    showToast(`恭喜您成功开通 ${names[tier]}！`);
    // In production, this would call the API to upgrade VIP
}

function changePassword() {
    const newPassword = prompt('请输入新密码 (至少6位):');
    if (newPassword && newPassword.length >= 6) {
        showToast('密码修改成功！');
    } else if (newPassword) {
        showToast('密码至少需要6位');
    }
}

function bindPhone() {
    const phone = prompt('请输入手机号码:');
    if (phone && phone.length >= 10) {
        showToast('验证码已发送到 ' + phone);
        setTimeout(() => {
            const code = prompt('请输入验证码:');
            if (code) {
                showToast('手机绑定成功！');
                document.getElementById('phone-status').textContent = phone.slice(0, 3) + '****' + phone.slice(-4);
            }
        }, 500);
    } else if (phone) {
        showToast('请输入有效的手机号码');
    }
}

function setup2FA() {
    if (confirm('是否开启Google验证器 (2FA)?')) {
        showToast('2FA已开启！');
        document.getElementById('2fa-status').textContent = '已开启';
    }
}

function setFundPassword() {
    const password = prompt('请设置6位数字资金密码:');
    if (password && /^\d{6}$/.test(password)) {
        showToast('资金密码设置成功！');
        document.getElementById('fund-password-status').textContent = '已设置';
    } else if (password) {
        showToast('请输入6位数字');
    }
}

function addPaymentMethod() {
    const cardNumber = prompt('请输入卡号 (16位):');
    if (cardNumber && cardNumber.length >= 16) {
        showToast('支付方式添加成功！');
    } else if (cardNumber) {
        showToast('请输入有效的卡号');
    }
}

function addBankAccount() {
    const bankName = prompt('请输入银行名称:');
    if (bankName) {
        const accountNumber = prompt('请输入银行账号:');
        if (accountNumber && accountNumber.length >= 10) {
            showToast('银行账户添加成功！');
        } else if (accountNumber) {
            showToast('请输入有效的账号');
        }
    }
}

function uploadID() {
    if (confirm('是否提交身份证进行高级认证?')) {
        showToast('认证申请已提交，预计1-3个工作日审核完成');
    }
}

function updateProfilePage() {
    if (!state.user) return;
    const email = state.user.email || 'User';
    const name = email.split('@')[0];
    document.getElementById('profile-name').textContent = name;
    document.getElementById('profile-email').textContent = email;
}

// Expose functions to global scope
window.navigateTo = navigateTo;
window.goBack = goBack;
window.openChart = openChart;
window.openTradeModal = openTradeModal;
window.closeTradeModal = closeTradeModal;
window.toggleBalance = toggleBalance;
window.showNotifications = showNotifications;
window.toggleWatchlist = toggleWatchlist;
window.socialLogin = socialLogin;
window.logout = logout;
window.showReferral = showReferral;
window.closeReferralModal = closeReferralModal;
window.copyReferralCode = copyReferralCode;
window.toggleFAQ = toggleFAQ;
window.openChat = openChat;
window.withdrawAll = withdrawAll;
window.loadPrediction = loadPrediction;
window.openTradeFromPrediction = openTradeFromPrediction;
window.openAIChat = openAIChat;
window.closeAIChat = closeAIChat;
window.sendChatMessage = sendChatMessage;
window.sendQuickMessage = sendQuickMessage;
window.handleChatKeypress = handleChatKeypress;
window.upgradeVIP = upgradeVIP;
window.changePassword = changePassword;
window.bindPhone = bindPhone;
window.setup2FA = setup2FA;
window.setFundPassword = setFundPassword;
window.addPaymentMethod = addPaymentMethod;
window.addBankAccount = addBankAccount;
window.uploadID = uploadID;
window.updateProfilePage = updateProfilePage;
