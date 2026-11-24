/**
 * 系統狀態與術語對照表 (Status Configuration)
 * 用於統一後台介面與資料庫狀態顯示
 */
const STATUS_CONFIG = {
    // 訂單、預約、刷卡統一定義 (Unified 4-Status Model)
    orders: {
        'pending': { label: '待處理', class: 'pending' },
        'confirmed': { label: '已確認', class: 'pending' }, // 支付成功或已確認
        'completed': { label: '已完成', class: 'completed' }, // 綠色
        'cancelled': { label: '已取消', class: 'pending' },
        // 合併邏輯映射 (Legacy/Merged Mappings)
        'processing': { label: '已確認', class: 'pending' },
        'shipped': { label: '已完成', class: 'completed' },
        'paid': { label: '已確認', class: 'pending' },
        'quoted': { label: '待處理', class: 'pending' },
        'failed': { label: '已取消', class: 'pending' }
    },
    // 商品管理 (matcha_products)
    products: {
        'available': { label: '啟用中', class: 'available' }, // 綠色
        'out-of-stock': { label: '缺貨中', class: 'out-of-stock' },
        'discontinued': { label: '已停用', class: 'cancelled' }
    },
    // 品牌管理 (matcha_brands)
    brands: {
        'available': { label: '啟用中', class: 'available' }, // 綠色
        'active': { label: '啟用中', class: 'available' }, // 綠色
        'out-of-stock': { label: '缺貨中', class: 'out-of-stock' },
        'discontinued': { label: '已停用', class: 'cancelled' }
    },
    // 方案管理 (denwa_plans)
    plans: {
        'available': { label: '啟用中', class: 'available' }, // 綠色
        'ON': { label: '啟用中', class: 'available' }, // 綠色
        'out-of-stock': { label: '缺貨中', class: 'out-of-stock' },
        'discontinued': { label: '已停用', class: 'cancelled' }
    }
};

// 統一樣式別名
STATUS_CONFIG.denwa = STATUS_CONFIG.orders;
STATUS_CONFIG.links = STATUS_CONFIG.orders;
STATUS_CONFIG.cardorders = STATUS_CONFIG.orders;
STATUS_CONFIG.proxy_pay = STATUS_CONFIG.orders;
STATUS_CONFIG.cardlinks = {
    'available': { label: '啟用中', class: 'available' }, // 綠色
    'discontinued': { label: '已停用', class: 'cancelled' }
};

// 工具函式：獲取狀態資訊
const getStatusInfo = (type, status) => {
    return (STATUS_CONFIG[type] && STATUS_CONFIG[type][status]) || { label: status || '未知', class: '' };
};

// 工具函式：根據類型與狀態鍵值獲取標籤 HTML
const getStatusBadge = (type, status) => {
    const info = getStatusInfo(type, status);
    return `<span class="status-badge ${info.class || ''}">${info.label}</span>`;
};

if (typeof window !== 'undefined') {
    window.STATUS_CONFIG = STATUS_CONFIG;
    window.getStatusInfo = getStatusInfo;
    window.getStatusBadge = getStatusBadge;
}
