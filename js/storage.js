// Storage Manager - Simplified (No Auth)
class StorageManager {
    constructor() {
        this.initialized = false;
        this.init();
    }

    init() {
        if (this.initialized) return;
        
        try {
            console.log('🔄 Initializing storage...');
            
            // Không cần khởi tạo keys nữa

            // Khởi tạo các collections khác
            const collections = [
                'active_signals', 
                'completed_signals', 
                'tracked_coins', 
                'cooldown_coins',
                'daily_summaries',
                'analysis_schedule',
                'popular_coins'
            ];

            collections.forEach(collection => {
                if (!this.getItem(collection)) {
                    this.setItem(collection, collection === 'popular_coins' ? [
                        'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT',
                        'SOLUSDT', 'DOTUSDT', 'DOGEUSDT', 'AVAXUSDT', 'MATICUSDT'
                    ] : []);
                }
            });

            this.initialized = true;
            console.log('✅ Storage initialized successfully');
            
        } catch (error) {
            console.error('❌ Storage init error:', error);
        }
    }

    // Helper methods
    getItem(key) {
        try {
            const result = localStorage.getItem(`quantum_${key}`);
            return result ? JSON.parse(result) : null;
        } catch (error) {
            console.error(`Error getting ${key}:`, error);
            return null;
        }
    }

    setItem(key, value) {
        try {
            localStorage.setItem(`quantum_${key}`, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error saving ${key}:`, error);
            return false;
        }
    }

    // Signals Management
    getActiveSignals() {
        return this.getItem('active_signals') || [];
    }

    saveActiveSignals(signals) {
        return this.setItem('active_signals', signals);
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
            rr: this.calculateRR(signal.entry, signal.tp, signal.sl, signal.direction),
            reason: signal.reason || 'AI Analysis',
            status: 'active',
            createdAt: Date.now(),
            createdBy: signal.createdBy || 'AI',
            currentPrice: parseFloat(signal.entry),
            profit: 0
        };
        
        signals.push(newSignal);
        this.saveActiveSignals(signals);
        return newSignal;
    }

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

    // Các phương thức khác giữ nguyên...
    getCompletedSignals() {
        return this.getItem('completed_signals') || [];
    }

    saveCompletedSignals(signals) {
        return this.setItem('completed_signals', signals);
    }

    getCompletedSignalsToday() {
        const signals = this.getCompletedSignals();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return signals.filter(s => s.completedAt >= todayStart.getTime());
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
        
        const completed = this.getCompletedSignals();
        completed.push({
            ...signal,
            result: result.status,
            exitPrice: result.exitPrice,
            profit: result.profit,
            completedAt: Date.now()
        });
        
        this.saveCompletedSignals(completed);
        this.removeSignal(signalId);
        return true;
    }

    getTrackedCoins() {
        return this.getItem('tracked_coins') || [];
    }

    saveTrackedCoins(coins) {
        return this.setItem('tracked_coins', coins);
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

    getCooldownCoins() {
        return this.getItem('cooldown_coins') || [];
    }

    saveCooldownCoins(coins) {
        return this.setItem('cooldown_coins', coins);
    }

    addCooldownCoin(coin) {
        const cooldowns = this.getCooldownCoins();
        cooldowns.push({
            coin: coin.toUpperCase(),
            until: Date.now() + (2 * 60 * 60 * 1000)
        });
        this.saveCooldownCoins(cooldowns);
        return true;
    }

    isInCooldown(coin) {
        const cooldowns = this.getCooldownCoins();
        const now = Date.now();
        const activeCooldowns = cooldowns.filter(c => c.until > now);
        this.saveCooldownCoins(activeCooldowns);
        return activeCooldowns.some(c => c.coin === coin.toUpperCase());
    }

    getTodayStats() {
        const completed = this.getCompletedSignalsToday();
        const active = this.getActiveSignals();
        
        const total = completed.length;
        const wins = completed.filter(s => s.result === 'win').length;
        const losses = completed.filter(s => s.result === 'lose').length;
        const winRate = total > 0 ? ((wins / total) * 100).toFixed(2) : 0;
        const totalProfit = completed.reduce((sum, s) => sum + (parseFloat(s.profit) || 0), 0);
        
        return {
            total,
            wins,
            losses,
            winRate,
            profit: totalProfit.toFixed(2),
            active: active.length
        };
    }

    getWeekStats() {
        const completed = this.getCompletedSignals();
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        weekStart.setHours(0, 0, 0, 0);
        const weekSignals = completed.filter(s => s.completedAt >= weekStart.getTime());
        
        const total = weekSignals.length;
        const wins = weekSignals.filter(s => s.result === 'win').length;
        const losses = weekSignals.filter(s => s.result === 'lose').length;
        const winRate = total > 0 ? ((wins / total) * 100).toFixed(2) : 0;
        const totalProfit = weekSignals.reduce((sum, s) => sum + (parseFloat(s.profit) || 0), 0);
        
        return {
            total,
            wins,
            losses,
            winRate,
            profit: totalProfit.toFixed(2)
        };
    }

    getDailySummaries() {
        return this.getItem('daily_summaries') || [];
    }

    getAnalysisSchedule() {
        return this.getItem('analysis_schedule') || {
            lastAnalysis: 0,
            nextAnalysis: 0,
            running: false
        };
    }

    saveAnalysisSchedule(schedule) {
        return this.setItem('analysis_schedule', schedule);
    }

    getPopularCoins() {
        return this.getItem('popular_coins') || [
            'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT',
            'SOLUSDT', 'DOTUSDT', 'DOGEUSDT', 'AVAXUSDT', 'MATICUSDT'
        ];
    }
}

// Khởi tạo ngay lập tức
window.StorageManager = new StorageManager();
