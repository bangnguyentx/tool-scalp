const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Phục vụ file tĩnh
app.use(express.static(path.join(__dirname)));

// Route chính
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint cho Render
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Quantum Trading Suite is running',
        timestamp: new Date().toISOString()
    });
});

// Khởi động server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Quantum Trading Suite đang chạy trên port ${PORT}`);
    console.log(`📊 Truy cập: http://localhost:${PORT}`);
    console.log(`❤️ Health check: http://localhost:${PORT}/health`);
});

// Xử lý lỗi để server không crash
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection tại:', promise, 'lí do:', reason);
});
