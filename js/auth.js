// Authentication Manager - Simplified Version
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        console.log('🔐 Initializing AuthManager...');
        
        // Đợi StorageManager khởi tạo
        setTimeout(() => {
            const savedUser = localStorage.getItem('quantum_current_user');
            if (savedUser) {
                try {
                    this.currentUser = JSON.parse(savedUser);
                    this.isAuthenticated = true;
                    console.log('✅ Found saved session');
                    this.showMainApp();
                } catch (error) {
                    console.error('❌ Error loading saved session:', error);
                    this.showAuthScreen();
                }
            } else {
                this.showAuthScreen();
            }
        }, 100);

        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.handleLogin();
        });

        document.getElementById('keyInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });
    }

    handleLogin() {
        const keyInput = document.getElementById('keyInput');
        const key = keyInput.value.trim();
        const loginBtn = document.getElementById('loginBtn');

        if (!key) {
            this.showMessage('Vui lòng nhập key truy cập', 'error');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.querySelector('.btn-text').textContent = 'Đang xác thực...';

        // Dùng setTimeout để tránh block UI
        setTimeout(() => {
            try {
                console.log('🔐 Validating key:', key);
                
                const validation = StorageManager.validateKey(key);
                console.log('📋 Validation result:', validation);

                if (validation.valid) {
                    this.currentUser = {
                        key: key,
                        isAdmin: validation.isAdmin,
                        loginTime: Date.now()
                    };
                    
                    this.isAuthenticated = true;
                    localStorage.setItem('quantum_current_user', JSON.stringify(this.currentUser));
                    
                    this.showMainApp();
                    this.showMessage('Đăng nhập thành công!', 'success');
                    
                } else {
                    this.showMessage(validation.message, 'error');
                    keyInput.value = '';
                    keyInput.focus();
                }

            } catch (error) {
                console.error('💥 Login error:', error);
                this.showMessage('Lỗi hệ thống. Vui lòng thử lại.', 'error');
            } finally {
                loginBtn.disabled = false;
                loginBtn.querySelector('.btn-text').textContent = 'Đăng Nhập';
            }
        }, 500);
    }

    handleLogout() {
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem('quantum_current_user');
        this.showAuthScreen();
        this.showMessage('Đã đăng xuất thành công', 'info');
    }

    showAuthScreen() {
        document.getElementById('authScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('keyInput').value = '';
    }

    showMainApp() {
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        this.updateUserInfo();
    }

    updateUserInfo() {
        const userRoleElement = document.getElementById('userRole');
        if (userRoleElement) {
            userRoleElement.textContent = this.currentUser.isAdmin ? 'Admin' : 'User';
        }

        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(element => {
            element.style.display = this.currentUser.isAdmin ? 'flex' : 'none';
        });
    }

    showMessage(message, type = 'info') {
        // Tạo toast đơn giản
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            document.body.removeChild(toast);
        }, 3000);
    }
}

// Khởi tạo
document.addEventListener('DOMContentLoaded', () => {
    window.AuthManager = new AuthManager();
});
