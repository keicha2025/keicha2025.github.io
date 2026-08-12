/* ============================================================
 * KEICHA SHOP — shop.js
 * Vanilla JS frontend logic, aligned with maccha-store patterns.
 * Uses shared js/api.js (window.API)
 * ============================================================ */

(() => {
    'use strict';

    // ----------------------------------------------------------
    //  Firebase Initialization (Reuse existing config pattern)
    // ----------------------------------------------------------
    let allProducts = [];
    let shopConfig = null;
    let db = null;

    if (typeof firebase !== 'undefined') {
        db = firebase.firestore();
    }

    // ----------------------------------------------------------
    //  State
    // ----------------------------------------------------------
    let cart = [];
    let shippingFee = 0;
    let shippingRules = [];
    let selectedLogisticsType = '';
    let selectedPaymentType = 'cod'; // default
    let cachedMemberData = null;
    let pendingMember = null; // Stores found member awaiting verification

    // ----------------------------------------------------------
    //  DOM Helpers
    // ----------------------------------------------------------
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // ----------------------------------------------------------
    //  Panel Control (same pattern as maccha-store)
    // ----------------------------------------------------------
    function openPanel(id) {
        const el = document.getElementById(id);
        const overlay = document.getElementById('overlay');
        if (el && overlay) {
            overlay.classList.add('open');
            el.classList.add('open');
        }
    }

    function closeAllPanels() {
        const overlay = document.getElementById('overlay');
        if (overlay) overlay.classList.remove('open');
        $$('.side-panel').forEach(el => el.classList.remove('open'));
    }

    function openCart() {
        renderCartItems();
        openPanel('cart-sidebar');
    }

    function openCheckout() {
        if (cart.length === 0) { alert('請先加入商品'); return; }

        // Reset Payment
        selectedPaymentType = 'cod';
        $$('.payment-card').forEach(c => {
            c.classList.toggle('active', c.getAttribute('onclick').includes("'cod'"));
        });

        // Reset Logistics
        selectedLogisticsType = '';
        $$('.logistics-card:not(.payment-card)').forEach(c => {
            c.classList.remove('active');
            const detail = c.querySelector('.logistics-detail');
            if (detail) detail.classList.add('hidden');
        });

        // Filter Logistics based on product logistics_type
        filterLogisticsCards();

        const storeInput = document.getElementById('input-store');
        const storeNoteInput = document.getElementById('input-store-note');
        if (storeInput) storeInput.value = '';
        if (storeNoteInput) storeNoteInput.value = '';

        const footerLogistics = document.getElementById('footer-logistics-name');
        if (footerLogistics) footerLogistics.innerText = '尚未選擇物流';

        updateShippingFee();

        if (cachedMemberData) {
            autoFillLogistics(cachedMemberData);
        }

        updateCheckoutReadonlyList();
        closeAllPanels();
        openPanel('checkout-panel');
    }

    function filterLogisticsCards() {
        // Collect required types from cart
        const allowedTypes = new Set(['all', '7-11', '全家', '宅配']);

        // Product logistics_type codes: 'all', 'cvs', 'home', 'none'
        // Logic:
        // - if any 'cvs' -> remove '宅配' from allowed
        // - if any 'home' -> remove '7-11' and '全家' from allowed
        // - if any 'none' -> set allowed to []

        let finalAllowed = ['7-11', '全家', '宅配'];

        for (const item of cart) {
            const type = item.logistics_type || 'all';
            if (type === 'cvs') {
                finalAllowed = finalAllowed.filter(t => t !== '宅配');
            } else if (type === 'home') {
                finalAllowed = finalAllowed.filter(t => t === '宅配');
            } else if (type === 'none') {
                finalAllowed = [];
                break;
            }
        }

        // Also check shopConfig toggles
        if (shopConfig) {
            if (!shopConfig.enable_711) finalAllowed = finalAllowed.filter(t => t !== '7-11');
            if (!shopConfig.enable_fami) finalAllowed = finalAllowed.filter(t => t !== '全家');
            if (!shopConfig.enable_home) finalAllowed = finalAllowed.filter(t => t !== '宅配');
        }

        // Apply to UI
        $$('.logistics-card:not(.payment-card)').forEach(c => {
            const labelText = c.innerText;
            let matches = false;
            if (finalAllowed.includes('7-11') && labelText.includes('7-11')) matches = true;
            if (finalAllowed.includes('全家') && labelText.includes('全家')) matches = true;
            if (finalAllowed.includes('宅配') && labelText.includes('宅配')) matches = true;

            c.style.display = matches ? 'block' : 'none';
        });
    }

    // ----------------------------------------------------------
    //  Quick View
    // ----------------------------------------------------------
    function openQuickView(productId) {
        const product = allProducts.find(p => p.id === productId);
        if (!product) return;

        const body = document.getElementById('quickview-body');
        if (!body) return;

        body.innerHTML = `<div class="shop-loading" style="min-height:200px;"><div class="shop-spinner"></div></div>`;
        openPanel('quickview-panel');

        setTimeout(() => {
            body.innerHTML = `
                <div class="quickview-enter" style="padding:20px;">
                    <img class="quickview__image" src="${product.img_url || product.img || ''}" alt="${product.name}">
                    <div class="quickview__category">${product.category}</div>
                    <h3 class="quickview__name">${product.name}</h3>
                    <div class="quickview__price">NT$ ${product.price}</div>
                    <p class="quickview__desc">${product.description}</p>
                    <div class="quickview__stock-info">
                        <span class="material-symbols-rounded">inventory_2</span>
                        <span>庫存: ${product.stock || 0} 件</span>
                    </div>
                    <button onclick="ShopApp.addToCart('${product.id}')"
                        style="width:100%;margin-top:20px;padding:14px;border:none;border-radius:14px;background:var(--shop-brand);color:#fff;font-weight:700;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.2s;">
                        <span class="material-symbols-rounded" style="font-size:20px;">shopping_bag</span>
                        加入購物車
                    </button>
                </div>`;
        }, 400);
    }

    // ----------------------------------------------------------
    //  Cart Logic
    // ----------------------------------------------------------
    function addToCart(productId) {
        const product = allProducts.find(p => p.id === productId);
        if (!product) return;

        const existing = cart.find(item => item.productId === productId);
        if (existing) {
            if (product.stock && existing.qty >= product.stock) { alert('庫存不足'); return; }
            existing.qty += 1;
        } else {
            cart.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                qty: 1,
                stock: product.stock || 999,
                img: product.img_url || product.img || '',
                logistics_type: product.logistics_type || 'all'
            });
        }

        if (navigator.vibrate) navigator.vibrate(50);
        renderCartItems();
        openCart();
    }

    function calculateSubtotal() {
        return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    }

    function renderCartItems() {
        const container = document.getElementById('cart-items-wrapper');
        const subtotalEl = document.getElementById('cart-subtotal');
        const badge = document.getElementById('fab-badge');
        if (!container) return;

        container.innerHTML = '';

        if (cart.length === 0) {
            container.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:256px;color:#D1D5DB;gap:12px;">
                    <span class="material-symbols-rounded" style="font-size:48px;">shopping_basket</span>
                    <p style="font-size:14px;font-weight:500;">購物車是空的</p>
                </div>`;
            if (subtotalEl) subtotalEl.innerText = '0';
            if (badge) badge.classList.add('shop-hidden');
            return;
        }

        cart.forEach((item, index) => {
            let imgHtml = '';
            if (item.img) {
                imgHtml = `<div style="width:64px;height:64px;border-radius:12px;overflow:hidden;flex-shrink:0;background:#f9fafb;border:1px solid #f3f4f6;">
                    <img src="${item.img}" style="width:100%;height:100%;object-fit:cover;" alt="${item.name}">
                </div>`;
            }
            container.innerHTML += `
                <div style="position:relative;display:flex;gap:16px;align-items:flex-start;border-bottom:1px solid #f9fafb;padding:20px;background:#fff;">
                    ${imgHtml}
                    <div style="flex:1;min-width:0;display:flex;flex-direction:column;justify-content:space-between;min-height:64px;">
                        <div style="padding-right:24px;">
                            <div style="font-weight:700;color:#1f2937;font-size:14px;line-height:1.4;">${item.name}</div>
                            <div style="font-size:12px;color:#9ca3af;margin-top:4px;font-variant-numeric:tabular-nums;">$${item.price}</div>
                        </div>
                        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:8px;">
                            <div style="display:flex;align-items:center;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;height:32px;">
                                <button onclick="ShopApp.updateCartQty(${index}, -1)" style="width:32px;height:100%;border:none;background:none;cursor:pointer;font-weight:700;color:#6b7280;font-size:14px;">-</button>
                                <span style="width:32px;text-align:center;font-size:12px;font-weight:700;color:#374151;font-variant-numeric:tabular-nums;">${item.qty}</span>
                                <button onclick="ShopApp.updateCartQty(${index}, 1)" style="width:32px;height:100%;border:none;background:none;cursor:pointer;font-weight:700;color:#6b7280;font-size:14px;">+</button>
                            </div>
                            <div style="font-weight:700;color:var(--shop-brand);font-variant-numeric:tabular-nums;">$${item.price * item.qty}</div>
                        </div>
                    </div>
                    <button onclick="ShopApp.removeFromCart(${index})" style="position:absolute;top:16px;right:16px;border:none;background:none;cursor:pointer;color:#d1d5db;padding:4px;" title="移除">
                        <span class="material-symbols-rounded" style="font-size:20px;">close</span>
                    </button>
                </div>`;
        });

        if (subtotalEl) subtotalEl.innerText = calculateSubtotal().toLocaleString();

        const totalQty = cart.reduce((acc, i) => acc + i.qty, 0);
        if (badge) {
            badge.innerText = totalQty;
            badge.classList.toggle('shop-hidden', totalQty === 0);
        }
    }

    function updateCartQty(index, delta) {
        if (!cart[index]) return;
        const item = cart[index];
        const newQty = item.qty + delta;
        if (delta > 0 && item.stock && newQty > item.stock) { alert('庫存不足'); return; }
        if (newQty < 1) return;
        item.qty = newQty;
        renderCartItems();
        if (document.getElementById('checkout-panel') &&
            document.getElementById('checkout-panel').classList.contains('open')) {
            updateCheckoutReadonlyList();
            updateShippingFee();
        }
    }

    function removeFromCart(index) {
        if (!confirm('確定要移除此商品嗎？')) return;
        cart.splice(index, 1);
        renderCartItems();
        if (document.getElementById('checkout-panel') &&
            document.getElementById('checkout-panel').classList.contains('open')) {
            updateCheckoutReadonlyList();
            updateShippingFee();
        }
    }

    // ----------------------------------------------------------
    //  Shipping Fee Calculation (same as maccha-store)
    // ----------------------------------------------------------
    function calcShip(selectedLogistics, subtotal) {
        if (!shippingRules || shippingRules.length === 0) return 0;

        const rule = shippingRules.find(r =>
            r.method && (r.method.includes(selectedLogistics) || selectedLogistics.includes(r.method))
        );

        if (!rule) return 0;

        let fee = Number(rule.base) || 0;
        if (rule.t3 && subtotal >= Number(rule.t3)) fee = Number(rule.f3) || 0;
        else if (rule.t2 && subtotal >= Number(rule.t2)) fee = Number(rule.f2) || 0;
        else if (rule.t1 && subtotal >= Number(rule.t1)) fee = Number(rule.f1) || 0;

        return fee;
    }

    function updateShippingFee() {
        const subtotal = calculateSubtotal();
        const surcharge = (selectedPaymentType === 'credit_card' && shopConfig) ? (shopConfig.cc_surcharge || 30) : 0;

        ['7-11', '全家', '郵寄/宅配'].forEach(type => {
            const fee = calcShip(type, subtotal);
            let uiType = type;
            if (type === '郵寄/宅配') uiType = '宅配';
            const el = document.querySelector(`.logistics-price[data-type="${uiType}"]`);
            if (el) {
                const displayFee = fee + surcharge;
                el.innerText = `$${displayFee}`;
            }

            // 更新查詢連結
            const rule = shippingRules.find(r => {
                const categories = Array.isArray(r.category) ? r.category : [r.category];
                return (categories.includes('抹茶商店') || categories.includes('抹茶')) && type.includes(r.method.replace(' 店到店', ''));
            });
            if (rule && rule.tracking_link) {
                const linkId = type === '7-11' ? 'query-link-711' : (type === '全家' ? 'query-link-fami' : null);
                const linkEl = linkId ? document.getElementById(linkId) : null;
                if (linkEl) linkEl.href = rule.tracking_link;
            }
        });

        const uiMethod = selectedLogisticsType;
        if (uiMethod) {
            const baseFee = calcShip(uiMethod, subtotal);
            shippingFee = baseFee + surcharge;
            const footerEl = document.getElementById('footer-logistics-name');
            if (footerEl) footerEl.innerText = `${uiMethod} (運費 $${shippingFee})`;
            const totalEl = document.getElementById('modal-total');
            if (totalEl) totalEl.innerText = (subtotal + shippingFee).toLocaleString();
        } else {
            shippingFee = surcharge; // If no logistics yet, still count surcharge
            const footerEl = document.getElementById('footer-logistics-name');
            if (footerEl) footerEl.innerText = selectedPaymentType === 'credit_card' ? '尚未選擇物流' : '尚未選擇物流';
            const totalEl = document.getElementById('modal-total');
            if (totalEl) totalEl.innerText = (subtotal + shippingFee).toLocaleString();
        }

        updateTwoPhaseStatus(subtotal + shippingFee);
    }

    function selectPayment(method, el) {
        selectedPaymentType = method;
        $$('.payment-card').forEach(c => c.classList.remove('active'));
        if (el) el.classList.add('active');
        updateShippingFee();
    }

    function updateTwoPhaseStatus(total) {
        const banner = document.getElementById('two-phase-banner');
        const text = document.getElementById('two-phase-text');
        if (!banner || !text || !shopConfig) return;

        // Eligibility check: any item has two_phase_enabled AND total >= threshold
        const hasTPProduct = cart.some(item => {
            const p = allProducts.find(prod => prod.id === item.productId);
            return p && p.two_phase_enabled;
        });
        const threshold = shopConfig.two_phase_rule_threshold || 1000;

        if (hasTPProduct && total >= threshold) {
            const deposit = shopConfig.two_phase_rule_amount || 100;
            const remainder = total - deposit;
            text.innerText = `本訂單符合兩階段付款：訂金 NT$ ${deposit.toLocaleString()}，尾款 NT$ ${remainder.toLocaleString()}`;
            banner.style.display = 'block';
            banner.dataset.isEligible = "true";
            banner.dataset.deposit = deposit;
            banner.dataset.remainder = remainder;
        } else {
            banner.style.display = 'none';
            banner.dataset.isEligible = "false";
        }
    }

    // ----------------------------------------------------------
    //  Checkout Helpers
    // ----------------------------------------------------------
    function updateCheckoutReadonlyList() {
        const listEl = document.getElementById('checkout-readonly-list');
        if (!listEl) return;
        listEl.innerHTML = '';
        cart.forEach(item => {
            listEl.innerHTML += `
                <li style="padding:12px 16px;font-size:14px;color:#5d8d41;font-weight:500;display:flex;align-items:flex-start;gap:8px;border-bottom:1px solid rgba(110,164,76,0.08);">
                    <span class="material-symbols-rounded" style="color:var(--shop-brand);font-size:16px;margin-top:2px;">check_circle</span>
                    <span>${item.name} <span style="font-size:12px;color:#9ca3af;margin-left:4px;">x${item.qty}</span></span>
                </li>`;
        });
    }

    function selectLogistics(type, cardEl) {
        $$('.logistics-card').forEach(el => {
            el.classList.remove('active');
            const detail = el.querySelector('.logistics-detail');
            if (detail) detail.classList.add('hidden');
        });
        cardEl.classList.add('active');
        const detail = cardEl.querySelector('.logistics-detail');
        if (detail) detail.classList.remove('hidden');

        const select = document.getElementById('input-logistics');
        if (select) select.value = type;
        selectedLogisticsType = type;

        updateShippingFee();
        syncStoreInput();
    }

    function syncStoreInput() {
        let storeId = '';
        let storeName = '';

        if (selectedLogisticsType === '7-11') {
            const id711 = document.getElementById('store-id-711');
            const name711 = document.getElementById('store-name-711');
            storeId = id711 ? id711.value.trim() : '';
            storeName = name711 ? name711.value.trim() : '';
        } else if (selectedLogisticsType === '全家') {
            const idFami = document.getElementById('store-id-fami');
            const nameFami = document.getElementById('store-name-fami');
            storeId = idFami ? idFami.value.trim() : '';
            storeName = nameFami ? nameFami.value.trim() : '';
        } else if (selectedLogisticsType && selectedLogisticsType.includes('宅配')) {
            const addr = document.getElementById('store-addr');
            storeId = addr ? addr.value.trim() : '';
        }

        const storeInput = document.getElementById('input-store');
        const storeNoteInput = document.getElementById('input-store-note');
        if (storeInput) storeInput.value = storeId;
        if (storeNoteInput) storeNoteInput.value = storeName;
    }

    function lookupPhoneData(btn) {
        const input = document.getElementById('input-phone');
        const msg = document.getElementById('phone-msg');
        const phone = input ? input.value.trim() : '';
        const regex = /^09\d{8}$/;

        if (!regex.test(phone)) {
            if (msg) {
                msg.innerText = '格式錯誤，請輸入 09 開頭的 10 碼手機號碼';
                msg.style.color = '#64748b';
            }
            if (input) input.focus();
            return;
        }

        if (msg) { msg.innerText = '查詢中...'; msg.style.color = '#9ca3af'; }
        btn.disabled = true;

        if (db) {
            db.collection('members').doc(phone).get()
                .then(docSnap => {
                    const info = docSnap.exists ? docSnap.data() : null;
                    if (info && info.name) {
                        // 1. Masking the name (e.g., Wang Ming -> W○ng Ming or 王大明 -> 王○明)
                        const rawName = info.name;
                        let maskedName = rawName;
                        if (rawName.length >= 2) {
                            maskedName = rawName[0] + '○' + (rawName.length > 2 ? rawName.substring(2) : '');
                        }

                        if (msg) {
                            msg.innerText = `會員：${maskedName}，請於姓名欄位輸入「完整姓名」驗證`;
                            msg.style.color = '#6ea44c';
                            msg.style.fontWeight = '700';
                        }

                        // 2. Prepare for verification
                        pendingMember = info;
                        cachedMemberData = null; // Clear old valid data

                        const nameInput = document.getElementById('input-name');
                        if (nameInput) {
                            nameInput.focus();
                            nameInput.placeholder = `請驗證完整姓名 (提示: ${maskedName})`;
                            // Add one-time input listener for verification
                            nameInput.oninput = (e) => {
                                if (pendingMember && e.target.value === pendingMember.name) {
                                    // Verification Success!
                                    msg.innerText = `歡迎回來，${pendingMember.name}！已為您帶入資料`;
                                    msg.style.color = '#6ea44c';

                                    const emailInput = document.getElementById('input-email');
                                    const lineInput = document.getElementById('input-line');
                                    if (emailInput) emailInput.value = pendingMember.email || '';
                                    if (lineInput) lineInput.value = pendingMember.line_name || '';

                                    cachedMemberData = pendingMember;
                                    autoFillLogistics(pendingMember);
                                    pendingMember = null; // Clear state
                                    nameInput.oninput = null; // Remove listener
                                }
                            };
                        }
                    } else {
                        if (msg) { msg.innerText = '新朋友您好，請填寫下方資料'; msg.style.color = '#6b7280'; }
                        pendingMember = null;
                        cachedMemberData = null;
                    }
                })
                .catch(err => {
                    console.error('[SHOP] Lookup error:', err);
                    if (msg) msg.innerText = '查詢失敗，請手動填寫';
                })
                .finally(() => { btn.disabled = false; });
        } else {
            if (msg) { msg.innerText = '請先初始化伺服器'; msg.style.color = '#64748b'; }
            btn.disabled = false;
        }
    }

    function autoFillLogistics(info) {
        if (!info) return;
        const s711 = document.getElementById('store-id-711');
        const n711 = document.getElementById('store-name-711');
        const sFami = document.getElementById('store-id-fami');
        const nFami = document.getElementById('store-name-fami');
        const addr = document.getElementById('store-addr');
        if (s711 && info.store_711) s711.value = info.store_711;
        if (n711 && info.store_711_note) n711.value = info.store_711_note;
        if (sFami && info.store_fami) sFami.value = info.store_fami;
        if (nFami && info.store_fami_note) nFami.value = info.store_fami_note;
        if (addr && info.shipping_address) addr.value = info.shipping_address;
    }

    // ----------------------------------------------------------
    //  Submit Order
    // ----------------------------------------------------------
    function submitOrder(btn) {
        const phoneInput = document.getElementById('input-phone');
        const nameInput = document.getElementById('input-name');
        const emailInput = document.getElementById('input-email');
        const lineInput = document.getElementById('input-line');
        const noteInput = document.getElementById('input-note');
        const joinMemberInput = document.getElementById('join-member');

        const phone = phoneInput ? phoneInput.value.trim() : '';
        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const line = lineInput ? lineInput.value.trim() : '';
        const note = noteInput ? noteInput.value.trim() : '';
        const joinMember = joinMemberInput ? joinMemberInput.checked : false;

        if (!phone || !name || !email) { alert('請填寫完整聯絡資訊'); return; }
        if (!selectedLogisticsType) { alert('請選擇配送方式'); return; }

        const type = selectedLogisticsType;
        const store = document.getElementById('input-store').value;
        const storeNote = document.getElementById('input-store-note').value;

        if ((type === '7-11' || type === '全家') && !store) { alert('請填寫門市店號'); return; }
        if (type.includes('宅配') && !store) { alert('請填寫收件地址'); return; }

        const subtotal = calculateSubtotal();
        const finalShip = shippingFee;
        const total = subtotal + finalShip;

        const banner = document.getElementById('two-phase-banner');
        const isTP = banner && banner.dataset.isEligible === "true";
        const phase1 = isTP ? parseInt(banner.dataset.deposit) : null;
        const phase2 = isTP ? parseInt(banner.dataset.remainder) : null;

        const itemsJson = cart.map(i => ({ id: i.productId, name: i.name, price: i.price, qty: i.qty }));
        const itemsText = cart.map(i => `${i.name} x${i.qty}`).join('\n');

        const payload = {
            phone, name, email,
            line_name: line,
            logistics_type: type,
            store_id: store,
            store_note: storeNote,
            shipping_address: type.includes('宅配') ? store : null,
            items: itemsJson,
            items_text: itemsText,
            subtotal,
            shipping_fee: finalShip,
            total,
            payment_method: selectedPaymentType,
            is_two_phase: isTP,
            phase1_amount: phase1,
            phase2_amount: phase2,
            note: note,
            join_member: joinMember // Pass flag for future use
        };

        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = `<div class="shop-spinner" style="width:20px;height:20px;border-width:2px;"></div> 處理中...`;

        if (db) {
            // Submit to Firestore
            db.collection('orders').add({
                ...payload,
                status: 'pending',
                created_at: firebase.firestore.FieldValue.serverTimestamp(),
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            })
                .then(async docRef => {
                    // [新] 儲存會員資料
                    if (joinMember) {
                        const memberData = {
                            phone: phone, name: name, email: email, line_name: line,
                            updated_at: firebase.firestore.FieldValue.serverTimestamp()
                        };
                        if (type === '7-11') { memberData.store_711 = store; memberData.store_711_note = storeNote; }
                        else if (type === '全家') { memberData.store_fami = store; memberData.store_fami_note = storeNote; }
                        else if (type.includes('宅配')) { memberData.shipping_address = store; }

                        try {
                            await db.collection('members').doc(phone).set(memberData, { merge: true });
                        } catch (e) {
                            console.error("[SHOP] Member save failed:", e);
                        }
                    }

                    // [新] 觸發郵件通知 (Firebase 模式)
                    if (window.API && window.API.sendNotification) {
                        window.API.sendNotification('new_matcha_order', {
                            ...payload,
                            order_id: docRef.id // 使用 Firestore Doc ID 作為訂單編號
                        }).catch(e => console.error('[GAS] Notification error:', e));
                    }

                    showOrderSuccess(docRef.id, payload);
                    cart = [];
                    renderCartItems();
                })
                .catch(err => {
                    console.error('[SHOP] Checkout error:', err);
                    alert('訂單送出失敗：' + err.message);
                })
                .finally(() => {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                });
        } else {
            // Mock Fallback
            setTimeout(() => {
                showOrderSuccess('MOCK-' + Date.now().toString().slice(-6), payload);
                cart = [];
                renderCartItems();
                btn.disabled = false;
                btn.innerHTML = originalText;
            }, 1000);
        }
    }

    function showOrderSuccess(orderId, payload) {
        const successPanel = document.getElementById('order-success');
        const orderIdEl = document.getElementById('success-order-id');
        const summaryEl = document.getElementById('success-summary').firstElementChild;

        if (!successPanel || !orderIdEl || !summaryEl) return;

        orderIdEl.innerText = `訂單編號：${orderId}`;

        let paymentInfo = payload.payment_method === 'cod' ? '貨到付款' : '信用卡 / 轉帳';
        if (payload.is_two_phase) {
            paymentInfo += ` (兩階段付款：訂金 $${payload.phase1_amount.toLocaleString()})`;
        }

        summaryEl.innerHTML = `
            <div style="display:flex;justify-content:space-between;"><span>訂購人</span><span style="color:#1f2937;font-weight:600;">${payload.name}</span></div>
            <div style="display:flex;justify-content:space-between;"><span>配送方式</span><span style="color:#1f2937;font-weight:600;">${payload.logistics_type}</span></div>
            <div style="display:flex;justify-content:space-between;"><span>付款方式</span><span style="color:#1f2937;font-weight:600;">${paymentInfo}</span></div>
            <div style="border-top:1px dashed #e5e7eb;margin:8px 0;"></div>
            <div style="display:flex;justify-content:space-between;font-size:16px;">
                <span style="color:#1f2937;font-weight:700;">應付總額</span>
                <span style="color:#6ea44c;font-weight:900;">NT$ ${payload.total.toLocaleString()}</span>
            </div>
        `;

        successPanel.style.display = 'flex';
        // Scroll to top
        document.getElementById('order-form').scrollTop = 0;
    }

    function closeOrderSuccess() {
        const successPanel = document.getElementById('order-success');
        if (successPanel) successPanel.style.display = 'none';
        closeAllPanels();
    }

    // ----------------------------------------------------------
    //  Product Grid Rendering
    // ----------------------------------------------------------
    function renderProducts(products) {
        const grid = document.getElementById('shop-product-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const count = products.length;
        const needsHybrid = count % 2 !== 0;
        const standardProducts = needsHybrid ? products.slice(0, -1) : products;
        const hybridProduct = needsHybrid ? products[count - 1] : null;

        standardProducts.forEach(product => {
            grid.innerHTML += renderStandardCard(product);
        });

        if (hybridProduct) {
            grid.innerHTML += renderHybridCard(hybridProduct);
        }
    }

    function renderStandardCard(product) {
        const imgSrc = product.img_url || product.img || '';
        const tagHtml = product.tag ? `<span class="product-card__tag">${product.tag}</span>` : '';
        const soldout = product.status === 'soldout';
        return `
            <div class="product-card${soldout ? ' product-card--soldout' : ''}" onclick="ShopApp.quickView('${product.id}')">
                <div class="product-card__image-wrap">
                    <img class="product-card__image" src="${imgSrc}" alt="${product.name}" loading="lazy">
                    ${tagHtml}
                    <button class="product-card__quick-btn" onclick="event.stopPropagation(); ShopApp.quickView('${product.id}');" title="快速查看">
                        <span class="material-symbols-rounded" style="font-size:20px;">visibility</span>
                    </button>
                </div>
                <div class="product-card__body">
                    <div class="product-card__category">${product.category || ''}</div>
                    <h3 class="product-card__name">${product.name}</h3>
                    <div class="product-card__footer">
                        <span class="product-card__price">NT$ ${product.price}</span>
                        ${soldout ? '<span style="font-size:12px;color:#64748b;font-weight:700;">已售完</span>' : `<button class="product-card__add-btn" onclick="event.stopPropagation(); ShopApp.addToCart('${product.id}');" title="加入購物車">
                            <span class="material-symbols-rounded" style="font-size:20px;">add</span>
                        </button>`}
                    </div>
                </div>
            </div>`;
    }

    function renderHybridCard(product) {
        const imgSrc = product.img_url || product.img || '';
        const tagHtml = product.tag ? `<span class="product-card__tag">${product.tag}</span>` : '';
        const soldout = product.status === 'soldout';
        return `
            <div class="product-card--hybrid${soldout ? ' product-card--soldout' : ''}" onclick="ShopApp.quickView('${product.id}')">
                <div class="product-card__image-wrap">
                    <img class="product-card__image" src="${imgSrc}" alt="${product.name}" loading="lazy">
                    ${tagHtml}
                </div>
                <div class="product-card__body">
                    <div class="product-card__category">${product.category || ''}</div>
                    <h3 class="product-card__name">${product.name}</h3>
                    <p class="quickview__desc" style="margin-top:8px;font-size:13px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${product.description || ''}</p>
                    <div class="product-card__footer" style="margin-top:auto;">
                        <span class="product-card__price">NT$ ${product.price}</span>
                        ${soldout ? '<span style="font-size:12px;color:#64748b;font-weight:700;">已售完</span>' : `<button class="product-card__add-btn" onclick="event.stopPropagation(); ShopApp.addToCart('${product.id}');" title="加入購物車">
                            <span class="material-symbols-rounded" style="font-size:20px;">add</span>
                        </button>`}
                    </div>
                </div>
            </div>`;
    }

    // ----------------------------------------------------------
    //  Keyboard listener
    // ----------------------------------------------------------
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllPanels();
    });

    // ----------------------------------------------------------
    //  Init
    // ----------------------------------------------------------
    document.addEventListener('DOMContentLoaded', async () => {
        // Show loading state
        const grid = document.getElementById('shop-product-grid');
        if (grid) grid.innerHTML = '<div class="shop-loading" style="grid-column:1/-1;padding:80px 0;"><div class="shop-spinner"></div></div>';

        // Fetch shop config + products + shipping rules in parallel from Firebase
        try {
            if (!db) throw new Error('Firebase not initialized');

            const [configDoc, prodSnapshot, shipSnapshot] = await Promise.all([
                db.collection('fast_checkout_config').doc('default').get(),
                db.collection('matcha_products').get(),
                db.collection('shipping_rules').get()
            ]);

            if (shipSnapshot && !shipSnapshot.empty) {
                shippingRules = shipSnapshot.docs.map(doc => doc.data());
            }

            if (configDoc.exists) {
                shopConfig = configDoc.data();
                console.log('[SHOP] Firestore Config loaded:', shopConfig);
            } else {
                shopConfig = { base_fee_711: 60, base_fee_fami: 60, base_fee_home: 120 };
            }

            if (!prodSnapshot.empty) {
                allProducts = prodSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log(`[SHOP] Loaded ${allProducts.length} products from Firestore`);
            } else {
                allProducts = [];
            }
        } catch (err) {
            console.error('[SHOP] Firebase Init error:', err);
            allProducts = [];
            shopConfig = { base_fee_711: 60, base_fee_fami: 60, base_fee_home: 120 };
        }

        renderProducts(allProducts);
        renderCartItems();
    });

    // ----------------------------------------------------------
    //  Public API
    // ----------------------------------------------------------
    window.ShopApp = {
        openCart,
        closeAll: closeAllPanels,
        quickView: openQuickView,
        addToCart,
        updateCartQty,
        removeFromCart,
        openCheckout,
        selectLogistics,
        syncStoreInput,
        lookupPhoneData,
        submitOrder
    };

})();
