// Main Application - Điều phối toàn bộ ứng dụng
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

            // Khởi tạo AuthManager (luôn chạy đầu tiên)
            if (typeof AuthManager !== 'undefined') {
                this.components.auth = window.AuthManager;
            }

            // Chờ cho đến khi xác thực hoàn tất
            await this.waitForAuthentication();

            // Khởi tạo các component khác sau khi xác thực
            if (this.components.auth?.isAuthenticated) {
                // Signal Manager
                if (typeof SignalManager !== 'undefined') {
                    this.components.signals = window.SignalManager;
                }

                // Analysis Manager (luôn chạy ở background)
                if (typeof AnalysisManager !== 'undefined') {
                    this.components.analysis = window.AnalysisManager;
                }

                // Admin Manager (chỉ cho admin)
                if (this.components.auth.currentUser?.isAdmin && typeof AdminManager !== 'undefined') {
                    this.components.admin = window.AdminManager;
                }
            }

        } catch (error) {
            console.error('❌ Lỗi khởi tạo components:', error);
            this.showFatalError('Lỗi khởi tạo hệ thống. Vui lòng tải lại trang.');
        }
    }

    waitForAuthentication() {
        return new Promise((resolve) => {
            const checkAuth = () => {
                if (typeof AuthManager !== 'undefined') {
                    resolve();
                } else {
                    setTimeout(checkAuth, 100);
                }
            };
            checkAuth();
        });
    }

    setupGlobalEvents() {
        // Xử lý phím tắt
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Xử lý visibility change (khi tab được active/inactive)
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Xử lý beforeunload (khi đóng tab)
        window.addEventListener('beforeunload', (e) => {
            this.handleBeforeUnload(e);
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
        // Chỉ xử lý khi không có input nào đang focus
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
            case '3':
                if (this.components.auth?.currentUser?.isAdmin && this.components.signals) {
                    this.components.signals.switchPage('permissions');
                }
                break;
        }
    }

    handleVisibilityChange() {
        if (!document.hidden) {
            // Tab được active - refresh dữ liệu
            this.refreshAllData();
            
            // Kiểm tra session
            if (this.components.auth) {
                this.components.auth.checkSession();
            }
        }
    }

    handleBeforeUnload(e) {
        // Có thể lưu trạng thái hoặc hiển thị cảnh báo ở đây
        const shouldWarn = this.components.analysis?.isRunning;
        
        if (shouldWarn) {
            e.preventDefault();
            e.returnValue = 'Hệ thống phân tích đang chạy. Bạn có chắc muốn rời đi?';
            return e.returnValue;
        }
    }

    handleOnlineStatus() {
        console.log('🌐 Đã kết nối lại internet');
        if (this.components.auth) {
            this.components.auth.showMessage('Đã kết nối lại internet', 'success');
        }
        this.refreshAllData();
    }

    handleOfflineStatus() {
        console.log('📵 Mất kết nối internet');
        if (this.components.auth) {
            this.components.auth.showMessage('Mất kết nối internet', 'warning');
        }
    }

    handleWindowResize() {
        // Xử lý responsive behavior
        const sidebar = document.getElementById('sidebar');
        if (window.innerWidth < 768) {
            sidebar.classList.remove('open');
        }
    }

    startBackgroundServices() {
        // Kiểm tra báo cáo hàng ngày mỗi phút
        setInterval(() => {
            if (this.components.analysis) {
                this.components.analysis.checkDailyReport();
            }
        }, 60000);

        // Auto-save mỗi 5 phút
        setInterval(() => {
            this.autoSave();
        }, 5 * 60 * 1000);

        // Update system status mỗi phút
        setInterval(() => {
            this.updateSystemStatus();
        }, 60000);
    }

    refreshAllData() {
        if (this.components.signals) {
            this.components.signals.refreshSignals();
        }
        
        if (this.components.admin && this.components.auth?.currentUser?.isAdmin) {
            this.components.admin.loadKeysList();
            this.components.admin.loadAdminsList();
        }
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            modal.classList.remove('show');
        });
    }

    autoSave() {
        // Có thể thêm logic auto-save phức tạp hơn ở đây
        console.log('💾 Auto-saving system state...');
        
        // Lưu lịch sử phiên làm việc
        const sessionData = {
            lastActive: Date.now(),
            components: Object.keys(this.components)
        };
        
        try {
            localStorage.setItem('quantum_session_data', JSON.stringify(sessionData));
        } catch (error) {
            console.error('Auto-save error:', error);
        }
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

    showFatalError(message) {
        // Hiển thị màn hình lỗi nghiêm trọng
        const errorScreen = document.createElement('div');
        errorScreen.className = 'fatal-error-screen';
        errorScreen.innerHTML = `
            <div class="error-container">
                <div class="error-icon">💥</div>
                <h1>Lỗi Hệ Thống</h1>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn-primary">Tải Lại Trang</button>
                <button onclick="QuantumTradingApp.resetSystem()" class="btn-secondary">Reset Hệ Thống</button>
            </div>
        `;

        // Thêm styles
        if (!document.querySelector('#error-styles')) {
            const styles = document.createElement('style');
            styles.id = 'error-styles';
            styles.textContent = `
                .fatal-error-screen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #0f172a, #1e293b);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                }
                .error-container {
                    text-align: center;
                    background: var(--card-bg);
                    padding: 40px;
                    border-radius: 20px;
                    border: 1px solid var(--border);
                    backdrop-filter: blur(20px);
                    max-width: 500px;
                    width: 90%;
                }
                .error-icon {
                    font-size: 4rem;
                    margin-bottom: 20px;
                }
                .error-container h1 {
                    color: var(--danger);
                    margin-bottom: 15px;
                }
                .error-container p {
                    color: var(--text-secondary);
                    margin-bottom: 25px;
                    line-height: 1.5;
                }
                .error-container .btn-primary {
                    margin-right: 10px;
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.innerHTML = '';
        document.body.appendChild(errorScreen);
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

    // System reset (chỉ dùng trong trường hợp khẩn cấp)
    static resetSystem() {
        if (confirm('CẢNH BÁO: Thao tác này sẽ xóa TẤT CẢ dữ liệu và reset hệ thống. Tiếp tục?')) {
            localStorage.clear();
            location.reload();
        }
    }

    // Get system information
    getSystemInfo() {
        const analysisStatus = this.components.analysis?.getSystemStatus();
        const storageInfo = {
            activeSignals: StorageManager.getActiveSignals().length,
            completedSignals: StorageManager.getCompletedSignals().length,
            totalKeys: StorageManager.getKeys().length,
            trackedCoins: StorageManager.getTrackedCoins().length
        };

        return {
            version: '1.0.0',
            components: Object.keys(this.components),
            analysis: analysisStatus,
            storage: storageInfo,
            user: this.components.auth?.currentUser,
            timestamp: Date.now()
        };
    }
}

// Khởi động ứng dụng khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Thêm loading screen
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'app-loading';
    loadingScreen.innerHTML = `
        <div class="loading-content">
            <div class="loading-logo">
                <div class="logo-cube">
                    <div class="cube-face front">Q</div>
                    <div class="cube-face back">T</div>
                    <div class="cube-face right">S</div>
                    <div class="cube-face left">A</div>
                    <div class="cube-face top">I</div>
                    <div class="cube-face bottom">✓</div>
                </div>
            </div>
            <h2>Quantum Trading Suite</h2>
            <p>Đang khởi động hệ thống...</p>
            <div class="loading-spinner"></div>
        </div>
    `;

    // Thêm loading styles
    const loadingStyles = document.createElement('style');
    loadingStyles.textContent = `
        #app-loading {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #0f172a, #1e293b);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }
        .loading-content {
            text-align: center;
            color: white;
        }
        .loading-logo {
            perspective: 1000px;
            margin-bottom: 30px;
        }
        .logo-cube {
            width: 80px;
            height: 80px;
            position: relative;
            transform-style: preserve-3d;
            animation: rotate3d 3s infinite linear;
            margin: 0 auto;
        }
        .cube-face {
            position: absolute;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, #3b82f6, #8b5cf6);
            border: 2px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 20px;
            font-weight: bold;
            color: white;
            border-radius: 8px;
        }
        .cube-face.front { transform: translateZ(40px); }
        .cube-face.back { transform: translateZ(-40px) rotateY(180deg); }
        .cube-face.right { transform: translateX(40px) rotateY(90deg); }
        .cube-face.left { transform: translateX(-40px) rotateY(-90deg); }
        .cube-face.top { transform: translateY(-40px) rotateX(90deg); }
        .cube-face.bottom { transform: translateY(40px) rotateX(-90deg); }
        .loading-content h2 {
            margin-bottom: 10px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .loading-content p {
            color: #94a3b8;
            margin-bottom: 20px;
        }
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(59, 130, 246, 0.3);
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(loadingStyles);
    document.body.appendChild(loadingScreen);

    // Khởi động ứng dụng
    setTimeout(() => {
        window.QuantumApp = new QuantumTradingApp();
        
        // Ẩn loading screen sau khi khởi động xong
        setTimeout(() => {
            const loadingScreen = document.getElementById('app-loading');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                loadingScreen.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    loadingScreen.remove();
                }, 500);
            }
        }, 1000);
    }, 1500);
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    if (window.QuantumApp) {
        window.QuantumApp.showFatalError('Đã xảy ra lỗi không mong muốn. Vui lòng tải lại trang.');
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});
