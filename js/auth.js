// Authentication Manager - Fixed Version
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        console.log('🔐 Initializing AuthManager...');
        
        // Kiểm tra session đã lưu
        const savedUser = localStorage.getItem('quantum_current_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.isAuthenticated = true;
                console.log('✅ Found saved session:', this.currentUser);
                this.showMainApp();
            } catch (error) {
                console.error('❌ Error loading saved session:', error);
                this.showAuthScreen();
            }
        } else {
            this.showAuthScreen();
        }

        this.bindEvents();
    }

    bindEvents() {
        // Sự kiện đăng nhập
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.handleLogin();
        });

        // Sự kiện nhấn Enter
        document.getElementById('keyInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLogin();
            }
        });

        // Sự kiện đăng xuất
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        console.log('✅ Auth events bound successfully');
    }

    async handleLogin() {
        const keyInput = document.getElementById('keyInput');
        const key = keyInput.value.trim();
        const loginBtn = document.getElementById('loginBtn');

        if (!key) {
            this.showMessage('Vui lòng nhập key truy cập', 'error');
            return;
        }

        // Hiệu ứng loading
        loginBtn.disabled = true;
        const btnText = loginBtn.querySelector('.btn-text');
        btnText.textContent = 'Đang xác thực...';

        try {
            console.log('🔑 Validating key:', key);
            
            // Thêm delay để thấy hiệu ứng loading
            await new Promise(resolve => setTimeout(resolve, 800));

            // Gọi hàm validate key
            const validation = StorageManager.validateKey(key);
            console.log('📋 Validation result:', validation);

            if (validation.valid) {
                this.currentUser = {
                    key: key,
                    isAdmin: validation.isAdmin,
                    loginTime: Date.now(),
                    keyInfo: validation.key
                };
                
                this.isAuthenticated = true;
                
                // Lưu session
                localStorage.setItem('quantum_current_user', JSON.stringify(this.currentUser));
                
                console.log('✅ Login successful, user:', this.currentUser);
                this.showMainApp();
                this.showMessage('Đăng nhập thành công!', 'success');
                
            } else {
                console.log('❌ Login failed:', validation.message);
                this.showMessage(validation.message, 'error');
                // Clear input khi sai
                keyInput.value = '';
                keyInput.focus();
            }

        } catch (error) {
            console.error('💥 Login error:', error);
            this.showMessage('Lỗi hệ thống. Vui lòng thử lại.', 'error');
        } finally {
            // Khôi phục nút
            loginBtn.disabled = false;
            btnText.textContent = 'Đăng Nhập';
        }
    }

    handleLogout() {
        console.log('🚪 Logging out...');
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem('quantum_current_user');
        this.showAuthScreen();
        this.showMessage('Đã đăng xuất thành công', 'info');
    }

    showAuthScreen() {
        console.log('🖼️ Showing auth screen');
        document.getElementById('authScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
        
        // Reset input
        document.getElementById('keyInput').value = '';
        this.createParticles();
    }

    showMainApp() {
        console.log('🚀 Showing main app');
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        this.updateUserInfo();
        
        // Khởi tạo các component
        setTimeout(() => {
            if (typeof window.SignalManager !== 'undefined') {
                window.SignalManager.init();
            }
            
            if (this.currentUser?.isAdmin && typeof window.AdminManager !== 'undefined') {
                window.AdminManager.init();
            }
            
            if (typeof window.AnalysisManager !== 'undefined') {
                window.AnalysisManager.init();
            }
        }, 100);
    }

    updateUserInfo() {
        const userRoleElement = document.getElementById('userRole');
        if (userRoleElement && this.currentUser) {
            userRoleElement.textContent = this.currentUser.isAdmin ? 'Admin' : 'User';
        }

        // Hiển thị/ẩn tính năng admin
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(element => {
            element.style.display = this.currentUser?.isAdmin ? 'flex' : 'none';
        });

        console.log('👤 User info updated, isAdmin:', this.currentUser?.isAdmin);
    }

    createParticles() {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;

        particlesContainer.innerHTML = '';
        
        // Tạo 20 particle
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random size
            const size = Math.random() * 6 + 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Random position
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            
            // Random color
            const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            particle.style.background = color;
            particle.style.opacity = (Math.random() * 0.6 + 0.2).toString();
            
            // Random animation
            const duration = Math.random() * 20 + 10;
            const delay = Math.random() * 5;
            particle.style.animation = `float ${duration}s linear ${delay}s infinite`;
            
            particlesContainer.appendChild(particle);
        }
    }

    showMessage(message, type = 'info') {
        // Tạo toast container nếu chưa có
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;
        toast.style.cssText = `
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(20px);
            transform: translateX(400px);
            transition: all 0.3s ease;
            max-width: 400px;
            border-left: 4px solid ${this.getToastColor(type)};
            display: flex;
            align-items: center;
            gap: 12px;
        `;

        toast.innerHTML = `
            <span style="font-size: 18px;">${this.getMessageIcon(type)}</span>
            <span style="flex: 1;">${message}</span>
            <button class="toast-close" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 18px; padding: 4px; border-radius: 4px;">&times;</button>
        `;

        toastContainer.appendChild(toast);

        // Hiển thị toast
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Tự động ẩn sau 5 giây
        const autoRemove = setTimeout(() => {
            this.removeToast(toast);
        }, 5000);

        // Sự kiện đóng
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(autoRemove);
            this.removeToast(toast);
        });
    }

    removeToast(toast) {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    getMessageIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    getToastColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }

    // Kiểm tra session
    checkSession() {
        if (!this.isAuthenticated || !this.currentUser) {
            return false;
        }

        // Kiểm tra thời gian đăng nhập (24h)
        const loginTime = this.currentUser.loginTime;
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (now - loginTime > twentyFourHours) {
            this.showMessage('Phiên đăng nhập đã hết hạn', 'warning');
            this.handleLogout();
            return false;
        }

        return true;
    }

    // Debug function
    debugAuth() {
        console.log('🔍 Auth Debug Info:');
        console.log('Current User:', this.currentUser);
        console.log('Is Authenticated:', this.isAuthenticated);
        console.log('Storage Keys:', StorageManager.getKeys());
        console.log('Saved Session:', localStorage.getItem('quantum_current_user'));
    }
}

// Khởi tạo AuthManager
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Starting Quantum Trading Suite...');
    window.AuthManager = new AuthManager();
    
    // Debug helper
    window.debugAuth = () => {
        if (window.AuthManager) {
            window.AuthManager.debugAuth();
        }
    };
});
