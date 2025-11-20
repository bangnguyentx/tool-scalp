// Admin Manager - Quản lý chức năng admin
class AdminManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadKeysList();
        this.loadAdminsList();
    }

    bindEvents() {
        // Sự kiện tạo key
        document.getElementById('generateKeyBtn').addEventListener('click', () => {
            this.generateKey();
        });

        // Sự kiện gửi tín hiệu thủ công
        document.getElementById('sendManualSignalBtn').addEventListener('click', () => {
            this.sendManualSignal();
        });

        // Sự kiện thêm admin
        document.getElementById('addAdminBtn').addEventListener('click', () => {
            this.addAdmin();
        });

        // Sự kiện modal tín hiệu thủ công
        document.getElementById('addManualSignal').addEventListener('click', () => {
            this.showManualSignalModal();
        });

        // Sự kiện đóng modal
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.hideManualSignalModal();
        });

        document.querySelector('.modal-cancel').addEventListener('click', () => {
            this.hideManualSignalModal();
        });

        // Sự kiện submit modal
        document.querySelector('.modal-submit').addEventListener('click', () => {
            this.submitManualSignal();
        });
    }

    // Quản lý Key
    generateKey() {
        const keyType = document.getElementById('keyType').value;
        const customKey = document.getElementById('customKey').value.trim();
        
        let keyCode = customKey;
        if (!keyCode) {
            keyCode = this.generateRandomKey();
        }

        // Kiểm tra key trùng
        const existingKeys = StorageManager.getKeys();
        if (existingKeys.some(k => k.code === keyCode)) {
            window.AuthManager.showMessage('Key đã tồn tại. Vui lòng chọn key khác.', 'error');
            return;
        }

        const keyData = {
            code: keyCode,
            type: keyType,
            createdBy: window.AuthManager.currentUser.key
        };

        const newKey = StorageManager.addKey(keyData);
        
        if (newKey) {
            this.loadKeysList();
            window.AuthManager.showMessage(`Đã tạo key ${keyCode} thành công!`, 'success');
            
            // Reset form
            document.getElementById('customKey').value = '';
        } else {
            window.AuthManager.showMessage('Lỗi khi tạo key. Vui lòng thử lại.', 'error');
        }
    }

    generateRandomKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'QT-';
        for (let i = 0; i < 9; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    loadKeysList() {
        const keysList = document.getElementById('keysList');
        const keys = StorageManager.getKeys().filter(k => k.type !== 'admin'); // Ẩn key admin
        
        if (keys.length === 0) {
            keysList.innerHTML = `
                <div class="no-data">Chưa có key nào được tạo</div>
            `;
            return;
        }

        keysList.innerHTML = keys.map(key => {
            const createdDate = new Date(key.createdAt).toLocaleDateString('vi-VN');
            const expiresDate = key.expiresAt ? new Date(key.expiresAt).toLocaleDateString('vi-VN') : 'Vĩnh viễn';
            const status = key.isActive === false ? 'Đã vô hiệu hóa' : 'Đang hoạt động';
            const statusClass = key.isActive === false ? 'status-inactive' : 'status-active';
            
            return `
                <div class="key-item fade-in">
                    <div class="key-info">
                        <div class="key-code">${key.code}</div>
                        <div class="key-meta">
                            Loại: ${this.getKeyTypeText(key.type)} | 
                            Tạo: ${createdDate} | 
                            Hết hạn: ${expiresDate} | 
                            <span class="${statusClass}">${status}</span>
                        </div>
                    </div>
                    <div class="key-actions">
                        <button class="btn-danger" onclick="AdminManager.deleteKey('${key.code}')">
                            🗑️ Xóa
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    getKeyTypeText(type) {
        const types = {
            'week': '1 Tuần',
            'month': '1 Tháng',
            '3months': '3 Tháng',
            'forever': 'Vĩnh Viễn',
            'admin': 'Admin'
        };
        return types[type] || type;
    }

    static deleteKey(keyCode) {
        if (!window.AuthManager?.currentUser?.isAdmin) {
            window.AuthManager?.showMessage('Bạn không có quyền thực hiện hành động này', 'error');
            return;
        }

        if (confirm(`Bạn có chắc muốn xóa key ${keyCode}?`)) {
            StorageManager.removeKey(keyCode);
            window.AdminManager.loadKeysList();
            window.AuthManager?.showMessage('Đã xóa key thành công', 'success');
        }
    }

    // Quản lý Admin
    addAdmin() {
        const newAdminKey = document.getElementById('newAdminKey').value.trim();
        
        if (!newAdminKey) {
            window.AuthManager.showMessage('Vui lòng nhập key admin', 'error');
            return;
        }

        // Kiểm tra key đã tồn tại
        const existingKeys = StorageManager.getKeys();
        if (existingKeys.some(k => k.code === newAdminKey)) {
            window.AuthManager.showMessage('Key admin đã tồn tại', 'error');
            return;
        }

        const adminData = {
            code: newAdminKey,
            type: 'admin',
            createdBy: window.AuthManager.currentUser.key
        };

        StorageManager.addKey(adminData);
        
        this.loadAdminsList();
        document.getElementById('newAdminKey').value = '';
        window.AuthManager.showMessage('Đã thêm admin thành công!', 'success');
    }

    loadAdminsList() {
        const adminsList = document.getElementById('adminsList');
        const admins = StorageManager.getKeys().filter(k => k.type === 'admin');
        
        // Ẩn admin chủ (BangAdmin17) khỏi danh sách xóa
        const displayAdmins = admins.filter(admin => admin.code !== 'BangAdmin17');

        if (displayAdmins.length === 0) {
            adminsList.innerHTML = `
                <div class="no-data">Chưa có admin nào được thêm</div>
            `;
            return;
        }

        adminsList.innerHTML = displayAdmins.map(admin => {
            const createdDate = new Date(admin.createdAt).toLocaleDateString('vi-VN');
            const createdBy = admin.createdBy === 'system' ? 'Hệ thống' : admin.createdBy;
            
            return `
                <div class="admin-item fade-in">
                    <div class="admin-info">
                        <div class="key-code">${admin.code}</div>
                        <div class="key-meta">
                            Được tạo bởi: ${createdBy} | Ngày tạo: ${createdDate}
                        </div>
                    </div>
                    <div class="admin-actions">
                        <button class="btn-danger" onclick="AdminManager.deleteAdmin('${admin.code}')">
                            🗑️ Xóa
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    static deleteAdmin(adminCode) {
        if (!window.AuthManager?.currentUser?.isAdmin) {
            window.AuthManager?.showMessage('Bạn không có quyền thực hiện hành động này', 'error');
            return;
        }

        if (adminCode === 'BangAdmin17') {
            window.AuthManager?.showMessage('Không thể xóa admin chủ', 'error');
            return;
        }

        if (confirm(`Bạn có chắc muốn xóa admin ${adminCode}?`)) {
            StorageManager.removeKey(adminCode);
            window.AdminManager.loadAdminsList();
            window.AuthManager?.showMessage('Đã xóa admin thành công', 'success');
        }
    }

    // Tín hiệu thủ công
    showManualSignalModal() {
        const modal = document.getElementById('manualSignalModal');
        modal.classList.add('show');
        
        // Reset form
        document.getElementById('modalCoin').value = '';
        document.getElementById('modalDirection').value = 'LONG';
        document.getElementById('modalEntry').value = '';
        document.getElementById('modalTP').value = '';
        document.getElementById('modalSL').value = '';
        document.getElementById('modalReason').value = '';
    }

    hideManualSignalModal() {
        const modal = document.getElementById('manualSignalModal');
        modal.classList.remove('show');
    }

    submitManualSignal() {
        const coin = document.getElementById('modalCoin').value.trim().toUpperCase();
        const direction = document.getElementById('modalDirection').value;
        const entry = document.getElementById('modalEntry').value;
        const tp = document.getElementById('modalTP').value;
        const sl = document.getElementById('modalSL').value;
        const reason = document.getElementById('modalReason').value.trim();

        // Validation
        if (!coin) {
            window.AuthManager.showMessage('Vui lòng nhập mã coin', 'error');
            return;
        }

        if (!entry || !tp || !sl) {
            window.AuthManager.showMessage('Vui lòng nhập đầy đủ các mức giá', 'error');
            return;
        }

        if (parseFloat(entry) <= 0 || parseFloat(tp) <= 0 || parseFloat(sl) <= 0) {
            window.AuthManager.showMessage('Giá trị phải lớn hơn 0', 'error');
            return;
        }

        const signalData = {
            coin: coin,
            direction: direction,
            entry: entry,
            tp: tp,
            sl: sl,
            reason: reason || 'Tín hiệu thủ công từ admin'
        };

        try {
            SignalManager.addManualSignal(signalData);
            this.hideManualSignalModal();
            window.AuthManager.showMessage('Đã gửi tín hiệu thủ công thành công!', 'success');
        } catch (error) {
            console.error('Error sending manual signal:', error);
            window.AuthManager.showMessage('Lỗi khi gửi tín hiệu', 'error');
        }
    }

    // Quản lý hệ thống
    startAutoAnalysis() {
        if (window.AnalysisManager) {
            window.AnalysisManager.startAutoAnalysis();
            window.AuthManager.showMessage('Đã bắt đầu phân tích tự động', 'success');
        }
    }

    stopAutoAnalysis() {
        if (window.AnalysisManager) {
            window.AnalysisManager.stopAutoAnalysis();
            window.AuthManager.showMessage('Đã dừng phân tích tự động', 'success');
        }
    }

    getSystemStatus() {
        if (window.AnalysisManager) {
            return window.AnalysisManager.getSystemStatus();
        }
        return null;
    }

    // Xóa tất cả dữ liệu (chỉ dùng cho development)
    static clearAllData() {
        if (!window.AuthManager?.currentUser?.isAdmin) {
            window.AuthManager?.showMessage('Bạn không có quyền thực hiện hành động này', 'error');
            return;
        }

        if (confirm('CẢNH BÁO: Bạn có chắc muốn xóa TẤT CẢ dữ liệu? Hành động này không thể hoàn tác!')) {
            localStorage.removeItem('quantum_access_keys');
            localStorage.removeItem('quantum_active_signals');
            localStorage.removeItem('quantum_completed_signals');
            localStorage.removeItem('quantum_tracked_coins');
            localStorage.removeItem('quantum_cooldown_coins');
            localStorage.removeItem('quantum_daily_summaries');
            localStorage.removeItem('quantum_analysis_schedule');
            localStorage.removeItem('quantum_popular_coins');
            localStorage.removeItem('quantum_current_user');
            
            // Khởi tạo lại storage
            StorageManager.init();
            
            // Refresh các component
            if (window.SignalManager) window.SignalManager.refreshSignals();
            if (window.AdminManager) {
                window.AdminManager.loadKeysList();
                window.AdminManager.loadAdminsList();
            }
            
            window.AuthManager?.showMessage('Đã xóa tất cả dữ liệu thành công', 'success');
        }
    }
}

// Khởi tạo AdminManager khi có quyền admin
document.addEventListener('DOMContentLoaded', () => {
    // Chỉ khởi tạo nếu user là admin
    if (window.AuthManager?.currentUser?.isAdmin) {
        window.AdminManager = new AdminManager();
    }
});
