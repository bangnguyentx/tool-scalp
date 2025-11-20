// Analysis Manager - Quản lý phân tích tự động
class AnalysisManager {
    constructor() {
        this.isRunning = false;
        this.analysisInterval = null;
        this.trackingInterval = null;
        this.popularCoins = [];
        this.init();
    }

    async init() {
        this.popularCoins = StorageManager.getPopularCoins();
        
        // Kiểm tra lịch trình phân tích
        const schedule = StorageManager.getAnalysisSchedule();
        
        if (schedule.running) {
            await this.startAutoAnalysis();
        }
        
        this.bindEvents();
    }

    bindEvents() {
        // Các sự kiện có thể thêm sau
    }

    // Bắt đầu phân tích tự động
    async startAutoAnalysis() {
        if (this.isRunning) return;

        this.isRunning = true;
        const schedule = StorageManager.getAnalysisSchedule();
        schedule.running = true;
        StorageManager.saveAnalysisSchedule(schedule);

        console.log('🔄 Bắt đầu phân tích tự động...');

        // Chạy phân tích ngay lập tức
        await this.runAnalysisCycle();

        // Thiết lập interval 15 phút
        this.analysisInterval = setInterval(async () => {
            await this.runAnalysisCycle();
        }, 15 * 60 * 1000); // 15 phút

        // Bắt đầu theo dõi các tín hiệu đang hoạt động (5 phút/lần)
        this.startSignalTracking();
    }

    // Dừng phân tích tự động
    stopAutoAnalysis() {
        if (!this.isRunning) return;

        this.isRunning = false;
        
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = null;
        }
        
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }

        const schedule = StorageManager.getAnalysisSchedule();
        schedule.running = false;
        StorageManager.saveAnalysisSchedule(schedule);

        console.log('⏹️ Đã dừng phân tích tự động');
    }

    // Chu kỳ phân tích
    async runAnalysisCycle() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Kiểm tra thời gian hoạt động (5h sáng đến 21h31 tối)
        if (currentHour < 5 || (currentHour === 21 && currentMinute > 31) || currentHour > 21) {
            console.log('⏰ Ngoài giờ phân tích (5:00 - 21:31)');
            return;
        }

        console.log(`🔍 Bắt đầu chu kỳ phân tích lúc ${now.toLocaleTimeString()}`);

        try {
            // Phân tích lần lượt từng coin
            for (const coin of this.popularCoins) {
                if (StorageManager.isInCooldown(coin)) {
                    console.log(`⏳ Coin ${coin} đang trong thời gian chờ`);
                    continue;
                }

                await this.analyzeCoin(coin);
                
                // Nghỉ giữa các lần phân tích để tránh rate limit
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // Cập nhật lịch trình
            const schedule = StorageManager.getAnalysisSchedule();
            schedule.lastAnalysis = Date.now();
            schedule.nextAnalysis = Date.now() + (15 * 60 * 1000);
            StorageManager.saveAnalysisSchedule(schedule);

            console.log('✅ Hoàn thành chu kỳ phân tích');

        } catch (error) {
            console.error('❌ Lỗi trong chu kỳ phân tích:', error);
        }
    }

    // Phân tích coin cụ thể
    async analyzeCoin(coin) {
        try {
            console.log(`📊 Đang phân tích ${coin}...`);

            // Lấy dữ liệu từ Binance (giả lập)
            const marketData = await this.fetchMarketData(coin);
            if (!marketData) return;

            // Phân tích kỹ thuật (giả lập)
            const analysis = this.performTechnicalAnalysis(marketData);
            
            // Chỉ gửi tín hiệu nếu confidence 100%
            if (analysis.confidence === 100) {
                await this.generateSignal(coin, analysis, marketData);
                
                // Thêm coin vào danh sách chờ 2 tiếng
                StorageManager.addCooldownCoin(coin);
                
                console.log(`🎯 Đã gửi tín hiệu ${coin} với confidence 100%`);
            } else {
                console.log(`📉 ${coin} - Confidence: ${analysis.confidence}% (chưa đủ tiêu chuẩn)`);
            }

        } catch (error) {
            console.error(`❌ Lỗi phân tích ${coin}:`, error);
        }
    }

    // Lấy dữ liệu thị trường (giả lập)
    async fetchMarketData(coin) {
        try {
            // Giả lập dữ liệu từ Binance API
            // Trong thực tế, bạn sẽ gọi API thật ở đây
            const mockData = {
                symbol: coin,
                price: this.generateMockPrice(coin),
                high24h: 0,
                low24h: 0,
                volume: 0,
                priceChange: 0,
                priceChangePercent: 0,
                timestamp: Date.now()
            };

            // Thêm dữ liệu giả lập
            const basePrice = mockData.price;
            mockData.high24h = basePrice * (1 + Math.random() * 0.1);
            mockData.low24h = basePrice * (1 - Math.random() * 0.1);
            mockData.volume = Math.random() * 1000000;
            mockData.priceChange = basePrice * (Math.random() * 0.1 - 0.05);
            mockData.priceChangePercent = (mockData.priceChange / basePrice) * 100;

            return mockData;

        } catch (error) {
            console.error(`❌ Lỗi lấy dữ liệu ${coin}:`, error);
            return null;
        }
    }

    // Tạo giá mock dựa trên coin
    generateMockPrice(coin) {
        const basePrices = {
            'BTCUSDT': 45000 + Math.random() * 10000,
            'ETHUSDT': 2500 + Math.random() * 1000,
            'BNBUSDT': 300 + Math.random() * 100,
            'ADAUSDT': 0.4 + Math.random() * 0.3,
            'XRPUSDT': 0.5 + Math.random() * 0.2,
            'SOLUSDT': 100 + Math.random() * 50,
            'DOTUSDT': 6 + Math.random() * 3,
            'DOGEUSDT': 0.08 + Math.random() * 0.04,
            'AVAXUSDT': 30 + Math.random() * 15,
            'MATICUSDT': 0.8 + Math.random() * 0.4
        };
        
        return basePrices[coin] || (10 + Math.random() * 10);
    }

    // Phân tích kỹ thuật (giả lập)
    performTechnicalAnalysis(marketData) {
        // Giả lập phân tích phức tạp
        // Trong thực tế, bạn sẽ tích hợp các indicator thật
        
        const randomFactor = Math.random();
        let direction, confidence;

        if (randomFactor > 0.6) {
            direction = 'LONG';
            confidence = Math.floor(80 + Math.random() * 21); // 80-100%
        } else if (randomFactor < 0.4) {
            direction = 'SHORT';
            confidence = Math.floor(80 + Math.random() * 21); // 80-100%
        } else {
            direction = Math.random() > 0.5 ? 'LONG' : 'SHORT';
            confidence = Math.floor(50 + Math.random() * 30); // 50-80%
        }

        // Đôi khi tạo confidence 100% để demo
        if (Math.random() > 0.7) {
            confidence = 100;
        }

        // Tính toán các mức giá
        const currentPrice = marketData.price;
        let entry, tp, sl;

        if (direction === 'LONG') {
            entry = currentPrice * (1 - 0.002); // Vào lệnh thấp hơn 0.2%
            sl = currentPrice * (1 - 0.015);    // SL 1.5%
            tp = currentPrice * (1 + 0.03);     // TP 3%
        } else {
            entry = currentPrice * (1 + 0.002); // Vào lệnh cao hơn 0.2%
            sl = currentPrice * (1 + 0.015);    // SL 1.5%
            tp = currentPrice * (1 - 0.03);     // TP 3%
        }

        return {
            direction,
            confidence,
            entry: entry.toFixed(4),
            tp: tp.toFixed(4),
            sl: sl.toFixed(4),
            currentPrice: currentPrice.toFixed(4),
            reason: this.generateReason(direction, confidence)
        };
    }

    // Tạo lý do tín hiệu
    generateReason(direction, confidence) {
        const reasons = {
            LONG: [
                'Breakout kháng cự mạnh',
                'Volume tăng đột biến',
                'Mô hình nến đảo chiều tăng',
                'Fibonacci retracement hoàn hảo',
                'RSI oversold và bật lên'
            ],
            SHORT: [
                'Breakdown hỗ trợ quan trọng',
                'Khối lượng bán áp đảo',
                'Mô hình nến đảo chiều giảm',
                'Fibonacci extension đạt target',
                'RSI overbought và điều chỉnh'
            ]
        };

        const baseReasons = reasons[direction] || reasons.LONG;
        const randomReason = baseReasons[Math.floor(Math.random() * baseReasons.length)];
        
        return `${randomReason} - Confidence ${confidence}%`;
    }

    // Tạo tín hiệu giao dịch
    async generateSignal(coin, analysis, marketData) {
        const signal = {
            coin: coin,
            direction: analysis.direction,
            entry: analysis.entry,
            tp: analysis.tp,
            sl: analysis.sl,
            rr: StorageManager.calculateRR(analysis.entry, analysis.tp, analysis.sl, analysis.direction),
            reason: analysis.reason,
            createdBy: 'AI'
        };

        // Lưu tín hiệu
        const newSignal = StorageManager.addSignal(signal);
        
        // Thêm vào danh sách theo dõi
        StorageManager.addTrackedCoin(newSignal.id, coin);

        // Cập nhật UI nếu đang mở
        if (typeof window.SignalManager !== 'undefined') {
            window.SignalManager.refreshSignals();
        }

        return newSignal;
    }

    // Bắt đầu theo dõi tín hiệu
    startSignalTracking() {
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
        }

        this.trackingInterval = setInterval(async () => {
            await this.trackActiveSignals();
        }, 5 * 60 * 1000); // 5 phút

        // Chạy ngay lập tức
        this.trackActiveSignals();
    }

    // Theo dõi các tín hiệu đang hoạt động
    async trackActiveSignals() {
        const activeSignals = StorageManager.getActiveSignals();
        const trackedCoins = StorageManager.getTrackedCoins();

        console.log(`🔍 Đang theo dõi ${activeSignals.length} tín hiệu...`);

        for (const signal of activeSignals) {
            try {
                await this.checkSignalStatus(signal);
                // Nghỉ giữa các lần kiểm tra
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`❌ Lỗi theo dõi signal ${signal.id}:`, error);
            }
        }

        // Cập nhật thời gian kiểm tra
        for (const tracked of trackedCoins) {
            StorageManager.updateTrackedCoinCheck(tracked.signalId);
        }
    }

    // Kiểm tra trạng thái tín hiệu
    async checkSignalStatus(signal) {
        const currentMarketData = await this.fetchMarketData(signal.coin);
        if (!currentMarketData) return;

        const currentPrice = parseFloat(currentMarketData.price);
        const entryPrice = parseFloat(signal.entry);
        const tpPrice = parseFloat(signal.tp);
        const slPrice = parseFloat(signal.sl);

        // Tính toán lợi nhuận hiện tại
        let currentProfit = 0;
        if (signal.direction === 'LONG') {
            currentProfit = ((currentPrice - entryPrice) / entryPrice) * 100;
        } else {
            currentProfit = ((entryPrice - currentPrice) / entryPrice) * 100;
        }

        // Cập nhật giá hiện tại và lợi nhuận
        StorageManager.updateSignal(signal.id, {
            currentPrice: currentPrice,
            profit: currentProfit.toFixed(2)
        });

        // Kiểm tra điều kiện TP/SL
        let result = null;

        if (signal.direction === 'LONG') {
            if (currentPrice >= tpPrice) {
                result = {
                    status: 'win',
                    exitPrice: tpPrice,
                    profit: ((tpPrice - entryPrice) / entryPrice * 100).toFixed(2),
                    rrAchieved: parseFloat(signal.rr)
                };
            } else if (currentPrice <= slPrice) {
                result = {
                    status: 'lose',
                    exitPrice: slPrice,
                    profit: ((slPrice - entryPrice) / entryPrice * 100).toFixed(2),
                    rrAchieved: 0
                };
            }
        } else {
            if (currentPrice <= tpPrice) {
                result = {
                    status: 'win',
                    exitPrice: tpPrice,
                    profit: ((entryPrice - tpPrice) / entryPrice * 100).toFixed(2),
                    rrAchieved: parseFloat(signal.rr)
                };
            } else if (currentPrice >= slPrice) {
                result = {
                    status: 'lose',
                    exitPrice: slPrice,
                    profit: ((entryPrice - slPrice) / entryPrice * 100).toFixed(2),
                    rrAchieved: 0
                };
            }
        }

        // Nếu có kết quả, chuyển sang completed
        if (result) {
            const completedSignal = StorageManager.moveSignalToCompleted(signal.id, result);
            StorageManager.removeTrackedCoin(signal.id);
            
            console.log(`🎯 ${signal.coin} - ${result.status.toUpperCase()}! Lợi nhuận: ${result.profit}%`);

            // Cập nhật UI
            if (typeof window.SignalManager !== 'undefined') {
                window.SignalManager.refreshSignals();
            }
        }
    }

    // Kiểm tra và tạo báo cáo cuối ngày
    checkDailyReport() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Kiểm tra 23h00
        if (currentHour === 23 && currentMinute === 0) {
            this.generateDailyReport();
        }
    }

    // Tạo báo cáo hàng ngày
    async generateDailyReport() {
        console.log('📊 Đang tạo báo cáo cuối ngày...');
        
        const summary = await StorageManager.generateDailySummary();
        
        if (summary) {
            console.log('✅ Đã tạo báo cáo cuối ngày:', summary);
            
            // Có thể gửi thông báo hoặc lưu vào database ở đây
            if (typeof window.AuthManager !== 'undefined') {
                window.AuthManager.showMessage(
                    `📊 Báo cáo ngày ${summary.date}: ${summary.totalSignals} tín hiệu, ${summary.winRate}% thắng, Lợi nhuận: ${summary.profit}%`,
                    'info'
                );
            }
        }
    }

    // Lấy trạng thái hệ thống
    getSystemStatus() {
        const schedule = StorageManager.getAnalysisSchedule();
        const stats = StorageManager.getTodayStats();
        
        return {
            isRunning: this.isRunning,
            lastAnalysis: schedule.lastAnalysis,
            nextAnalysis: schedule.nextAnalysis,
            activeSignals: stats.active,
            todayStats: stats
        };
    }
}

// Khởi tạo AnalysisManager
document.addEventListener('DOMContentLoaded', () => {
    window.AnalysisManager = new AnalysisManager();
});
