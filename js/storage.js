// Storage Manager - Fixed Version
class StorageManager {
    constructor() {
        this.initialized = false;
        this.init();
    }

    // Khởi tạo storage
    init() {
        if (this.initialized) return;
        
        try {
            console.log('🔄 Initializing storage...');
            
            // Kiểm tra và khởi tạo keys
            let keys = this.getKeys();
            if (!keys || keys.length === 0) {
                console.log('📝 Creating default admin key...');
                keys = [{
                    code: 'BangAdmin17',
                    type: 'admin',
                    createdAt: Date.now(),
                    expiresAt: null,
                    createdBy: 'system',
                    isActive: true
                }];
                this.saveKeys(keys);
            }

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
            console.log('🔑 Available keys:', keys);
            
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

    // Keys Management
    getKeys() {
        return this.getItem('access_keys') || [];
    }

    saveKeys(keys) {
        return this.setItem('access_keys', keys);
    }

    validateKey(keyCode) {
        try {
            console.log('🔐 Validating key:', keyCode);
            
            const keys = this.getKeys();
            console.log('📋 Available keys:', keys);
            
            if (!keys || !Array.isArray(keys)) {
                console.log('❌ Keys array is invalid');
                return { valid: false, message: 'Lỗi hệ thống keys' };
            }

            const key = keys.find(k => k.code === keyCode);
            
            if (!key) {
                console.log('❌ Key not found');
                return { valid: false, message: 'Key không tồn tại' };
            }
            
            console.log('✅ Key found:', key);
            
            if (key.isActive === false) {
                console.log('❌ Key is inactive');
                return { valid: false, message: 'Key đã bị vô hiệu hóa' };
            }
            
            if (key.expiresAt && Date.now() > key.expiresAt) {
                console.log('❌ Key expired');
                return { valid: false, message: 'Key đã hết hạn' };
            }
            
            console.log('🎉 Key validation successful');
            return { 
                valid: true, 
                isAdmin: key.type === 'admin',
                key: key
            };
            
        } catch (error) {
            console.error('💥 Validation error:', error);
            return { valid: false, message: 'Lỗi xác thực key' };
        }
    }

    addKey(keyData) {
        const keys = this.getKeys();
        const newKey = {
            code: keyData.code || this.generateKey(),
            type: keyData.type,
            createdAt: Date.now(),
            expiresAt: this.calculateExpiry(keyData.type),
            createdBy: keyData.createdBy || 'admin',
            isActive: true
        };

        keys.push(newKey);
        this.saveKeys(keys);
        return newKey;
    }

    calculateExpiry(type) {
        const now = Date.now();
        switch (type) {
            case 'week': return now + (7 * 24 * 60 * 60 * 1000);
            case 'month': return now + (30 * 24 * 60 * 60 * 1000);
            case '3months': return now + (90 * 24 * 60 * 60 * 1000);
            case 'forever': return null;
            default: return null;
        }
    }

    generateKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'QT-';
        for (let i = 0; i < 9; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
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
            until: Date.now() + (2 * 60 * 60 * 1000) // 2 hours
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
}

// Khởi tạo ngay lập tức
window.StorageManager = new StorageManager();
