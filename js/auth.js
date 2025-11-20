// Authentication Manager
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        const savedUser = localStorage.getItem('quantum_current_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.isAuthenticated = true;
            this.showMainApp();
        } else {
            this.showAuthScreen();
        }

        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.handleLogin();
        });

        document.getElementById('keyInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLogin();
            }
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });
    }

    async handleLogin() {
        const keyInput = document.getElementById('keyInput');
        const key = keyInput.value.trim();
        const loginBtn = document.getElementById('loginBtn');

        if (!key) {
            this.showMessage('Vui lòng nhập key truy cập', 'error');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.querySelector('.btn-text').textContent = 'Đang xác thực...';

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const validation = StorageManager.validateKey(key);
            
            if (validation.valid) {
                this.currentUser = {
                    key: key,
                    isAdmin: validation.isAdmin,
                    loginTime: Date.now(),
                    keyInfo: validation.key
                };
                
                this.isAuthenticated = true;
                
                localStorage.setItem('quantum_current_user', JSON.stringify(this.currentUser));
                
                this.showMainApp();
                this.showMessage('Đăng nhập thành công!', 'success');
            } else {
                this.showMessage(validation.message, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Lỗi xác thực. Vui lòng thử lại.', 'error');
        } finally {
            loginBtn.disabled = false;
            loginBtn.querySelector('.btn-text').textContent = 'Đăng Nhập';
        }
    }

    handleLogout() {
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem('quantum_current_user');
        this.showAuthScreen();
        this.showMessage('Đã đăng xuất thành công', 'success');
    }

    showAuthScreen() {
        document.getElementById('authScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
        this.createParticles();
    }

    showMainApp() {
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        this.updateUserInfo();
        
        if (typeof window.SignalManager !== 'undefined') {
            window.SignalManager.init();
        }
        
        if (typeof window.AdminManager !== 'undefined' && this.currentUser.isAdmin) {
            window.AdminManager.init();
        }
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

    createParticles() {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;

        particlesContainer.innerHTML = '';
        
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const size = Math.random() * 6 + 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            
            const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            particle.style.background = color;
            
            const duration = Math.random() * 20 + 10;
            const delay = Math.random() * 5;
            particle.style.animation = `float ${duration}s linear ${delay}s infinite`;
            
            particlesContainer.appendChild(particle);
        }
    }

    showMessage(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${this.getMessageIcon(type)}</span>
                <span class="toast-text">${message}</span>
                <button class="toast-close">&times;</button>
            </div>
        `;

        if (!document.querySelector('#toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'toast-styles';
            styles.textContent = `
                .toast-message {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: var(--card-bg);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 16px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(20px);
                    z-index: 10000;
                    transform: translateX(400px);
                    transition: transform 0.3s ease;
                    max-width: 400px;
                }
                .toast-message.show {
                    transform: translateX(0);
                }
                .toast-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .toast-success {
                    border-left: 4px solid var(--success);
                }
                .toast-error {
                    border-left: 4px solid var(--danger);
                }
                .toast-warning {
                    border-left: 4px solid var(--warning);
                }
                .toast-info {
                    border-left: 4px solid var(--accent);
                }
                .toast-close {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-size: 18px;
                    padding: 4px;
                    border-radius: 4px;
                    margin-left: auto;
                }
                .toast-close:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--text);
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);

        const autoRemove = setTimeout(() => {
            this.removeToast(toast);
        }, 5000);

        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(autoRemove);
            this.removeToast(toast);
        });
    }

    removeToast(toast) {
        toast.classList.remove('show');
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

    checkSession() {
        if (!this.isAuthenticated || !this.currentUser) {
            return false;
        }

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
}

// Khởi tạo AuthManager khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.AuthManager = new AuthManager();
});
