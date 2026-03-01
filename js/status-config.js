/**
 * 系統狀態與術語對照表 (Status Configuration)
 * 用於統一後台介面與資料庫狀態顯示
 */
const STATUS_CONFIG = {
    // 訂單管理 (matcha_orders)
    orders: {
        'pending': { label: '待處理', class: 'pending' },
        'confirmed': { label: '已確認', class: 'pending' }, // 已確認改為灰色 (跟待處理一樣色系)
        'completed': { label: '已完成', class: 'completed' }, // 綠色
        'cancelled': { label: '已取消', class: 'cancelled' }
    },
    // 預約管理 (denwa_orders)
    denwa: {
        'pending': { label: '待處理', class: 'pending' },
        'confirmed': { label: '已確認', class: 'pending' }, // 已確認改為灰色
        'completed': { label: '已完成', class: 'completed' }, // 綠色
        'cancelled': { label: '已取消', class: 'cancelled' }
    },
    // 連結訂單 / 刷卡訂單 (card_orders)
    links: {
        'pending': { label: '待處理', class: 'pending' },
        'confirmed': { label: '已確認', class: 'pending' }, // 已確認改為灰色
        'completed': { label: '已完成', class: 'completed' }, // 綠色
        'cancelled': { label: '已取消', class: 'cancelled' }
    },
    // 連結代收 (支付連結 card_orders_links)
    cardlinks: {
        'available': { label: '啟用中', class: 'available' }, // 綠色
        'discontinued': { label: '已停用', class: 'cancelled' }
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

// 兼容性映射
STATUS_CONFIG.cardorders = STATUS_CONFIG.links;

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
