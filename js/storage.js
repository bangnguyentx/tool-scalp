// Storage Manager - Quản lý dữ liệu với persistent storage
class StorageManager {
    constructor() {
        this.init();
    }

    // Khởi tạo storage
    init() {
        try {
            // Kiểm tra và khởi tạo dữ liệu mặc định
            const keys = this.getKeys();
            if (!keys || keys.length === 0) {
                this.saveKeys([{
                    code: 'BangAdmin17',
                    type: 'admin',
                    createdAt: Date.now(),
                    expiresAt: null,
                    createdBy: 'system'
                }]);
            }

            const signals = this.getActiveSignals();
            if (!signals) {
                this.saveActiveSignals([]);
            }

            const completed = this.getCompletedSignals();
            if (!completed) {
                this.saveCompletedSignals([]);
            }

            const tracked = this.getTrackedCoins();
            if (!tracked) {
                this.saveTrackedCoins([]);
            }

            const cooldown = this.getCooldownCoins();
            if (!cooldown) {
                this.saveCooldownCoins([]);
            }

            console.log('Storage initialized successfully');
        } catch (error) {
            console.error('Storage init error:', error);
        }
    }

    // Keys Management
    getKeys() {
        try {
            const result = localStorage.getItem('quantum_access_keys');
            return result ? JSON.parse(result) : [];
        } catch (error) {
            console.error('Error getting keys:', error);
            return [];
        }
    }

    saveKeys(keys) {
        try {
            localStorage.setItem('quantum_access_keys', JSON.stringify(keys));
            return true;
        } catch (error) {
            console.error('Error saving keys:', error);
            return false;
        }
    }

    addKey(keyData) {
        const keys = this.getKeys();
        const newKey = {
            code: keyData.code || this.generateKey(),
            type: keyData.type,
            createdAt: Date.now(),
            expiresAt: keyData.expiresAt,
            createdBy: keyData.createdBy || 'admin',
            isActive: true
        };

        // Tính thời gian hết hạn
        switch (keyData.type) {
            case 'week':
                newKey.expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                newKey.expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000);
                break;
            case '3months':
                newKey.expiresAt = Date.now() + (90 * 24 * 60 * 60 * 1000);
                break;
            case 'forever':
                newKey.expiresAt = null;
                break;
        }

        keys.push(newKey);
        this.saveKeys(keys);
        return newKey;
    }

    removeKey(keyCode) {
        const keys = this.getKeys();
        const filtered = keys.filter(k => k.code !== keyCode);
        this.saveKeys(filtered);
        return true;
    }

    validateKey(keyCode) {
        const keys = this.getKeys();
        const key = keys.find(k => k.code === keyCode && k.isActive);
        
        if (!key) {
            return { valid: false, message: 'Key không tồn tại hoặc đã bị vô hiệu hóa' };
        }
        
        if (key.expiresAt && Date.now() > key.expiresAt) {
            return { valid: false, message: 'Key đã hết hạn' };
        }
        
        return { 
            valid: true, 
            isAdmin: key.type === 'admin',
            key: key
        };
    }

    generateKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 12; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Active Signals Management
    getActiveSignals() {
        try {
            const result = localStorage.getItem('quantum_active_signals');
            return result ? JSON.parse(result) : [];
        } catch (error) {
            console.error('Error getting active signals:', error);
            return [];
        }
    }

    saveActiveSignals(signals) {
        try {
            localStorage.setItem('quantum_active_signals', JSON.stringify(signals));
            return true;
        } catch (error) {
            console.error('Error saving active signals:', error);
            return false;
        }
    }

    addSignal(signal) {
        const signals = this.getActiveSignals();
        
        const newSignal = {
            id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            coin: signal.coin.toUpperCase(),
            direction: signal.direction,
            entry: parseFloat(signal.entry),
            tp: parseFloat(signal.tp),
            sl: parseFloat(signal.sl),
            rr: signal.rr || this.calculateRR(signal.entry, signal.tp, signal.sl, signal.direction),
            reason: signal.reason || 'AI Analysis - Confidence 100%',
            status: 'active',
            createdAt: Date.now(),
            createdBy: signal.createdBy || 'AI',
            hitEntry: false,
            currentPrice: parseFloat(signal.entry),
            profit: 0
        };
        
        signals.push(newSignal);
        this.saveActiveSignals(signals);
        
        return newSignal;
    }

    updateSignal(signalId, updates) {
        const signals = this.getActiveSignals();
        const index = signals.findIndex(s => s.id === signalId);
        
        if (index !== -1) {
            signals[index] = { ...signals[index], ...updates };
            this.saveActiveSignals(signals);
            return signals[index];
        }
        
        return null;
    }

    removeSignal(signalId) {
        const signals = this.getActiveSignals();
        const filtered = signals.filter(s => s.id !== signalId);
        this.saveActiveSignals(filtered);
        return true;
    }

    moveSignalToCompleted(signalId, result) {
        const signals = this.getActiveSignals();
        const signal = signals.find(s => s.id === signalId);
        
        if (!signal) return false;
        
        // Thêm vào completed signals
        const completed = this.getCompletedSignals();
        const completedSignal = {
            ...signal,
            result: result.status, // 'win' or 'lose'
            exitPrice: result.exitPrice,
            profit: result.profit,
            completedAt: Date.now(),
            rrAchieved: result.rrAchieved || 0
        };
        
        completed.push(completedSignal);
        this.saveCompletedSignals(completed);
        
        // Xóa khỏi active signals
        this.removeSignal(signalId);
        
        return completedSignal;
    }

    // Completed Signals Management
    getCompletedSignals() {
        try {
            const result = localStorage.getItem('quantum_completed_signals');
            return result ? JSON.parse(result) : [];
        } catch (error) {
            console.error('Error getting completed signals:', error);
            return [];
        }
    }

    saveCompletedSignals(signals) {
        try {
            localStorage.setItem('quantum_completed_signals', JSON.stringify(signals));
            return true;
        } catch (error) {
            console.error('Error saving completed signals:', error);
            return false;
        }
    }

    getCompletedSignalsToday() {
        const signals = this.getCompletedSignals();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return signals.filter(s => s.completedAt >= todayStart.getTime());
    }

    getCompletedSignalsThisWeek() {
        const signals = this.getCompletedSignals();
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        weekStart.setHours(0, 0, 0, 0);
        return signals.filter(s => s.completedAt >= weekStart.getTime());
    }

    // Tracked Coins Management
    getTrackedCoins() {
        try {
            const result = localStorage.getItem('quantum_tracked_coins');
            return result ? JSON.parse(result) : [];
        } catch (error) {
            console.error('Error getting tracked coins:', error);
            return [];
        }
    }

    saveTrackedCoins(coins) {
        try {
            localStorage.setItem('quantum_tracked_coins', JSON.stringify(coins));
            return true;
        } catch (error) {
            console.error('Error saving tracked coins:', error);
            return false;
        }
    }

    addTrackedCoin(signalId, coin) {
        const tracked = this.getTrackedCoins();
        tracked.push({
            signalId: signalId,
            coin: coin.toUpperCase(),
            addedAt: Date.now(),
            lastCheck: Date.now()
        });
        this.saveTrackedCoins(tracked);
        return true;
    }

    removeTrackedCoin(signalId) {
        const tracked = this.getTrackedCoins();
        const filtered = tracked.filter(t => t.signalId !== signalId);
        this.saveTrackedCoins(filtered);
        return true;
    }

    updateTrackedCoinCheck(signalId) {
        const tracked = this.getTrackedCoins();
        const coin = tracked.find(t => t.signalId === signalId);
        
        if (coin) {
            coin.lastCheck = Date.now();
            this.saveTrackedCoins(tracked);
        }
    }

    // Cooldown Management (coins không được phân tích trong 2 tiếng)
    getCooldownCoins() {
        try {
            const result = localStorage.getItem('quantum_cooldown_coins');
            return result ? JSON.parse(result) : [];
        } catch (error) {
            console.error('Error getting cooldown coins:', error);
            return [];
        }
    }

    saveCooldownCoins(coins) {
        try {
            localStorage.setItem('quantum_cooldown_coins', JSON.stringify(coins));
            return true;
        } catch (error) {
            console.error('Error saving cooldown coins:', error);
            return false;
        }
    }

    addCooldownCoin(coin) {
        const cooldowns = this.getCooldownCoins();
        const twoHours = 2 * 60 * 60 * 1000;
        
        cooldowns.push({
            coin: coin.toUpperCase(),
            until: Date.now() + twoHours
        });
        
        this.saveCooldownCoins(cooldowns);
        return true;
    }

    isInCooldown(coin) {
        const cooldowns = this.getCooldownCoins();
        const now = Date.now();
        
        // Lọc bỏ các cooldown đã hết hạn
        const activeCooldowns = cooldowns.filter(c => c.until > now);
        this.saveCooldownCoins(activeCooldowns);
        
        // Kiểm tra coin có trong cooldown không
        return activeCooldowns.some(c => c.coin === coin.toUpperCase());
    }

    // Statistics
    getTodayStats() {
        const completed = this.getCompletedSignalsToday();
        const active = this.getActiveSignals();
        
        const total = completed.length;
        const wins = completed.filter(s => s.result === 'win').length;
        const losses = completed.filter(s => s.result === 'lose').length;
        const winRate = total > 0 ? ((wins / total) * 100).toFixed(2) : 0;
        
        const totalProfit = completed.reduce((sum, s) => sum + (parseFloat(s.profit) || 0), 0);
        const avgProfit = total > 0 ? (totalProfit / total).toFixed(2) : 0;
        
        return {
            total,
            wins,
            losses,
            winRate,
            profit: totalProfit.toFixed(2),
            avgProfit,
            active: active.length
        };
    }

    getWeekStats() {
        const completed = this.getCompletedSignalsThisWeek();
        
        const total = completed.length;
        const wins = completed.filter(s => s.result === 'win').length;
        const losses = completed.filter(s => s.result === 'lose').length;
        const winRate = total > 0 ? ((wins / total) * 100).toFixed(2) : 0;
        
        const totalProfit = completed.reduce((sum, s) => sum + (parseFloat(s.profit) || 0), 0);
        const avgProfit = total > 0 ? (totalProfit / total).toFixed(2) : 0;
        
        return {
            total,
            wins,
            losses,
            winRate,
            profit: totalProfit.toFixed(2),
            avgProfit
        };
    }

    // Utility Functions
    calculateRR(entry, tp, sl, direction) {
        const entryNum = parseFloat(entry);
        const tpNum = parseFloat(tp);
        const slNum = parseFloat(sl);
        
        if (direction === 'LONG') {
            const risk = entryNum - slNum;
            const reward = tpNum - entryNum;
            return risk > 0 ? (reward / risk).toFixed(2) : '0.00';
        } else {
            const risk = slNum - entryNum;
            const reward = entryNum - tpNum;
            return risk > 0 ? (reward / risk).toFixed(2) : '0.00';
        }
    }

    calculateProfit(entry, exit, direction) {
        const entryNum = parseFloat(entry);
        const exitNum = parseFloat(exit);
        
        if (direction === 'LONG') {
            return ((exitNum - entryNum) / entryNum * 100).toFixed(2);
        } else {
            return ((entryNum - exitNum) / entryNum * 100).toFixed(2);
        }
    }

    // Daily Summary
    async generateDailySummary() {
        const stats = this.getTodayStats();
        const active = this.getActiveSignals();
        
        const summary = {
            date: new Date().toLocaleDateString('vi-VN'),
            totalSignals: stats.total,
            wins: stats.wins,
            losses: stats.losses,
            winRate: stats.winRate,
            profit: stats.profit,
            avgProfit: stats.avgProfit,
            activeSignals: active.length,
            generatedAt: Date.now()
        };
        
        // Lưu summary
        try {
            const summaries = this.getDailySummaries();
            summaries.push(summary);
            
            // Chỉ giữ lại 30 ngày gần nhất
            const last30Days = summaries.slice(-30);
            localStorage.setItem('quantum_daily_summaries', JSON.stringify(last30Days));
            
            console.log('Daily summary generated:', summary);
            return summary;
        } catch (error) {
            console.error('Error generating daily summary:', error);
            return null;
        }
    }

    getDailySummaries() {
        try {
            const result = localStorage.getItem('quantum_daily_summaries');
            return result ? JSON.parse(result) : [];
        } catch (error) {
            console.error('Error getting daily summaries:', error);
            return [];
        }
    }

    // Auto Analysis Schedule
    getAnalysisSchedule() {
        try {
            const result = localStorage.getItem('quantum_analysis_schedule');
            return result ? JSON.parse(result) : {
                lastAnalysis: 0,
                nextAnalysis: 0,
                running: false
            };
        } catch (error) {
            console.error('Error getting analysis schedule:', error);
            return {
                lastAnalysis: 0,
                nextAnalysis: 0,
                running: false
            };
        }
    }

    saveAnalysisSchedule(schedule) {
        try {
            localStorage.setItem('quantum_analysis_schedule', JSON.stringify(schedule));
            return true;
        } catch (error) {
            console.error('Error saving analysis schedule:', error);
            return false;
        }
    }

    // Popular Coins List
    getPopularCoins() {
        try {
            const result = localStorage.getItem('quantum_popular_coins');
            return result ? JSON.parse(result) : [
                'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT',
                'SOLUSDT', 'DOTUSDT', 'DOGEUSDT', 'AVAXUSDT', 'MATICUSDT'
            ];
        } catch (error) {
            console.error('Error getting popular coins:', error);
            return [
                'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT',
                'SOLUSDT', 'DOTUSDT', 'DOGEUSDT', 'AVAXUSDT', 'MATICUSDT'
            ];
        }
    }

    savePopularCoins(coins) {
        try {
            localStorage.setItem('quantum_popular_coins', JSON.stringify(coins));
            return true;
        } catch (error) {
            console.error('Error saving popular coins:', error);
            return false;
        }
    }
}

// Khởi tạo StorageManager toàn cục
window.StorageManager = new StorageManager();
