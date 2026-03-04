/**
 * js/checkout_core.js
 * 僅保留共用的 UI 控制與 API 登入輔助
 */

// UI 控制 (側邊欄)
function openPanel(panelId) {
    closeAllPanels();
    const panel = document.getElementById(panelId);
    const overlay = document.getElementById('global-overlay');
    if (panel) panel.classList.add('open');
    if (overlay) overlay.classList.add('open');
}

function closeAllPanels() {
    document.querySelectorAll('.side-panel, .overlay').forEach(el => el.classList.remove('open'));
}

// 側邊欄的登入按鈕邏輯 (Login Panel 用)
async function handleQuickLogin() {
    const phoneInput = document.getElementById('login-phone');
    if (!phoneInput) return;
    const phone = phoneInput.value.trim();
    if (!/^09\d{8}$/.test(phone)) return KUI.alert("請輸入正確的 09 開頭 10 碼電話");

    const btn = document.getElementById('login-submit-btn');
    const oldHtml = btn.innerHTML;
    btn.innerHTML = '驗證中...';

    try {
        // 直接從 Firestore 查詢會員
        const docSnap = await db.collection('members').doc(phone).get();
        if (docSnap.exists) {
            const userData = docSnap.data();
            // 登入成功，儲存到 LocalStorage
            localStorage.setItem('keicha_v2_user', JSON.stringify(userData));
            closeAllPanels();

            // 如果是在 DIY 頁面，嘗試自動帶入
            const inputPhone = document.getElementById('input-phone');
            if (inputPhone) {
                inputPhone.value = userData.phone;
                if (typeof fillFormWithData === 'function') {
                    fillFormWithData(userData);
                }
            }
            await KUI.alert("會員資料讀取成功！");
        } else {
            await KUI.alert("查無此行動電話之會員資料。");
        }
    } catch (e) {
        console.error("Login Error:", e);
        await KUI.alert("系統讀取錯誤，請稍後再試。");
    } finally {
        btn.innerHTML = oldHtml;
    }
}
