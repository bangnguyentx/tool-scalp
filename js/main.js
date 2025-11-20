// Main Application - Simplified (No Auth, No Admin)
class QuantumTradingApp {
    constructor() {
        this.components = {};
        this.init();
    }

    async init() {
        console.log('🚀 Khởi động Quantum Trading Suite...');
        
        // Khởi tạo các component
        await this.initializeComponents();
        
        // Thiết lập các sự kiện toàn cục
        this.setupGlobalEvents();
        
        // Kiểm tra và khởi động các dịch vụ nền
        this.startBackgroundServices();
        
        console.log('✅ Quantum Trading Suite đã sẵn sàng!');
    }

    async initializeComponents() {
        try {
            // Đảm bảo StorageManager đã sẵn sàng
            if (typeof StorageManager === 'undefined') {
                throw new Error('StorageManager chưa được khởi tạo');
            }

            // Khởi tạo Signal Manager
            if (typeof SignalManager !== 'undefined') {
                this.components.signals = window.SignalManager;
                this.components.signals.init();
            }

            // Khởi tạo Analysis Manager
            if (typeof AnalysisManager !== 'undefined') {
                this.components.analysis = window.AnalysisManager;
                this.components.analysis.init();
            }

        } catch (error) {
            console.error('❌ Lỗi khởi tạo components:', error);
        }
    }

    setupGlobalEvents() {
        // Xử lý phím tắt
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Xử lý visibility change
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Xử lý online/offline
        window.addEventListener('online', () => {
            this.handleOnlineStatus();
        });

        window.addEventListener('offline', () => {
            this.handleOfflineStatus();
        });

        // Xử lý resize window
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
    }

    handleKeyboardShortcuts(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (e.key) {
            case 'F5':
                e.preventDefault();
                this.refreshAllData();
                break;
            case 'Escape':
                this.closeAllModals();
                break;
            case '1':
                if (this.components.signals) {
                    this.components.signals.switchPage('signals');
                }
                break;
            case '2':
                if (this.components.signals) {
                    this.components.signals.switchPage('statistics');
                }
                break;
        }
    }

    handleVisibilityChange() {
        if (!document.hidden) {
            this.refreshAllData();
        }
    }

    handleOnlineStatus() {
        console.log('🌐 Đã kết nối lại internet');
        this.refreshAllData();
    }

    handleOfflineStatus() {
        console.log('📵 Mất kết nối internet');
    }

    handleWindowResize() {
        const sidebar = document.getElementById('sidebar');
        if (window.innerWidth < 768) {
            sidebar.classList.remove('open');
        }
    }

    startBackgroundServices() {
        // Bot chạy trong trình duyệt user
        console.log('🤖 Khởi động bot phân tích trong trình duyệt...');
        
        // Kiểm tra và chạy bot phân tích
        if (this.components.analysis && !this.components.analysis.isRunning) {
            this.components.analysis.startAutoAnalysis();
        }

        // Các services khác...
        setInterval(() => {
            if (this.components.analysis) {
                this.components.analysis.checkDailyReport();
            }
        }, 60000);

        setInterval(() => {
            this.autoSave();
        }, 5 * 60 * 1000);

        setInterval(() => {
            this.updateSystemStatus();
        }, 60000);
    }

    refreshAllData() {
        if (this.components.signals) {
            this.components.signals.refreshSignals();
        }
    }

    closeAllModals() {
        // Không còn modal nào cần đóng
    }

    autoSave() {
        console.log('💾 Auto-saving system state...');
    }

    updateSystemStatus() {
        const statusIndicator = document.querySelector('.status-indicator');
        if (!statusIndicator) return;

        const statusDot = statusIndicator.querySelector('.status-dot');
        const statusText = statusIndicator.querySelector('.status-text');

        if (this.components.analysis?.isRunning) {
            statusDot.className = 'status-dot active';
            statusText.textContent = 'Đang quét thị trường...';
        } else {
            statusDot.className = 'status-dot inactive';
            statusText.textContent = 'Đã dừng quét';
        }
    }

    // Utility methods
    static formatNumber(number, decimals = 2) {
        return parseFloat(number).toFixed(decimals);
    }

    static formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8
        }).format(price);
    }

    static formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString('vi-VN');
    }

    static formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString('vi-VN');
    }
}

// Khởi động ứng dụng khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Hiển thị main app ngay lập tức
    document.getElementById('mainApp').style.display = 'block';
    
    // Khởi động ứng dụng
    window.QuantumApp = new QuantumTradingApp();
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
