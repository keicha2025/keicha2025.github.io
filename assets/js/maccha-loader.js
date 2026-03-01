/**
* KEICHA 抹茶代購總覽 - 全自動載入引擎
* 整合：GAS JSON 資料串接 + 一期一會載入動畫控制
*/

window.addEventListener('load', () => {

    // 1. 設定區：您的 Google Apps Script 網址

    // 2. 取得頁面元素
    const productContainer = document.getElementById('product-list-container');
    const statusGrid = document.getElementById('status-grid-container');
    const statusLoader = document.getElementById('status-loader');

    // 3. 開始抓取資料 (直接從 Firestore 讀取)
    Promise.all([
        db.collection('matcha_brands').orderBy('display_order', 'asc').get(),
        db.collection('matcha_products').get()
    ])
        .then(([brandSnap, productSnap]) => {
            // A. 品牌資料轉換與排序 (可訂購優先)
            const brands = brandSnap.docs.map(doc => ({
                key: doc.id,
                ...doc.data(),
                order: doc.data().display_order // 相容舊版欄位名
            })).sort((a, b) => {
                const activeKeywords = ['active', 'available', 'open', '开团', '開團', '接收訂單中', '收單中', '可供訂購', '可訂購'];
                const isAActive = activeKeywords.includes((a.status || '').toLowerCase().trim());
                const isBActive = activeKeywords.includes((b.status || '').toLowerCase().trim());

                // 排序規則：可訂購優先，其餘依照 display_order
                if (isAActive && !isBActive) return -1;
                if (!isAActive && isBActive) return 1;
                return (Number(a.display_order) || 99) - (Number(b.display_order) || 99);
            });

            // B. 商品資料轉換
            const products = productSnap.docs.map(doc => {
                const p = doc.data();
                return {
                    ...p,
                    brand_key: p.brand_id // 相容舊版過濾邏輯 (p.brand_key === brand.key)
                };
            });

            // C. 執行渲染功能
            renderBrands(brands);
            renderProducts(brands, products);
            renderSEO(brands);

            // D. ★關鍵步驟：資料全部渲染完畢後，移除「一期一會」全屏遮罩
            hidePreloader();
        })
        .catch(err => {
            console.error("載入失敗:", err);
            hidePreloader();
            if (statusGrid) statusGrid.innerHTML = `<p class="text-slate-500 col-span-full text-center">資料載入失敗，請稍後再試。</p>`;
        });

    // --- 功能函式區 ---

    /**
     * 控制全屏遮罩淡出
     */
    function hidePreloader() {
        const preloader = document.getElementById('matcha-preloader');
        if (preloader) {
            // 設定 600ms 的緩衝，確保使用者能看清「一期一會」的優雅
            setTimeout(() => {
                preloader.classList.add('fade-out'); // 觸發 CSS opacity 0

                // 等待 CSS transition (0.8s) 結束後，將 display 設為 none
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 800);
            }, 600);
        }
    }

    /**
     * 渲染品牌狀態小卡
     */
    function renderBrands(brands) {
        if (!statusGrid) return;
        statusGrid.innerHTML = '';
        brands.forEach(brand => {
            if (brand.status === 'inactive') return; // 完全隱藏

            const isActive = brand.status === 'active' || brand.status === 'available' || brand.status === 'open' || brand.status === 'ON';
            const isOutOfStock = brand.status === 'out-of-stock';

            const statusText = isActive ? '可訂購' : '缺貨中';
            const statusColor = isActive ? 'bg-brandGreen text-white' : 'bg-gray-200 text-gray-600';

            statusGrid.innerHTML += `
                <a href="#${brand.key}" class="block group transform hover:-translate-y-1 transition-all">
                    <div class="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex justify-between items-center">
                        <span class="font-bold text-gray-800 text-lg group-hover:text-brandGreen">${brand.name}</span>
                        <span class="${statusColor} text-xs font-bold px-3 py-1 rounded-full">${statusText}</span>
                    </div>
                </a>`;
        });
    }

    /**
     * 渲染產品列表 (包含複雜邏輯)
     */
    function renderProducts(brands, allProducts) {
        if (!productContainer) return;
        productContainer.innerHTML = '';

        brands.forEach(brand => {
            if (brand.status === 'inactive') return; // 若品牌狀態為 "inactive"，完全不渲染該區塊
            // 篩選邏輯：同品牌 + (非缺貨 OR 有 Tag)
            const brandProducts = allProducts.filter(p => {
                const isStatusOut = p.status === 'out-of-stock';
                const hasTag = (p.tag && p.tag.trim() !== '');
                // 如果是 out-of-stock 且沒有 Tag，就過濾掉 (不顯示)
                if (isStatusOut && !hasTag) return false;
                return p.brand_key === brand.key;
            });

            const section = document.createElement('section');
            section.id = brand.key;
            section.className = "container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl scroll-mt-28 mb-16";

            let productCardsHTML = '';
            const isBrandOut = brand.status === 'out-of-stock';
            if (isBrandOut || brandProducts.length === 0) {
                // 若品牌狀態為 out-of-stock，即使有商品資料也一律隱藏，改顯示「缺貨中」訊息
                productCardsHTML = `<p class="text-gray-400 text-center col-span-full py-8 font-medium">尚無品項或是缺貨中</p>`;
            } else {
                brandProducts.forEach(p => {
                    const isStatusOut = p.status === 'out-of-stock';
                    const isStockZero = (p.stock === 0 || p.stock === '0');
                    const hasTag = (p.tag && p.tag.trim() !== '');

                    // 1. 標籤顯示邏輯 (Tag 優先於 Stock)
                    let badge = '';
                    if (hasTag) {
                        badge = `<span class="absolute top-3 right-3 bg-brandGreen text-white text-xs font-bold px-2.5 py-1 rounded-full">${p.tag}</span>`;
                    } else if (isStockZero) {
                        badge = `<span class="absolute top-3 right-3 bg-gray-300 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-full">缺貨中</span>`;
                    }

                    // 2. 價格顯示邏輯 (out-of-stock 隱藏價格)
                    let priceHTML = '';
                    if (isStatusOut) {
                        priceHTML = `<p class="text-gray-400 text-sm">暫不提供價格</p>`;
                    } else {
                        if (p.price_multi > 0 && p.price_multi < p.price) {
                            priceHTML = `
                                <div class="price-discount">
                                    <span class="price-original">單罐: NT$ ${p.price.toLocaleString()}</span>
                                    <span class="text-brandGreen price-current">2罐起單價: NT$ ${p.price_multi.toLocaleString()}</span>
                                </div>`;
                        } else {
                            priceHTML = `<p class="text-brandGreen price-current">NT$ ${p.price.toLocaleString()}</p>`;
                        }
                    }

                    // 3. 品名與規格樣式 (灰色小字)
                    const displayName = `
                        ${p.name.replace(/KEICHA/g, '<span class="font-brand-text">KEICHA</span>')} 
                        ${p.spec ? `<span class="text-sm font-normal text-gray-500 ml-1">${p.spec}</span>` : ''}
                    `;

                    // [新增] 圖片顯示邏輯
                    let imgHTML = '';
                    if (p.image_url) {
                        imgHTML = `
                            <div class="h-48 overflow-hidden bg-gray-50">
                                <img src="${p.image_url}" class="w-full h-full object-cover" loading="lazy">
                            </div>
                        `;
                    }

                    // [移除] 限購提醒 (由使用者要求隱藏)
                    let limitHTML = '';

                    const cardClass = isStatusOut || isStockZero ? 'bg-gray-100 opacity-80' : 'bg-white transform hover:scale-105';

                    productCardsHTML += `
                        <div class="${cardClass} relative shadow-lg rounded-lg overflow-hidden transition-all duration-300 flex flex-col">
                            ${badge}
                            ${imgHTML}
                            <div class="p-6 flex-grow">
                                <h3 class="text-xl font-bold mb-2">${displayName}</h3>
                                ${p.note ? `<p class="text-sm text-gray-500">${p.note.replace(/KEICHA/g, '<span class="font-brand-text">KEICHA</span>')}</p>` : ''}
                                ${limitHTML}
                            </div>
                            <div class="bg-gray-50 px-6 py-4 border-t border-gray-200">
                                ${priceHTML}
                            </div>
                        </div>`;
                });
            }

            section.innerHTML = `
                <h2 class="text-2xl font-bold text-center mb-10">${brand.name}</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${productCardsHTML}
                </div>`;
            productContainer.appendChild(section);
        });
    }

    /**
     * 生成 SEO 結構化資料
     */
    function renderSEO(brands) {
        const container = document.getElementById('structured-data-container');
        if (!container) return;
        const schema = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "KEICHA 抹茶代購總覽",
            "itemListElement": brands.map((b, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "name": b.name,
                "url": `/maccha.html#${b.key}`
            }))
        };
        container.innerHTML = `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
    }
});
