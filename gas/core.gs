/**
 * KEICHA 核心後端系統 (整合版)
 * 包含：自填單/快速結帳、會員系統、DB_Query同步、Email一鍵確認、後台設定更新
 */

// ================= 全域設定 =================
const SS = SpreadsheetApp.getActiveSpreadsheet();
// [重要] 請在部署後，確認你的 Web App 網址是否需要更新，如果專案ID沒變通常不用動
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyUq36i64Z-JGcERE_rZOdphVtVDX8L-lguc7eiUIdoAERqI1ZK8GWAL-HgbC75cuMHFg/exec"; 

const SHEET_ORDERS = "orders";
const SHEET_MEMBERS = "members";
const SHEET_DB = "DB_Query";
const SHEET_CONFIG = "config_fast_checkout";

// ==========================================
// 1. GET 請求入口：處理 查詢、確認、讀取系統資料
// ==========================================
function doGet(e) {
  try {
    const params = e.parameter;

    // --- A. [新增] 訂單查詢功能 ---
    // 支援 ?action=query&orderId=... (單筆) 或 ?action=query&phone=... (歷史)
    if (params.action === "query") {
      return handleOrderQuery(params);
    }

    // --- B. [原有] 點擊 Email 的「一鍵確認」按鈕 ---
    if (params.action === "confirm" && params.id) {
      return handleOrderConfirm(params.id);
    }

    // --- C. [原有] 前端頁面撈取資料 (商品、運費、設定、快速結帳設定) ---
    return getSystemData();

  } catch (err) {
    // 錯誤處理：嘗試回傳 JSON
    if (typeof response === 'function') {
        return response({ success: false, msg: "讀取失敗: " + err.toString() });
    } else {
        return ContentService.createTextOutput(JSON.stringify({ success: false, msg: err.toString() })).setMimeType(ContentService.MimeType.JSON);
    }
  }
}

// ==========================================
// 2. [新增] 處理訂單查詢邏輯 (含電話正規化)
// ==========================================
function handleOrderQuery(params) {
  const qId = params.orderId ? String(params.orderId).trim() : ""; 
  const qPhone = params.phone ? String(params.phone).trim() : ""; 
  
  if (!qId && !qPhone) {
    return response({ success: false, msg: "請提供訂單編號或手機號碼" });
  }

  const dbSheet = SS.getSheetByName("DB_Query"); 
  if (!dbSheet) {
    return response({ success: false, msg: "資料庫維護中 (DB_Query Missing)" });
  }

  const data = dbSheet.getDataRange().getValues();
  const results = [];

  // 電話清洗函式：移除非數字，補齊0
  const normalizePhone = (p) => {
    if (!p) return "";
    let clean = String(p).replace(/\D/g, ''); 
    if (clean.length === 9 && clean.startsWith('9')) {
      clean = '0' + clean; 
    }
    return clean;
  };

  const targetPhone = normalizePhone(qPhone);

  // 倒序搜尋 (從最新資料找起)
  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    const rowId = String(row[0]).trim();
    const rowPhone = normalizePhone(row[5]); // 第6欄是電話

    let match = false;

    // 模式 1: 單號查詢
    if (qId && rowId === qId) {
      match = true;
    }
    // 模式 2: 電話查詢
    else if (targetPhone && rowPhone === targetPhone) {
      match = true;
    }

    if (match) {
      // 僅回傳安全欄位
      const item = {
        orderId: row[0],
        item: row[1],
        amount: row[2],
        status: row[3],
        sellerNote: row[4]
      };
      results.push(item);
      
      if (qId) break; // 單號查詢找到一筆即可停止
    }
  }

  if (results.length > 0) {
    return response({ success: true, data: results });
  } else {
    return response({ success: false, msg: "查無符合的訂單資料" });
  }
}

// ==========================================
// 3. [原有] 處理訂單確認 (Web 介面)
// ==========================================
function handleOrderConfirm(orderId) {
  const orderSheet = SS.getSheetByName(SHEET_ORDERS);
  const data = orderSheet.getDataRange().getValues();
  const COL_ORDER_ID = 12; // M欄 (index 12)
  const COL_STATUS = 13;   // N欄 (index 13)
  
  let found = false;
  let rowData = [];

  // 搜尋訂單
  for (let i = 1; i < data.length; i++) {
    if (data[i][COL_ORDER_ID] == orderId) {
      // 更新母表狀態
      orderSheet.getRange(i + 1, COL_STATUS + 1).setValue("已確認");
      rowData = data[i];
      rowData[COL_STATUS] = "已確認"; // 更新記憶體資料以便同步
      found = true;
      break;
    }
  }

  if (found) {
    // 同步更新 DB_Query (請確保您有定義 syncToQueryDB 函式，若無則需補上)
    if (typeof syncToQueryDB === 'function') {
        syncToQueryDB(orderId, rowData, "已確認");
    }
    
    // 回傳 HTML 畫面
    return HtmlService.createHtmlOutput(`
      <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
        <h1 style="color: #6ea44c;">訂單 ${orderId} 確認成功！</h1>
        <p>系統狀態已更新。</p>
        <button onclick="window.close()" style="padding:10px 20px; cursor:pointer;">關閉視窗</button>
      </div>
    `);
  } else {
    return HtmlService.createHtmlOutput("<h3>找不到訂單編號，可能已被刪除。</h3>");
  }
}

// ==========================================
// 4. [原有] 撈取系統資料 (API 回傳) - 包含快速結帳設定
// ==========================================
function getSystemData() {
  // 1. [已移除] 抓取商品 (products) 邏輯

  // 2. 抓取運費規則 (shipping_rules)
  const rData = SS.getSheetByName("shipping_rules").getDataRange().getValues();
  const shippingRules = rData.slice(1).map(row => ({
    method: row[0] instanceof Date ? "7-11" : row[0].toString().trim(),
    category: row[1].toString().trim(),
    base: row[2],
    t1: row[3], f1: row[4],
    t2: row[5], f2: row[6],
    t3: row[7], f3: row[8]
  }));

  // 3. 抓取快速結帳設定 (config_fast_checkout)
  const cSheet = SS.getSheetByName(SHEET_CONFIG);
  const cRow = cSheet.getRange(2, 1, 1, 12).getValues()[0];
  const fastConfig = {
    status: cRow[0],
    items_text: cRow[1],
    amount: cRow[2],
    enable_711: cRow[3],
    enable_fami: cRow[4],
    enable_home: cRow[5],
    is_free_shipping: cRow[6],
    use_uniform_fee: cRow[7],
    uniform_fee: cRow[8],
    fee_711: cRow[9],
    fee_fami: cRow[10],
    fee_home: cRow[11]
  };

  return response({
    success: true,
    products: [], // <--- 改回傳空陣列，避免前端 JavaScript 報錯
    shipping_rules: shippingRules,
    fast_config: fastConfig
  });
}

// ==========================================
// 5. 輔助函式：標準回傳格式
// ==========================================
function response(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ================= 2. POST 請求：登入、結帳、後台更新 =================
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    
    // --- 動作：會員查詢 (Login) ---
    if (action === "login") {
      return handleMemberLogin(params.phone);
    }

    // --- 動作：訂單結帳 (Checkout) ---
    if (action === "checkout") {
      return handleCheckout(params);
    }

    // --- 動作：更新快速結帳設定 (Admin) ---
    // [新增] 支援 admin_fast.html 的寫入請求
    if (action === "updateFastConfig") {
      return updateFastConfig(params);
    }

    return response({ success: false, msg: "無效 Action" });

  } catch (err) {
    return response({ success: false, msg: "系統異常: " + err.toString() });
  }
}

// 處理會員查詢
function handleMemberLogin(phone) {
  if (!phone) return response({ success: false, msg: "缺少電話號碼" });
  
  const mSheet = SS.getSheetByName(SHEET_MEMBERS);
  const data = mSheet.getDataRange().getValues();
  // 欄位對應: Phone(0), Name(1), Email(2), Store711(3), Note711(4), StoreFami(5), NoteFami(6), Address(7)
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim() === phone.toString().trim()) {
      const u = data[i];
      return response({
        success: true,
        data: {
          phone: u[0], name: u[1], email: u[2],
          store_711: u[3], store_711_note: u[4],
          store_fami: u[5], store_fami_note: u[6],
          shipping_address: u[7]
        }
      });
    }
  }
  // 沒找到會員
  return response({ success: true, isNew: true, data: { phone: phone } });
}

// 處理結帳主邏輯
function handleCheckout(params) {
  const orderSheet = SS.getSheetByName(SHEET_ORDERS);
  
  // 1. 生成訂單編號
  const now = new Date();
  const orderId = Utilities.formatDate(now, "GMT+8", "yyMMddHHmmss");
  const status = "待確認"; 
  
  // 2. 準備寫入 orders
  const orderRow = [
    params.name,              // 0
    "'" + params.phone,       // 1: 手機
    "'" + params.store,       // 2 (強制轉為字串保護 0)
    params.temp || "常溫",     // 3
    params.items,             // 4: 明細
    params.subtotal,          // 5: 金額
    params.shipping,          // 6
    params.date,              // 7
    params.note || params.product_note || "", // <--- 修正這行：優先抓 note
    params.line_name,         // 9
    params.logistics,         // 10
    params.email,             // 11
    orderId,                  // 12
    status,                   // 13
    "",                       // 14: 賣家留言
    params.join_member ? "TRUE" : "FALSE" // 15
  ];
  
  orderSheet.appendRow(orderRow);

  // 3. 同步寫入 DB_Query
  syncToQueryDB(orderId, orderRow, status);

  // 4. 更新或新增會員
  if (params.join_member) {
    updateMemberData(params);
  }

  // 確保 note 欄位統一，讓信件範本能讀到
  params.note = params.note || params.product_note || "";

  // 5. 發送確認信
  try {
    sendOrderEmails(params, orderId, now);
  } catch (e) {
    console.error("Email Error", e);
  }

  return response({ success: true, orderId: orderId, msg: "訂單建立成功" });
}

// [新增] 更新快速結帳設定 (Admin用)
function updateFastConfig(p) {
  // 簡易驗證密碼
  if (p.password !== '1808') { 
    return response({ success: false, msg: "密碼錯誤" });
  }

  const sheet = SS.getSheetByName(SHEET_CONFIG);
  if (!sheet) return response({ success: false, msg: "找不到設定表" });

  // 準備寫入 A2:L2 的資料
  // 順序與 Sheet 欄位嚴格對應
  const rowData = [
    p.status,           // A
    p.items_text,       // B
    p.amount,           // C
    p.enable_711,       // D
    p.enable_fami,      // E
    p.enable_home,      // F
    p.is_free_shipping, // G
    p.use_uniform_fee,  // H
    p.uniform_fee,      // I
    p.fee_711,          // J
    p.fee_fami,         // K
    p.fee_home          // L
  ];

  // 寫入資料到第 2 列
  sheet.getRange(2, 1, 1, 12).setValues([rowData]);

  return response({ success: true, msg: "設定已更新" });
}

// ================= 3. 輔助功能：DB同步、會員更新、Email =================

// 同步到 DB_Query
function syncToQueryDB(orderId, sourceRow, status) {
  const dbSheet = SS.getSheetByName(SHEET_DB);
  
  const info = sourceRow[4];
  const amount = sourceRow[5];
  const sellerNote = sourceRow[14]; // O欄
  
  // 修正：確保電話號碼前面一定有單引號 ' 保護，這樣 0 就不會消失
  let phone = sourceRow[1] ? sourceRow[1].toString() : "";
  if (phone && !phone.startsWith("'")) {
    phone = "'" + phone;
  }

  const dbRow = [orderId, info, amount, status, sellerNote, phone];
  
  // 檢查是否已存在 (用 ID)
  const data = dbSheet.getDataRange().getValues();
  let found = false;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == orderId) {
      dbSheet.getRange(i + 1, 1, 1, 6).setValues([dbRow]);
      found = true;
      break;
    }
  }
  
  if (!found) {
    dbSheet.appendRow(dbRow);
  }
}

// 更新會員資料 (修正版：保護舊有物流資料不被覆蓋)
function updateMemberData(p) {
  const mSheet = SS.getSheetByName(SHEET_MEMBERS);
  const data = mSheet.getDataRange().getValues();
  let rowIndex = -1;
  const phone = p.phone.toString().trim();

  // 1. 先找會員在哪一列
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim() === phone) {
      rowIndex = i + 1;
      break;
    }
  }

  const now = new Date();
  
  // 2. 初始化變數：預設為本次訂單的姓名與 Email
  let uName = p.name;
  let uEmail = p.email;
  
  // 初始化物流資料為 "空字串" (針對新會員)
  let u711 = "", u711n = "";
  let uFami = "", uFamin = "";
  let uAddr = "";
  let uCreated = now; // 預設註冊時間為現在

  // 3. 【關鍵步驟】如果是舊會員，先強制「讀取並繼承」所有舊資料
  if (rowIndex > -1) {
    const oldRow = data[rowIndex-1]; // 取得舊的那一行資料
    
    // 欄位對應: Phone(0), Name(1), Email(2), 711(3), 711Note(4), Fami(5), FamiNote(6), Addr(7), Created(8)
    
    // 姓名 Email：如果這次有填就用這次的，沒填(理論上不會)就保留舊的
    uName = uName || oldRow[1];
    uEmail = uEmail || oldRow[2];

    // 物流資料：先全部繼承舊的！(防止被清空)
    u711 = oldRow[3];
    u711n = oldRow[4];
    uFami = oldRow[5];
    uFamin = oldRow[6];
    uAddr = oldRow[7];
    uCreated = oldRow[8]; // 保留原始註冊時間
  }

  // 4. 針對「本次」使用的物流，進行覆蓋更新
  // (沒選到的物流方式，因為上面已經繼承了舊資料，所以會保持原樣)
  if (p.logistics.includes("7-11")) {
    u711 = "'" + p.store; // 加入單引號 
    u711n = p.store_note || ""; 
  } else if (p.logistics.includes("全家")) {
    uFami = "'" + p.store; // 加入單引號
    uFamin = p.store_note || ""; 
  } else {
    // 宅配
    uAddr = p.store;
  }

  // 5. 組合最終資料列
  const newRow = [
    "'" + phone,  // Phone
    uName,        // Name
    uEmail,       // Email
    u711,         // Store 7-11 (混合了舊資料與新更新)
    u711n,        // Note 7-11
    uFami,        // Store Fami (混合了舊資料與新更新)
    uFamin,       // Note Fami
    uAddr,        // Address
    uCreated,     // Created Date
    now           // Updated Date (本次更新時間)
  ];

  // 6. 寫入
  if (rowIndex === -1) {
    mSheet.appendRow(newRow); // 新會員
  } else {
    mSheet.getRange(rowIndex, 1, 1, 10).setValues([newRow]); // 舊會員更新
  }
}

// 發送訂單確認信
function sendOrderEmails(order, orderId, date) {
  const SENDER_ALIAS = "keicha.nihoncha@gmail.com"; 
  const ADMIN_EMAIL = "wj209ing@gmail.com";         
  const BRAND_COLOR = "#6ea44c";
  const LINE_ID = "@366qwylw";
  const LINE_LINK = "https://lin.ee/CffHu2o";
  
  const subtotal = parseInt(order.subtotal);
  const shipping = parseInt(order.shipping);
  const total = subtotal + shipping;
  const confirmLink = `${WEB_APP_URL}?action=confirm&id=${orderId}`;

  // 訂單明細內容（訂單編號移動至首列）
  const recipientBlock = `
    <div style="margin-bottom: 20px;">
      <p style="margin: 0; line-height: 1.6; font-weight: bold; color: #334155;">訂單編號：${orderId}</p>
      <p style="margin: 0; line-height: 1.6;">取件人姓名：${order.name}</p>
      <p style="margin: 0; line-height: 1.6;">取件人手機：${order.phone}</p>
    </div>
  `;

  const logisticsBlock = `
    <div style="margin-bottom: 20px;">
      <h4 style="margin: 0 0 5px 0; font-size: 14px; color: #555;">物流資訊</h4>
      <p style="margin: 0; line-height: 1.6;">物流方式：${order.logistics}</p>
      <p style="margin: 0; line-height: 1.6;">取件店號/地址：${order.store}</p>
    </div>
  `;

  const itemsBlock = `
    <div style="margin-bottom: 20px;">
      <h4 style="margin: 0 0 5px 0; font-size: 14px; color: #555;">商品內容</h4>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; line-height: 1.6;">
        ${order.items.replace(/\n/g, '<br>')}
        ${ order.note ? `<div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ccc; color: #666; font-size: 13px;"><strong>商品備註：</strong><br>${order.note}</div>` : '' }
      </div>
    </div>
  `;

  const sellerMessageBlock = order.seller_note ? `
    <div style="margin-bottom: 20px; border: 1px solid ${BRAND_COLOR}; padding: 15px; border-radius: 5px;">
      <h4 style="margin: 0 0 5px 0; font-size: 14px; color: ${BRAND_COLOR};">訂單備註</h4>
      <p style="margin: 0; color: #333;">${order.seller_note}</p>
    </div>
  ` : '';

  // 買家信件內容 (新樣式)
  const buyerSubject = `KEICHA 訂單確認通知 (${orderId})`;
  const buyerBody = `
    <!DOCTYPE html><html><head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1.8;color:#334155;background-color:#ffffff">
      <div style="width:100%;max-width:600px;margin:0 auto;background:#fff">
        <div style="padding:20px">
          <div style="border-bottom:2px solid ${BRAND_COLOR};padding-bottom:12px;margin-bottom:25px">
            <h2 style="color:${BRAND_COLOR};margin:0;font-size:20px">訂單確認通知</h2>
          </div>
          <div style="margin-bottom:25px;font-size:15px;color:#334155">
            您好：<br><br>您的訂單已成功送出，以下是您的訂單明細：
          </div>
          
          ${recipientBlock} ${logisticsBlock} ${itemsBlock}
          <div style="margin-bottom: 20px;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: ${BRAND_COLOR};">總計金額：NT$ ${total}</p>
          </div>
          ${sellerMessageBlock}

          <div style="margin:25px 0;font-size:15px;color:#334155">將此訂單資料截圖傳送到<strong style="color: #334155; font-weight: bold;">官方帳號</strong>：<br>LINE ID: ${LINE_ID}</div>
<div style="margin: 30px 0;">
  <a href="${LINE_LINK}" target="_blank" style="display: block; text-align: center; padding: 12px 0; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 16px; background-color: ${BRAND_COLOR}; color: #ffffff; border: 1px solid ${BRAND_COLOR}; box-sizing: border-box;">
    加入好友
  </a>
</div>

          <div style="border-top:1px solid #eee;padding-top:30px;text-align:center">
            <p style="font-size:11px;color:#94a3b8;margin:0">如有疑問請聯絡 LINE 官方帳號</p>
            <p style="font-size:11px;color:#94a3b8;margin:4px 0 20px;font-weight:bold">${LINE_ID}</p>
            <img src="https://keicha2025.github.io/keicha/images/KEICHA_logotype.png" alt="KEICHA" width="120" style="display:block;margin:10px auto;border:0">
            <p style="font-size:9px;color:#cbd5e1;margin-top:15px;letter-spacing:3px">© 2025 KEICHA ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </div>
    </body></html>
  `;

  // 管理員信件內容 (新樣式，改為「確認訂單」)
  const adminSubject = `[新訂單] ${order.name} - $${total}`;
  const adminBody = `
    <!DOCTYPE html><html><head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1.8;color:#334155;background-color:#ffffff">
      <div style="width:100%;max-width:600px;margin:0 auto;background:#fff">
        <div style="padding:20px">
          <div style="border-bottom:2px solid ${BRAND_COLOR};padding-bottom:12px;margin-bottom:25px">
            <h2 style="color:${BRAND_COLOR};margin:0;font-size:20px">新訂單通知</h2>
          </div>
          
          ${recipientBlock} ${logisticsBlock} ${itemsBlock}
          <div style="margin-bottom: 20px; background-color: #fff3cd; padding: 15px; border-radius: 5px; color: #856404;">
            <p style="margin: 5px 0;">商品小計：NT$ ${subtotal}</p>
            <p style="margin: 5px 0;">運費金額：NT$ ${shipping}</p>
            <p style="margin: 10px 0 0 0; font-size: 16px; font-weight: bold;">總計金額：NT$ ${total}</p>
          </div>
          ${sellerMessageBlock}

    <div style="margin: 30px 0;">
      <a href="${confirmLink}" target="_blank" style="display: block; text-align: center; padding: 12px 0; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 14px; background-color: ${BRAND_COLOR}; color: #ffffff; border: 2px solid ${BRAND_COLOR}; box-sizing: border-box;">
    確認訂單
      </a>
    </div>

          <div style="border-top:1px solid #eee;padding-top:30px;text-align:center">
            <img src="https://keicha2025.github.io/keicha/images/KEICHA_logotype.png" alt="KEICHA" width="120" style="display:block;margin:10px auto;border:0">
            <p style="font-size:11px;color:#94a3b8;margin-top:10px;">KEICHA 系統後台自動發送</p>
          </div>
        </div>
      </div>
    </body></html>
  `;

  // 寄送
  if (order.email && order.email.includes('@')) {
    GmailApp.sendEmail(order.email, buyerSubject, '', { htmlBody: buyerBody, from: SENDER_ALIAS, name: 'KEICHA' });
  }
  GmailApp.sendEmail(ADMIN_EMAIL, adminSubject, '', { htmlBody: adminBody });
}

function response(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}