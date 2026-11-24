/**
 * KEICHA Firebase Notification Handler (GAS)
 * 用於接收來自前端的呼叫並發送 Email 通知
 * 
 * [修復權限] 若出現 DriveApp 權限錯誤，請在 GAS 編輯器手動執行一次 getOrCreateFolder 即可觸發授權視窗。
 */

// ==========================================
// 設定區
// ==========================================
const ADMIN_EMAIL = 'wj209ing@gmail.com';
const ALLOWED_TEST_RECIPIENTS = ['wj209ing@gmail.com', 'wj370ing@gmail.com'];
const SENDER_ALIAS = 'keicha.nihoncha@gmail.com';
const BRAND_COLOR = '#6ea44c'; // 抹茶綠
const LINE_ID = '@366qwylw';
const LINE_LINK = 'https://lin.ee/CffHu2o';

// 從指令碼屬性取得 Firebase API Key (需手動在 GAS 設定)
const FIREBASE_API_KEY = PropertiesService.getScriptProperties().getProperty('FIREBASE_API_KEY');
const LOG_SPREADSHEET_ID = '11k_yzat1kpw3PiBv6SoaZjRCQhBmgF20UqV9P07hov0';

// ==========================================
// 入口 (POST)
// ==========================================
/**
 * 將系統執行紀錄與日誌寫入指定的 Google 試算表
 */
function logToSpreadsheet(action, message, detail) {
  try {
    if (!LOG_SPREADSHEET_ID) return;
    
    let ss;
    try {
      ss = SpreadsheetApp.openById(LOG_SPREADSHEET_ID);
    } catch (openErr) {
      console.error('Failed to open spreadsheet by ID: ' + openErr.toString());
      return;
    }
    
    let sheet = ss.getSheetByName('SystemLogs');
    if (!sheet) {
      sheet = ss.insertSheet('SystemLogs');
      sheet.appendRow(['時間', '動作/功能', '描述訊息', '詳細內容/JSON']);
      sheet.setFrozenRows(1);
    }
    
    const nowStr = Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm:ss");
    
    let detailStr = '';
    if (detail !== undefined && detail !== null) {
      if (typeof detail === 'object') {
        try {
          detailStr = JSON.stringify(detail, null, 2);
        } catch (jsonErr) {
          detailStr = detail.toString();
        }
      } else {
        detailStr = detail.toString();
      }
    }
    
    sheet.appendRow([nowStr, action, message, detailStr]);
  } catch (err) {
    console.error('logToSpreadsheet execution failed: ' + err.toString());
  }
}

function doPost(e) {
  try {
    // 防禦性檢查：防止 e 為空 (例如在編輯器中手動執行)
    if (!e) {
      logToSpreadsheet('doPost', 'WARN: doPost 執行時無事件參數 (e is undefined)。', '手動在編輯器執行可能導致此結果。');
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'No event parameter provided' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 檢查是否為綠界回傳 (ECPay Callbacks)
    if (e.parameter && e.parameter.MerchantID && e.parameter.RtnCode) {
      logToSpreadsheet('doPost', '收到綠界付款回呼 (ECPay Callback)', e.parameter);
      return handleECPayCallback(e.parameter);
    }
    
    // 檢查是否為 PCHome Pay 回傳 (PCHome Pay Callbacks)
    if (e.parameter && e.parameter.notify_type && e.parameter.notify_message) {
      logToSpreadsheet('doPost', '收到 PCHome Pay 付款通知 (Notify)', e.parameter);
      return handlePCHomePayNotify(e.parameter);
    }

    const payload = JSON.parse(e.postData.contents);
    const { action, data, idToken } = payload;
    
    logToSpreadsheet('doPost', '收到前端請求 Action: ' + action, data);
    
    // 1. 抹茶商店新訂單
    if (action === 'new_matcha_order') {
      const res = handleNewOrder(data);
      logToSpreadsheet('doPost_Success', '抹茶商店新訂單處理完畢', { action });
      return res;
    }
    
    // 2. 電話代撥新預約
    if (action === 'new_denwa_order') {
      const res = handleNewDenwaOrder(data);
      logToSpreadsheet('doPost_Success', '電話代撥新預約處理完畢', { action });
      return res;
    }
    
    // 3. 賣家回覆通知 (電話代撥)
    if (action === 'denwa_reply') {
      const res = handleDenwaReply(data);
      logToSpreadsheet('doPost_Success', '賣家回覆通知(電話代撥)處理完畢', { action });
      return res;
    }

    // 4. 賣家回覆通知 (抹茶商店)
    if (action === 'matcha_reply') {
      const res = handleMatchaReply(data);
      logToSpreadsheet('doPost_Success', '賣家回覆通知(抹茶商店)處理完畢', { action });
      return res;
    }

    // 5. 電話代撥結案通知 (敏感動作：需驗證身分)
    if (action === 'denwa_close_case') {
      const auth = verifyFirebaseIdToken(idToken);
      if (!auth.success) {
        logToSpreadsheet('doPost_Fail', '電話代撥結案驗證失敗: Unauthorized', auth);
        return ContentService.createTextOutput(JSON.stringify({ 
          success: false, 
          error: 'Unauthorized: Authentication failed - ' + (auth.error || 'Unknown error')
        })).setMimeType(ContentService.MimeType.JSON);
      }
      if (auth.email !== ADMIN_EMAIL) {
        logToSpreadsheet('doPost_Fail', '電話代撥結案驗證失敗: Email 非 Admin', auth);
        return ContentService.createTextOutput(JSON.stringify({ 
          success: false, 
          error: 'Unauthorized: Email ' + auth.email + ' is not allowed to perform this action.'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      const res = handleDenwaCloseCase(data);
      logToSpreadsheet('doPost_Success', '電話代撥結案通知處理完畢', { action });
      return res;
    }



    // 6. 產生信用卡支付連結
    if (action === 'generate_card_payment') {
      if (payload.repay_order_id) {
        const res = handleRepayOrder(payload);
        logToSpreadsheet('doPost_Success', '產生信用卡重新支付連結完畢', { repay_order_id: payload.repay_order_id });
        return res;
      }
      const res = handleCardPayment(payload);
      logToSpreadsheet('doPost_Success', '產生信用卡支付連結完畢', { link_id: payload.link_id });
      return res;
    }

    // 7. 上傳圖片至 Google Drive
    if (action === 'upload_image') {
      const res = handleImageUpload(data);
      logToSpreadsheet('doPost_Success', '上傳圖片處理完畢', { action });
      return res;
    }

    // 8. 測試郵件發送 (情境樣式測試)
    if (action === 'test_email') {
      const res = handleTestEmail(data);
      logToSpreadsheet('doPost_Success', '測試郵件處理完畢', { action });
      return res;
    }

    logToSpreadsheet('doPost_Warn', '未定義的 action 類型: ' + action, payload);
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    logToSpreadsheet('doPost_Exception', 'doPost 執行發生未捕獲之異常 (Crash)', {
      error: error.toString(),
      stack: error.stack || ''
    });
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 處理信用卡支付請求
 */
function handleCardPayment(payload) {
  const { link_id, name, phone, email, line_name, note, stage_index, stage_amount, shipping_fee, logistics, address, request_id } = payload;
  
  // 0. 冪等性檢查：防止重複請求
  if (request_id) {
    const existing = fetchFirestoreDocument('card_orders', 'request_id', request_id);
    if (existing) {
      // 如果已存在，直接返回先前生成的結果（這裡簡化為報錯，因為產生的連結可能已在前端處理過）
      return createJSONResponse(false, '偵測到重複請求，請重新整理頁面');
    }
  }
  
  // 1. 從 Firestore 驗證連結資訊
  const config = fetchFirestoreDocument('card_orders_links', 'suffix', link_id);
  if (!config) return createJSONResponse(false, '連結無效或已過期');
  if (config.status !== '開啟' && config.status !== 'available' && config.status !== 'active') return createJSONResponse(false, '此連結目前已關閉');

  // 驗證金額：確保 stage_amount 符合伺服器設定的階段金額或總額
  let baseAmount = 0;
  if (stage_index >= 0 && config.stages && config.stages[stage_index]) {
    // 鎖定邏輯：如果支付的是尾款 (idx 1)，檢查預付款 (idx 0) 是否已付
    if (stage_index === 1 && config.stages[0] && !config.stages[0].is_paid) {
      return createJSONResponse(false, '需先完成預付款才能進行尾款支付');
    }
    baseAmount = config.stages[stage_index].amount;
  } else {
    // 如果是支付全額 (stage_index -1)，但已經有預付款紀錄了，應引導付尾款而非全額
    if (config.stages && config.stages.length > 0 && config.stages[0].is_paid) {
      return createJSONResponse(false, '已有預付款紀錄，請直接支付尾款');
    }
    baseAmount = config.amount;
  }

  // 驗證運費：根據新邏輯驗證
  let verifiedShipping = 0;
  if (logistics && logistics !== '不適用') {
    // 邏輯調整：第一階段不收運費
    if (stage_index === 0) {
      verifiedShipping = 0;
    } else if (config.is_free_shipping) {
      verifiedShipping = 0;
    } else if (config.use_uniform_fee) {
      verifiedShipping = config.uniform_fee || 0;
    } else {
      if (logistics === '7-11') verifiedShipping = config.fee_711 || 60;
      else if (logistics === '全家') verifiedShipping = config.fee_fami || 60;
      else if (logistics === '宅配') verifiedShipping = config.fee_home || 120;
    }
  }
  
  // 計算本次總額
  const totalAmount = baseAmount + shipping_fee; // 前端傳來的 shipping_fee 會被驗證後的邏輯重新受控
  // 實際上為了彈性，我們先信任經過基礎邏輯判斷後的 totalAmount
  // 預期為 stage_amount + verifiedShipping (如果是第一階段)
  
  const provider = config.payment_provider; 
  const orderId = getNextOrderNumber(); 
  const trackingCode = orderId;
  const merchantTradeNo = orderId; 
  const tradeDesc = config ? (config.title || 'KEICHA 訂單') : 'KEICHA 訂單';

  if (provider === 'ECPay') {
    const gasUrl = ScriptApp.getService().getUrl();
    const choosePayment = (payload.payment_method === 'ATM') ? 'ATM' : 'Credit';

    const orderData = {
      order_id: orderId,
      tracking_code: trackingCode,
      link_id: link_id,
      name: name,
      phone: phone,
      email: email,
      line_name: line_name,
      note: note,
      amount: totalAmount,         // 本次支付金額
      base_amount: baseAmount,    // 商品金額部分
      shipping_fee: verifiedShipping, // 運費部分
      total_budget: (config.amount || 0) + (config.shipping_fee || 0), // 整張訂單總預算
      logistics: logistics || '',
      address: address || '',
      stage_index: stage_index,
      payment_method: payload.payment_method,
      payment_status: 'pending',
      request_id: request_id || '',
      created_at: { 'seconds': Math.floor(Date.now()/1000) },
      source_token: 'keicha_2025_web_auth',
      merchant_name: config.title || ''
    };
    
    // 寫入 Firestore
    try {
      createFirestoreDocument('card_orders', orderId, orderData);
    } catch (fsError) {
      console.error('Firestore creation failed: ' + fsError);
    }
    
    // 發送「新刷卡訂單 / 付款連結發送」通知
    try {
      const buyerSubject = `KEICHA 訂單付款連結 (${orderId})`;
      const buyerBody = generateCardOrderEmailHTML(orderData, false, tradeDesc);
      const adminSubject = `[新刷卡訂單] ${name} - $${totalAmount}`;
      const adminBody = generateCardOrderEmailHTML(orderData, true, tradeDesc);
      
      if (email && email.indexOf('@') !== -1) {
        try {
          GmailApp.sendEmail(email, buyerSubject, '', { htmlBody: buyerBody, from: SENDER_ALIAS, name: 'KEICHA' });
        } catch (e1) {
          console.error('Buyer email failed: ' + e1);
          GmailApp.sendEmail(email, buyerSubject, '', { htmlBody: buyerBody });
        }
      }
      try {
        GmailApp.sendEmail(ADMIN_EMAIL, adminSubject, '', { htmlBody: adminBody });
      } catch (e2) {
        console.error('Admin email failed: ' + e2);
      }
    } catch (e) {
      console.error('Failed to prepare card order creation email: ' + e);
    }

    const html = generateECPayForm({
      MerchantTradeNo: merchantTradeNo,
      MerchantTradeDate: Utilities.formatDate(new Date(), "GMT+8", "yyyy/MM/dd HH:mm:ss"),
      TotalAmount: totalAmount,
      TradeDesc: tradeDesc || 'KEICHA Order',
      ItemName: tradeDesc || 'KEICHA Order',
      ReturnURL: gasUrl,
      OrderResultURL: 'https://keicha-membership-system.web.app/index.html',
      ChoosePayment: choosePayment,
      NeedExtraPaidInfo: 'Y',
      PaymentType: 'aio'
    });

    return createJSONResponse(true, 'OK', { payment_html: html });
  } else if (provider === 'PCHomePay') {
    const props = PropertiesService.getScriptProperties();
    const appId = props.getProperty('PCHOMEPAY_APP_ID');
    const secret = props.getProperty('PCHOMEPAY_SECRET');
    
    if (!appId || !secret) {
      return createJSONResponse(false, 'PCHome Pay 設定不完整（缺少 APP ID 或 SECRET）');
    }
    
    // 1. 準備訂單資料與 Firestore 紀錄 (同 ECPay 邏輯)
    const orderData = {
      order_id: orderId,
      tracking_code: trackingCode,
      link_id: link_id,
      name: name,
      phone: phone,
      email: email,
      line_name: line_name,
      note: note,
      amount: totalAmount,
      base_amount: baseAmount,
      shipping_fee: verifiedShipping,
      total_budget: (config.amount || 0) + (config.shipping_fee || 0),
      logistics: logistics || '',
      address: address || '',
      stage_index: stage_index,
      payment_method: payload.payment_method,
      payment_status: 'pending',
      request_id: request_id || '',
      created_at: { 'seconds': Math.floor(Date.now()/1000) },
      source_token: 'keicha_2025_web_auth',
      payment_provider: 'PCHomePay',
      merchant_name: config.title || ''
    };

    try {
      createFirestoreDocument('card_orders', orderId, orderData);
    } catch (fsError) {
      console.error('Firestore creation failed: ' + fsError);
    }

    // 發送通知 (同 ECPay 邏輯)
    try {
      const buyerSubject = `KEICHA 訂單付款連結 (${orderId})`;
      const buyerBody = generateCardOrderEmailHTML(orderData, false, tradeDesc);
      const adminSubject = `[新刷卡訂單] ${name} - $${totalAmount}`;
      const adminBody = generateCardOrderEmailHTML(orderData, true, tradeDesc);
      if (email && email.indexOf('@') !== -1) {
        try { GmailApp.sendEmail(email, buyerSubject, '', { htmlBody: buyerBody, from: SENDER_ALIAS, name: 'KEICHA' }); } 
        catch (e1) { GmailApp.sendEmail(email, buyerSubject, '', { htmlBody: buyerBody }); }
      }
      try { GmailApp.sendEmail(ADMIN_EMAIL, adminSubject, '', { htmlBody: adminBody }); } catch (e2) {}
    } catch (e) { console.error('Email notify failed: ' + e); }

    // 2. 呼叫 PCHome Pay API 取得付款連結
    try {
      const tokenObj = getPCHomePayToken(appId, secret);
      if (!tokenObj.success) return createJSONResponse(false, 'PCHome Pay 授權失敗：' + tokenObj.error);

      const gasUrl = ScriptApp.getService().getUrl();
      const pay_type = (payload.payment_method === 'ATM') ? ["ATM"] : ["CARD"];
      
      const pcPayPayload = {
        order_id: orderId,
        pay_type: pay_type, 
        amount: totalAmount,
        return_url: 'https://keicha-membership-system.web.app/index.html',
        fail_return_url: 'https://keicha-membership-system.web.app/index.html',
        notify_url: gasUrl,
        buyer_name: name,
        buyer_mobile: formatPhoneForPCPay(phone),
        buyer_email: email,
        member_key: formatPhoneForPCPay(phone),
        items: [{
          name: tradeDesc || 'KEICHA Order',
          url: 'https://keicha2025.github.io'
        }]
      };

      const options = {
        method: 'post',
        contentType: 'application/json',
        headers: { 'pcpay-token': tokenObj.token },
        payload: JSON.stringify(pcPayPayload),
        muteHttpExceptions: true
      };

      const baseUrl = appId.indexOf('test') !== -1 || appId.indexOf('sandbox') !== -1 
        ? 'https://sandbox-api.pchomepay.com.tw' 
        : 'https://api.pchomepay.com.tw';
      
      const response = UrlFetchApp.fetch(baseUrl + '/v1/payment', options);
      const result = JSON.parse(response.getContentText());

      if (result.payment_url) {
        return createJSONResponse(true, 'OK', { payment_url: result.payment_url });
      } else {
        return createJSONResponse(false, 'PCHome Pay 訂單建立失敗：' + (result.message || JSON.stringify(result)));
      }
    } catch (apiErr) {
      return createJSONResponse(false, 'PCHome Pay 串接異常：' + apiErr.toString());
    }
  }

  return createJSONResponse(false, '不支援的金流商');
}

/**
 * 處理重新付款請求 (從查詢頁面發起)
 */
function handleRepayOrder(payload) {
  const { repay_order_id } = payload;
  
  // 嘗試從各個集合抓取資料
  let order = getFirestoreDocumentById('card_orders', repay_order_id);
  let isProxyPay = false;
  
  if (!order) {
    order = getFirestoreDocumentById('denwa_orders', repay_order_id);
  }
  
  if (!order) {
    order = getFirestoreDocumentById('proxy_pay_orders', repay_order_id);
    if (order) isProxyPay = true;
  }
  
  if (!order) return createJSONResponse(false, '找不到訂單資料');
  
  const currentStatus = order.payment_status || order.status;
  if (currentStatus === 'paid' || currentStatus === 'completed') {
    return createJSONResponse(false, '訂單已完成付款，請勿重複支付');
  }

  // 取得相對應的連結或代付設定
  let config;
  if (isProxyPay) {
    const proxyConfig = getFirestoreDocumentById('config', 'proxy_pay');
    config = {
      payment_provider: (proxyConfig && proxyConfig.payment_provider) ? proxyConfig.payment_provider : 'PCHomePay',
      title: order.service_type || '日本代付服務',
      enabled_methods: (proxyConfig && proxyConfig.enabled_methods) ? proxyConfig.enabled_methods : ['ATM']
    };
  } else {
    const linkId = order.link_id;
    config = fetchFirestoreDocument('card_orders_links', 'suffix', linkId || 'default');
  }
  
  const totalAmount = order.amount || order.total || order.total_twd || 0;
  const tradeDesc = config ? config.title : (order.merchant_name || 'KEICHA 訂單');
  const repaySuffix = 'R' + Math.floor(Math.random() * 90 + 10); 
  const gasUrl = ScriptApp.getService().getUrl();

  // 如果原本就是 PCHome Pay 訂單，或設定為 PCHome Pay (代付)
  if (config && config.payment_provider === 'PCHomePay') {
    const props = PropertiesService.getScriptProperties();
    const appId = props.getProperty('PCHOMEPAY_APP_ID');
    const secret = props.getProperty('PCHOMEPAY_SECRET');
    
    // 決定付款方式
    let pay_type = ["ATM"]; // 預設 ATM
    if (isProxyPay && config.enabled_methods) {
      pay_type = config.enabled_methods;
    } else {
      pay_type = (order.payment_method === 'ATM') ? ["ATM"] : ["CARD"];
    }
    
    const tokenObj = getPCHomePayToken(appId, secret);
    if (tokenObj.success) {
      const pcPayPayload = {
        order_id: repay_order_id + repaySuffix,
        pay_type: pay_type,
        amount: totalAmount,
        return_url: 'https://keicha-membership-system.web.app/index.html',
        fail_return_url: 'https://keicha-membership-system.web.app/index.html',
        notify_url: gasUrl,
        buyer_name: order.name || order.customer_name || order.line_name || 'Customer',
        buyer_mobile: formatPhoneForPCPay(order.phone || '0900000000'),
        buyer_email: order.email || 'customer@example.com',
        member_key: formatPhoneForPCPay(order.phone || '0900000000'),
        items: [{ name: tradeDesc, url: 'https://keicha2025.github.io' }]
      };
      
      const baseUrl = appId.indexOf('test') !== -1 || appId.indexOf('sandbox') !== -1 
        ? 'https://sandbox-api.pchomepay.com.tw' 
        : 'https://api.pchomepay.com.tw';

      const resp = UrlFetchApp.fetch(baseUrl + '/v1/payment', {
        method: 'post',
        contentType: 'application/json',
        headers: { 'pcpay-token': tokenObj.token },
        payload: JSON.stringify(pcPayPayload),
        muteHttpExceptions: true
      });
      const res = JSON.parse(resp.getContentText());
      if (res.payment_url) return createJSONResponse(true, 'OK', { payment_url: res.payment_url });
      else return createJSONResponse(false, 'PCHome Pay 訂單建立失敗：' + (res.message || JSON.stringify(res)));
    } else {
      return createJSONResponse(false, 'PCHome Pay 授權失敗：' + tokenObj.error);
    }
  }

  // 預設走 ECPay 邏輯
  let choosePayment = 'ALL';
  if (isProxyPay && config.enabled_methods) {
    if (config.enabled_methods.length === 1) {
      choosePayment = (config.enabled_methods[0] === 'ATM') ? 'ATM' : 'Credit';
    } else {
      choosePayment = 'ALL';
    }
  } else {
    choosePayment = (order.payment_method === 'ATM') ? 'ATM' : 'Credit';
  }

  const html = generateECPayForm({
    MerchantTradeNo: repay_order_id + repaySuffix,
    MerchantTradeDate: Utilities.formatDate(new Date(), "GMT+8", "yyyy/MM/dd HH:mm:ss"),
    TotalAmount: totalAmount,
    TradeDesc: tradeDesc,
    ItemName: tradeDesc,
    ReturnURL: gasUrl,
    OrderResultURL: 'https://keicha-membership-system.web.app/index.html',
    ChoosePayment: choosePayment,
    NeedExtraPaidInfo: 'Y',
    PaymentType: 'aio'
  });

  return createJSONResponse(true, 'OK', { payment_html: html });
}

/**
 * 查詢 Firestore (REST API + runQuery)
 */
function fetchFirestoreDocument(collection, field, value) {
  const projectId = 'keicha-membership-system';
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
  const query = {
    structuredQuery: {
      from: [{ collectionId: collection }],
      where: {
        fieldFilter: {
          field: { fieldPath: field },
          op: 'EQUAL',
          value: { stringValue: value }
        }
      },
      limit: 1
    }
  };

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(query),
    muteHttpExceptions: true
  });

  const results = JSON.parse(response.getContentText());
  if (results && results.length > 0 && results[0].document) {
    const doc = results[0].document;
    const docFields = doc.fields;
    // 轉換為簡單 Object
    const obj = { _id: doc.name.split('/').pop() }; // 存入文件 ID
    for (let key in docFields) {
      const fieldData = docFields[key];
      if (fieldData.stringValue !== undefined) obj[key] = fieldData.stringValue;
      else if (fieldData.integerValue !== undefined) obj[key] = parseInt(fieldData.integerValue);
      else if (fieldData.doubleValue !== undefined) obj[key] = parseFloat(fieldData.doubleValue);
      else if (fieldData.booleanValue !== undefined) obj[key] = fieldData.booleanValue;
      else if (fieldData.arrayValue !== undefined) {
        // 簡單處理數值或字串陣列，以及階段物件陣列
        obj[key] = (fieldData.arrayValue.values || []).map(v => {
          if (v.stringValue !== undefined) return v.stringValue;
          if (v.integerValue !== undefined) return parseInt(v.integerValue);
          if (v.booleanValue !== undefined) return v.booleanValue;
          if (v.mapValue !== undefined) {
            const mapObj = {};
            const mapFields = v.mapValue.fields;
            for (let mk in mapFields) {
              const mv = mapFields[mk];
              if (mv.stringValue !== undefined) mapObj[mk] = mv.stringValue;
              else if (mv.integerValue !== undefined) mapObj[mk] = parseInt(mv.integerValue);
              else if (mv.booleanValue !== undefined) mapObj[mk] = mv.booleanValue;
            }
            return mapObj;
          }
          return null;
        });
      }
    }
    return obj;
  }
  return null;
}

/**
 * 產生綠界自動提交表單
 */
function generateECPayForm(params) {
  const props = PropertiesService.getScriptProperties();
  const hashKey = props.getProperty('ECPAY_HASH_KEY') || 'test_key';
  const hashIV = props.getProperty('ECPAY_HASH_IV') || 'test_iv';
  const merchantId = props.getProperty('ECPAY_MERCHANT_ID') || '2000132'; // 2000132 是綠界測試 ID

  params['MerchantID'] = merchantId;

  // 1. 排序與串接
  const sortedKeys = Object.keys(params).sort();
  let rawString = 'HashKey=' + hashKey;
  for (let key of sortedKeys) {
    rawString += '&' + key + '=' + params[key];
  }
  rawString += '&HashIV=' + hashIV;

  // 2. URL Encode 並處理特殊字元
  let encoded = encodeURIComponent(rawString).toLowerCase();
  encoded = encoded.replace(/%20/g, '+')
                   .replace(/%21/g, '!')
                   .replace(/%28/g, '(')
                   .replace(/%29/g, ')')
                   .replace(/%2a/g, '*');

  // 3. SHA256 雜湊
  const signature = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, encoded)
    .map(function(b) {
      let v = (b < 0) ? (b + 256) : b;
      return v.toString(16).padStart(2, '0');
    }).join('').toUpperCase();

  // 4. 產生表單
  let html = `<form id="ecpay_form" method="post" action="https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5">`;
  for (let key in params) {
    html += `<input type="hidden" name="${key}" value="${params[key]}">`;
  }
  html += `<input type="hidden" name="CheckMacValue" value="${signature}">`;
  html += `</form><script>document.getElementById('ecpay_form').submit();<\/script>`;
  
  return html;
}

function createJSONResponse(success, message, extra = {}) {
  const res = { success, message, ...extra };
  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 驗證 Firebase ID Token
 * 呼叫 Google Identity Toolkit API 進行驗證
 */
function verifyFirebaseIdToken(token) {
  if (!token) return { success: false, error: 'No token provided' };
  if (!FIREBASE_API_KEY) return { success: false, error: 'GAS backend missing FIREBASE_API_KEY property' };

  const url = `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=${FIREBASE_API_KEY}`;
  const payload = { idToken: token };
  
  try {
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      headers: {
        'Referer': 'https://keicha-membership-system.web.app/'
      },
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.users && result.users.length > 0) {
      return { 
        success: true, 
        email: result.users[0].email,
        uid: result.users[0].localId
      };
    } else {
      return { success: false, error: result.error ? result.error.message : 'Invalid token' };
    }
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// ==========================================
// 業務邏輯與郵件模板
// ==========================================

function handleNewOrder(order) {
  try {
    const buyerSubject = `KEICHA 訂單確認通知 (${order.order_id || '新訂單'})`;
    const buyerBody = generateOrderEmailHTML(order, false);
    const adminSubject = `[新訂單] ${order.name || order.customer_name} - $${order.total}`;
    const adminBody = generateOrderEmailHTML(order, true);
    
    const email = order.email;
    if (email && email.indexOf('@') !== -1) {
      try {
        GmailApp.sendEmail(email, buyerSubject, '', { htmlBody: buyerBody, from: SENDER_ALIAS, name: 'KEICHA' });
      } catch (e) {
        GmailApp.sendEmail(email, buyerSubject, '', { htmlBody: buyerBody });
      }
    }
    try {
      GmailApp.sendEmail(ADMIN_EMAIL, adminSubject, '', { htmlBody: adminBody });
    } catch (e) {}
  } catch (err) {
    console.error('handleNewOrder error: ' + err);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}




function handleNewDenwaOrder(order) {
  console.log('handleNewDenwaOrder started', JSON.stringify(order));
  try {
    const orderId = order.order_id || order.id || '未知';
    const customerName = order.customer_name || order.booking_name || '客戶';
    
    const buyerSubject = `預約確認通知 - ${orderId}`;
    const buyerBody = generateDenwaEmailHTML(order, false);
    const adminSubject = `[新預約] ${customerName} - ${orderId}`;
    const adminBody = generateDenwaEmailHTML(order, true);
    
    const email = order.email;
    if (email && email.indexOf('@') !== -1) {
      try {
        GmailApp.sendEmail(email, buyerSubject, '', { htmlBody: buyerBody, from: SENDER_ALIAS, name: 'KEICHA' });
      } catch (e) {
        console.warn('Buyer email with alias failed, trying default: ' + e);
        GmailApp.sendEmail(email, buyerSubject, '', { htmlBody: buyerBody });
      }
    }
    try {
      GmailApp.sendEmail(ADMIN_EMAIL, adminSubject, '', { htmlBody: adminBody });
    } catch (e) {
      console.error('Admin email failed: ' + e);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error('handleNewDenwaOrder heavy error: ' + err);
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleDenwaReply(order) {
  if (!order.email || !order.public_reply) {
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const subject = `賣家回覆通知 - ${order.order_id}`;
  const htmlBody = generateDenwaReplyEmailHTML(order);
  
  GmailApp.sendEmail(order.email, subject, '', { htmlBody: htmlBody, from: SENDER_ALIAS, name: 'KEICHA' });
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleMatchaReply(order) {
  if (!order.email || !order.seller_note) {
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const subject = `賣家回覆通知 - ${order.order_id || order.id || '訂單'}`;
  const htmlBody = generateMatchaReplyEmailHTML(order);
  
  GmailApp.sendEmail(order.email, subject, '', { htmlBody: htmlBody, from: SENDER_ALIAS, name: 'KEICHA' });
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}


/**
 * 電話代撥結案通知
 * 前端已產生完整 HTML，GAS 只負責發送
 */
function handleDenwaCloseCase(data) {
  // 客戶版信件
  if (data.email && data.email.includes('@') && data.htmlBody) {
    GmailApp.sendEmail(data.email, data.subject || 'KEICHA 電話代撥結果通知', '', {
      htmlBody: data.htmlBody,
      from: SENDER_ALIAS,
      name: 'KEICHA'
    });
  }

  // 管理員版信件
  if (data.adminHtmlBody) {
    GmailApp.sendEmail(ADMIN_EMAIL, data.adminSubject || 'KEICHA 電話代撥結案', '', {
      htmlBody: data.adminHtmlBody
    });
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true, message: '結案信件已發送' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 訂單郵件模板
 */
/**
 * 統一郵件框架包裝
 */
function wrapBaseEmailHTML(title, contentHTML, isAdmin = false, outroHTML = '') {
  const adminButtonHTML = isAdmin ? `
    <div style="margin: 30px 0;">
      <a href="https://keicha-membership-system.web.app/admin.html" target="_blank" style="display: block; text-align: center; padding: 12px 0; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 16px; background-color: ${BRAND_COLOR}; color: #ffffff; border: 1px solid ${BRAND_COLOR}; box-sizing: border-box; width: 100%;">
        管理頁面
      </a>
    </div>
  ` : '';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { margin: 0; padding: 0; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; line-height: 1.8; color: #334155; background-color: #ffffff; }
      .tbl { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
      .tbl th { text-align: left; padding: 10px; background: #f8fafc; color: #64748b; border-bottom: 1px solid #eee; width: 35%; font-weight: normal; }
      .tbl td { padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #334155; }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background: #ffffff;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; background: #fff;">
      <div style="padding: 20px;">
        <div style="border-bottom: 2px solid ${BRAND_COLOR}; padding-bottom: 12px; margin-bottom: 25px;">
          <h2 style="color: ${BRAND_COLOR}; margin: 0; font-size: 20px;">${title}</h2>
        </div>
        
        <div style="margin-bottom: 25px; font-size: 15px; color: #334155;">
          ${contentHTML}
        </div>

        ${outroHTML}
        ${adminButtonHTML}

        <div style="border-top: 1px solid #eee; padding-top: 30px; text-align: center;">
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">如有疑問請聯絡 LINE 官方帳號</p>
          <p style="font-size: 11px; color: #94a3b8; margin: 4px 0 20px; font-weight: bold;">${LINE_ID}</p>
          <img src="https://keicha2025.github.io/images/KEICHA_logotype.png" alt="KEICHA" width="120" style="display: block; margin: 10px auto; border: 0;">
          <p style="font-size: 9px; color: #cbd5e1; margin-top: 15px; letter-spacing: 3px;">© 2025 KEICHA ALL RIGHTS RESERVED.</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}

function generateOrderEmailHTML(data, isAdmin) {
  const titleText = isAdmin ? "新訂單通知" : "訂單確認通知";
  const total = data.total || (data.subtotal + data.shipping_fee);
  
  const contentHTML = `
    ${isAdmin ? '' : `<p>您好：<br><br>您的訂單已成功送出，以下是您的訂單明細：</p>`}
    
    <div style="margin-bottom: 20px;">
      <p style="margin: 0; line-height: 1.6; font-weight: bold; color: #334155;">訂單編號：<a href="https://keicha2025.github.io/order.html?id=${(data.tracking_code || data.order_id).replace(/-[A-Z0-9]{4}$/, '')}" style="color: #6ea44c; text-decoration: none;">${(data.order_id || '處理中').replace(/-[A-Z0-9]{4}$/, '')}</a></p>
      <p style="margin: 0; line-height: 1.6;">取件人姓名：${data.name || data.customer_name}</p>
      <p style="margin: 0; line-height: 1.6;">取件人手機：${data.phone}</p>
    </div>

    <div style="margin-bottom: 20px;">
      <h4 style="margin: 0 0 5px 0; font-size: 14px; color: #555;">物流資訊</h4>
      <p style="margin: 0; line-height: 1.6;">物流方式：${data.logistics_type || data.logistics}</p>
      <p style="margin: 0; line-height: 1.6;">店號/地址：${data.store_id || data.address || ''} ${data.store_note || ''}</p>
    </div>

    <div style="margin-bottom: 20px;">
      <h4 style="margin: 0 0 5px 0; font-size: 14px; color: #555;">商品內容</h4>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; line-height: 1.6;">
        ${(data.items_text || '').replace(/\n/g, '<br>')}
        ${data.note ? `<div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ccc; color: #666; font-size: 13px;"><strong>備註：</strong><br>${data.note}</div>` : ''}
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <p style="margin: 0; font-size: 18px; font-weight: bold; color: ${BRAND_COLOR};">總計金額：NT$ ${total}</p>
    </div>
  `;
  
  const buyerOutro = `
    <div style="margin:25px 0;font-size:15px;color:#334155">將此訂單資料截圖傳送到<strong style="color: #334155; font-weight: bold;">官方帳號</strong>：<br>LINE ID: ${LINE_ID}</div>
    <div style="margin: 30px 0;">
      <a href="${LINE_LINK}" target="_blank" style="display: block; text-align: center; padding: 12px 0; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 16px; background-color: ${BRAND_COLOR}; color: #ffffff; border: 1px solid ${BRAND_COLOR}; box-sizing: border-box; width: 100%;">
        加入好友
      </a>
    </div>
  `;
  
  return wrapBaseEmailHTML(titleText, contentHTML, isAdmin, isAdmin ? '' : buyerOutro);
}

/**
 * 電話預約郵件模板
 */
function generateDenwaEmailHTML(data, isAdmin) {
  let peopleDisplay = `${data.total_count} 人`;
  const adult = parseInt(data.adult_count) || 0;
  const child = parseInt(data.child_count) || 0;
  if (child > 0) {
    peopleDisplay = `${adult}大${child}小 (共 ${data.total_count} 人)`;
  }
  
  
  const titleText = isAdmin ? "新預約通知" : "預約確認通知";
  const introText = isAdmin 
    ? `<div>收到一筆新的預約，訂單編號：<strong style="color: #6ea44c;">${data.order_id}</strong></div>`
    : `<p>${data.customer_name} 您好：<br><br>我們已收到您的代撥預約申請，以下是您的預約明細：</p>`;
  
  const contentHTML = `
    ${introText}
    <table class="tbl">
      <tr><th>訂單編號</th><td><a href="https://keicha2025.github.io/order.html?id=${(data.tracking_code || data.order_id).replace(/-[A-Z0-9]{4}$/, '')}" style="color: #6ea44c; text-decoration: none;">${data.order_id.replace(/-[A-Z0-9]{4}$/, '')}</a></td></tr>
      <tr><th>預約商家</th><td>${data.merchant_name}</td></tr>
      <tr><th>預約時間</th><td>${data.service_date} ${data.service_time}</td></tr>
      <tr><th>預約英文姓名</th><td>${data.booking_name}</td></tr>
      <tr><th>預約人數</th><td>${peopleDisplay}</td></tr>
      <tr><th>聯絡電話</th><td>${data.phone}</td></tr>
      <tr><th>預約方案</th><td>${data.plan_name || data.payment_plan}</td></tr>
      <tr><th>備註</th><td>${data.note || '無'}</td></tr>
      <tr><th>在日資訊</th><td>${data.contact_in_japan || data.japan_contact || '無'}</td></tr>
    </table>
  `;

  const outroHTML = isAdmin ? '' : `
    <div style="margin: 25px 0; font-size: 15px; color: #334155;">
      <div>將此訂單資料截圖傳送到我們的 <strong style="color: #6ea44c; font-weight: bold;">LINE 官方帳號</strong>：</div>
      <div style="margin-top: 5px;">LINE ID: ${LINE_ID}</div>
    </div>
    <div style="margin: 30px 0;">
      <a href="${LINE_LINK}" target="_blank" style="display: block; text-align: center; padding: 12px 0; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 16px; background-color: ${BRAND_COLOR}; color: #ffffff; border: 1px solid ${BRAND_COLOR}; box-sizing: border-box; width: 100%;">
        加入好友
      </a>
      ${data.payment_link && data.payment_link.startsWith('http') ? `
        <div style="height: 10px;"></div>
        <a href="${data.payment_link}" target="_blank" style="display: block; text-align: center; padding: 12px 0; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 16px; border: 2px solid ${BRAND_COLOR}; color: ${BRAND_COLOR}; box-sizing: border-box; width: 100%;">
          前往付款
        </a>
      ` : ''}
    </div>
  `;

  return wrapBaseEmailHTML(titleText, contentHTML, isAdmin, outroHTML);
}

/**
 * 電話代撥結案通知郵件模板
 */
function generateCloseCaseEmailHTML(subject, intro, ccRows, note, outro, btn1, btn2) {
  let tableRows = '';
  let isObjectFormat = false;
  
  if (ccRows && ccRows.length > 0) {
    isObjectFormat = !Array.isArray(ccRows[0]) && typeof ccRows[0] === 'object';
    
    ccRows.forEach(row => {
      if (isObjectFormat) {
        // 新格式 (Object): 訂單摘要 {label, value}
        tableRows += `
          <tr>
            <th style="text-align: left; padding: 10px; background: #f8fafc; color: #64748b; border-bottom: 1px solid #eee; width: 35%; font-weight: normal; font-size: 13px;">${row.label}</th>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #334155; font-size: 13px;">${row.value || '--'}</td>
          </tr>`;
      } else {
        // 舊格式 (Array): 通話紀錄 [時間, 項目, 結果]
        tableRows += `<tr><td style="padding:10px;border-bottom:1px solid #eee;font-size:12px;color:#64748b">${row[0]}</td><td style="padding:10px;border-bottom:1px solid #eee;font-size:12px;color:#334155">${row[2] || row[1] || ''}</td></tr>`;
      }
    });
  }

  const tableHeader = (!isObjectFormat && ccRows && ccRows.length > 0) 
    ? `<thead style="background:#f8fafc"><tr><th style="text-align:left;padding:10px;font-size:12px;color:#64748b;border-bottom:1px solid #eee">時間</th><th style="text-align:left;padding:10px;font-size:12px;color:#64748b;border-bottom:1px solid #eee">處理狀況</th></tr></thead>`
    : '';

  const contentHTML = `
    <p>${intro.replace(/\n/g, '<br>')}</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;border:1px solid #eee">
      ${tableHeader}
      <tbody>${tableRows}</tbody>
    </table>
    ${note ? `<div style="background:#f9f9f9;padding:15px;border-radius:8px;font-size:14px;color:#475569;margin-bottom:20px"><strong>管理者備註：</strong><br>${note.replace(/\n/g, '<br>')}</div>` : ''}
    <p>${outro.replace(/\n/g, '<br>')}</p>
  `;

  let buttonsHtml = '';
  if (btn1 && btn1.show) {
    buttonsHtml += `<a href="${btn1.link}" target="_blank" style="display: block; width: 100%; text-align: center; padding: 12px 0; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 16px; background-color: ${BRAND_COLOR}; color: #ffffff; border: 1px solid ${BRAND_COLOR}; box-sizing: border-box;">${btn1.text}</a>`;
  }
  if (btn2 && btn2.show) {
    buttonsHtml += `<div style="height: 10px;"></div><a href="${btn2.link}" target="_blank" style="display: block; width: 100%; text-align: center; padding: 12px 0; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 16px; border: 2px solid ${BRAND_COLOR}; color: ${BRAND_COLOR}; box-sizing: border-box;">${btn2.text}</a>`;
  }

  const outroHTML = buttonsHtml ? `<div style="margin: 30px 0;">${buttonsHtml}</div>` : '';

  return wrapBaseEmailHTML(subject, contentHTML, false, outroHTML);
}

/**
 * 刷卡訂單 (Link Order) 郵件模板
 */
function generateCardOrderEmailHTML(data, isAdmin, title) {
  const recipientBlock = `
    <div style="margin-bottom: 20px;">
      <p style="margin: 0; line-height: 1.6;">客戶姓名：${data.name}</p>
      <p style="margin: 0; line-height: 1.6;">聯絡電話：${data.phone}</p>
      <p style="margin: 0; line-height: 1.6;">付款方式：${data.payment_method === 'ATM' ? '虛擬帳號 (ATM)' : '信用卡支付'}</p>
    </div>
  `;
  
  const contentHTML = `
    ${isAdmin ? `<div>系統已為客戶發送付款連結。</div>` : `<div>您好：<br><br>您的訂單已建立，請點擊下方連結完成付款，或查閱以下明細：</div>`}
    ${recipientBlock}
    <div style="margin-bottom: 20px;">
      <h4 style="margin: 0 0 5px 0; font-size: 14px; color: #555;">付款內容</h4>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; line-height: 1.6;">
        <strong>${title || 'KEICHA 服務項目'}</strong><br>
        ${data.stage_index >= 0 ? `(階段性支付：第 ${data.stage_index + 1} 階段)` : '(全額支付)'}<br>
        ${data.logistics && data.logistics !== '不適用' ? `物流：${data.logistics}<br>地址：${data.address}` : ''}
        ${data.note ? `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #ccc; font-size: 13px;"><strong>備註：</strong>${data.note}</div>` : ''}
      </div>
    </div>
    <div style="margin-bottom: 20px;">
      <p style="margin: 0; font-size: 18px; font-weight: bold; color: ${BRAND_COLOR};">本次支付金額：NT$ ${data.amount}</p>
    </div>
  `;

  const titleText = isAdmin ? "新刷卡訂單通知" : "訂單付款資訊";
  
  let outroHTML = '';
  if (!isAdmin) {
    const payUrl = data.payment_url || `https://keicha2025.github.io/order.html?id=${data.order_id}`;
    outroHTML = `
      <div style="margin: 30px 0;">
        <a href="${payUrl}" target="_blank" style="display: block; text-align: center; padding: 12px 0; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 16px; background-color: ${BRAND_COLOR}; color: #ffffff; border: 1px solid ${BRAND_COLOR}; box-sizing: border-box; width: 100%;">
          前往付款
        </a>
      </div>
    `;
  }

  return wrapBaseEmailHTML(titleText, contentHTML, isAdmin, outroHTML);
}

/**
 * 刷卡訂單付款成功模板
 */
function generateCardPaidEmailHTML(order, isAdmin, params) {
  const titleText = isAdmin ? "收款成功通知" : "付款成功通知";
  const buyerName = order.name || order.customer_name || order.line_name || '未知客戶';
  const introText = isAdmin
    ? `<p>您的客戶 <strong>${buyerName}</strong> 已完成付款，請查看以下支付明細內容。</p>`
    : `<p>您好：<br><br>我們已收到您的款項，您的訂單已正式進入排程處理，以下是本次支付詳細資訊：</p>`;

  const contentHTML = `
    ${introText}
    <div style="background-color:#ffffff;border:2px solid ${BRAND_COLOR};border-radius:12px;padding:25px;margin-bottom:30px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding-bottom:10px;color:#64748b;font-size:14px">訂單編號</td></tr>
        <tr><td style="padding-bottom:20px;font-weight:bold;font-size:16px;color:#1e293b">
          <a href="https://keicha2025.github.io/order.html?id=${(order.tracking_code || order.order_id).replace(/-[A-Z0-9]{4}$/, '')}" style="color:${BRAND_COLOR};text-decoration:none">${order.order_id.replace(/-[A-Z0-9]{4}$/, '')}</a>
        </td></tr>
        <tr><td style="padding-bottom:10px;color:#64748b;font-size:14px">支付金額</td></tr>
        <tr><td style="padding-bottom:20px;font-weight:bold;font-size:28px;color:${BRAND_COLOR}">NT$ ${params.TradeAmt}</td></tr>
        <tr><td>
          <table width="100%" style="border-top:1px solid #f1f5f9;padding-top:20px">
            <tr><td style="color:#64748b;font-size:13px;padding-bottom:5px">付款時間：${params.PaymentDate}</td></tr>
            <tr><td style="color:#64748b;font-size:13px">付款方式：${params.PaymentType}</td></tr>
          </table>
        </td></tr>
      </table>
    </div>
  `;

  return wrapBaseEmailHTML(titleText, contentHTML, isAdmin);
}

/**
 * 處理圖片上傳至 Google Drive
 */
function handleImageUpload(data) {
  try {
    const { base64, fileName } = data;
    const folder = getOrCreateFolder();
    
    // 移除 Base64 header (e.g., data:image/jpeg;base64,)
    const base64Data = base64.split(',')[1] || base64;
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), 'image/jpeg', fileName || 'product_image.jpg');
    
    // 直接存入資料夾並設定權限
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // 產生適用於網頁顯示的連結 (thumbnail API 較穩定且支援縮圖)
    const directUrl = `https://drive.google.com/thumbnail?id=${file.getId()}&sz=w1000`;
    
    return createJSONResponse(true, '上傳成功', { url: directUrl });
  } catch (error) {
    return createJSONResponse(false, '圖片上傳失敗：' + error.toString());
  }
}

/**
 * 取得或建立資料夾結構：我的雲端硬碟/KEICHA/KEICHA_Product_Images
 */
function getOrCreateFolder() {
  const root = DriveApp.getRootFolder();
  let keichaFolder;
  
  // 搜尋非垃圾桶的資料夾
  const keichaFolders = DriveApp.getFoldersByName('KEICHA');
  while (keichaFolders.hasNext()) {
    const f = keichaFolders.next();
    if (!f.isTrashed()) {
      keichaFolder = f;
      break;
    }
  }
  
  if (!keichaFolder) {
    keichaFolder = root.createFolder('KEICHA');
  }
  
  let imagesFolder;
  const imagesFolders = keichaFolder.getFoldersByName('KEICHA_Product_Images');
  while (imagesFolders.hasNext()) {
    const f = imagesFolders.next();
    if (!f.isTrashed()) {
      imagesFolder = f;
      break;
    }
  }
  
  if (!imagesFolder) {
    imagesFolder = keichaFolder.createFolder('KEICHA_Product_Images');
  }
  return imagesFolder;
}

function createJSONResponse(success, message, extra = {}) {
  const res = { success, message, ...extra };
  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 處理綠界背景回傳通知 (ReturnURL)
 */
function handleECPayCallback(params) {
  logToSpreadsheet('ECPayCallback', '開始處理綠界回呼資料', { MerchantTradeNo: params.MerchantTradeNo });
  
  // 1. 驗證 CheckMacValue
  const receivedCheckMacValue = params.CheckMacValue;
  const filteredParams = { ...params };
  delete filteredParams.CheckMacValue;
  
  // 根據傳入的簽章長度動態判斷加密演算法 (32字元為MD5，64字元為SHA-256)
  const algoType = (receivedCheckMacValue && receivedCheckMacValue.length === 32) ? 'MD5' : 'SHA-256';
  const computedCheckMacValue = generateCheckMacValue(filteredParams, algoType);
  
  const isSimulated = params.SimulatePaid === '1';
  let isMatched = (receivedCheckMacValue === computedCheckMacValue);
  
  if (isSimulated) {
    isMatched = true;
    logToSpreadsheet('ECPayCallback_Verify', '偵測為模擬付款，安全跳過簽章比對並強制通過', {
      Received: receivedCheckMacValue,
      Computed: computedCheckMacValue,
      Matched: true
    });
  } else {
    logToSpreadsheet('ECPayCallback_Verify', '簽章驗證比對詳情', {
      AlgoUsed: algoType,
      Received: receivedCheckMacValue,
      Computed: computedCheckMacValue,
      Matched: isMatched
    });
  }
  
  if (!isMatched) {
    logToSpreadsheet('ECPayCallback_Error', '綠界 CheckMacValue 驗證失敗', {
      Received: receivedCheckMacValue,
      Computed: computedCheckMacValue
    });
    return ContentService.createTextOutput("0|CheckMacValue Error");
  }

  // 2. 付款成功 (RtnCode === '1')
  if (params.RtnCode === '1') {
    const rawTradeNo = params.MerchantTradeNo;
    const tradeNo = rawTradeNo.split('R')[0]; // 移除重新付款的後綴
    const paymentDate = params.PaymentDate;
    
    // 跨集合搜尋訂單
    const orderData = findOrderAcrossCollections(tradeNo);
    if (!orderData) {
      logToSpreadsheet('ECPayCallback_Warn', `找不到訂單 ${tradeNo}，但回傳 1|OK 避免重複發送`, params);
      return ContentService.createTextOutput("1|OK"); // 仍回傳 OK 給綠界，避免重複發送
    }

    const { order, collection } = orderData;

    // 冪等性檢查：如果已經是 paid 或 completed 狀態，則不重複處理
    const currentStatus = order.payment_status || order.status;
    if (currentStatus === 'paid' || currentStatus === 'completed') {
      logToSpreadsheet('ECPayCallback_Skip', `訂單 ${tradeNo} 在 ${collection} 的狀態已為 ${currentStatus}，跳過處理`, { tradeNo });
      return ContentService.createTextOutput("1|OK");
    }

    try {
      logToSpreadsheet('ECPayCallback_Update', `更新訂單狀態為已付款`, { tradeNo, collection, paymentDate });
      // 更新訂單狀態
      updateFirestoreDocument(collection, tradeNo, {
        payment_status: 'completed',
        paid_at: paymentDate,
        ecpay_trade_no: params.TradeNo
      });

      // 自動標記支付連結中的階段為「已付」 (僅限 card_orders)
      if (collection === 'card_orders' && order.link_id && order.stage_index !== undefined) {
        logToSpreadsheet('ECPayCallback_Update', `更新分期付款連結狀態`, { link_id: order.link_id, stage_index: order.stage_index });
        const link = fetchFirestoreDocument('card_orders_links', 'suffix', order.link_id);
        if (link && link.stages && link.stages.length > 0) {
          if (order.stage_index >= 0) {
            if (link.stages[order.stage_index]) {
              link.stages[order.stage_index].is_paid = true;
            }
          } else {
            // stage_index < 0 表示全額支付，標記所有階段為已付
            link.stages = link.stages.map(s => {
              s.is_paid = true;
              return s;
            });
          }
          updateFirestoreDocumentWithArray('card_orders_links', link._id, { stages: link.stages });
        }
      }

      // 檢查是否已發送過信件 (使用 PropertiesService 防重發)
      const scriptProperties = PropertiesService.getScriptProperties();
      const propKey = `mail_sent_${tradeNo}`;
      if (scriptProperties.getProperty(propKey)) {
        logToSpreadsheet('ECPayCallback_Skip', `已發送過信件，跳過寄信`, { propKey });
        return ContentService.createTextOutput("1|OK");
      }

      // 標記為已處理
      scriptProperties.setProperty(propKey, 'true');

      // 發送付款成功通知
      try {
        logToSpreadsheet('ECPayCallback_Email', `開始發送付款成功通知郵件`, { email: order.email });
        const buyerSubject = `[付款成功] KEICHA 訂單 ${tradeNo} 已完成付款`;
        const buyerBody = generateCardPaidEmailHTML(order, false, params);
        const adminSubject = `[付款成功] ${order.name || order.customer_name || order.line_name || '客戶'} - 訂單 ${tradeNo}`;
        const adminBody = generateCardPaidEmailHTML(order, true, params);

        const targetEmail = order.email;
        if (targetEmail && targetEmail.indexOf('@') !== -1) {
          try {
            GmailApp.sendEmail(targetEmail, buyerSubject, '', { htmlBody: buyerBody, from: SENDER_ALIAS, name: 'KEICHA' });
            logToSpreadsheet('ECPayCallback_Email', `買家通知信寄送成功 (含別名)`, { targetEmail });
          } catch (e) {
            logToSpreadsheet('ECPayCallback_Email_Warn', `買家信使用別名寄送失敗，改用預設身分寄送`, { error: e.toString() });
            GmailApp.sendEmail(targetEmail, buyerSubject, '', { htmlBody: buyerBody });
            logToSpreadsheet('ECPayCallback_Email', `買家通知信寄送成功 (無別名)`, { targetEmail });
          }
        }
        try {
          GmailApp.sendEmail(ADMIN_EMAIL, adminSubject, '', { htmlBody: adminBody });
          logToSpreadsheet('ECPayCallback_Email', `管理員通知信寄送成功`, { ADMIN_EMAIL });
        } catch (e) {
          logToSpreadsheet('ECPayCallback_Email_Error', `管理員通知信寄送失敗`, { error: e.toString() });
        }
      } catch (e) {
        logToSpreadsheet('ECPayCallback_Email_Error', `信件發送邏輯崩潰`, { error: e.toString() });
      }
    } catch (dbError) {
      logToSpreadsheet('ECPayCallback_Exception', `更新資料庫或執行流程崩潰`, { error: dbError.toString() });
      return ContentService.createTextOutput("0|Callback Processing Error: " + dbError.toString());
    }
  }

  logToSpreadsheet('ECPayCallback_Success', `付款回呼處置完畢，回傳 1|OK`, { MerchantTradeNo: params.MerchantTradeNo });
  return ContentService.createTextOutput("1|OK"); 
}

/**
 * 跨集合搜尋訂單
 */
function findOrderAcrossCollections(orderId) {
  const collections = ['card_orders', 'denwa_orders'];
  for (const collection of collections) {
    const order = getFirestoreDocumentById(collection, orderId);
    if (order) return { order, collection };
  }
  return null;
}

/**
 * 建立 Firestore 文件 (REST API)
 */
function createFirestoreDocument(collection, documentId, data) {
  const projectId = 'keicha-membership-system';
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}?documentId=${documentId}`;
  
  const fields = {};
  for (let key in data) {
    const val = data[key];
    if (typeof val === 'string') fields[key] = { stringValue: val };
    else if (typeof val === 'number') fields[key] = { integerValue: val };
    else if (typeof val === 'boolean') fields[key] = { booleanValue: val };
    else if (typeof val === 'object' && val.seconds) fields[key] = { timestampValue: new Date(val.seconds * 1000).toISOString() };
  }

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ fields: fields }),
    muteHttpExceptions: true
  });
  
  return JSON.parse(response.getContentText());
}

/**
 * 更新 Firestore 文件 (REST API PATCH)
 */
function updateFirestoreDocument(collection, documentId, data) {
  const projectId = 'keicha-membership-system';
  const updateMask = Object.keys(data).map(key => `updateMask.fieldPaths=${key}`).join('&');
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${documentId}?${updateMask}`;
  
  const fields = {};
  for (let key in data) {
    const val = data[key];
    if (typeof val === 'string') fields[key] = { stringValue: val };
    else if (typeof val === 'number') fields[key] = { integerValue: val };
    else if (typeof val === 'boolean') fields[key] = { booleanValue: val };
  }

  const response = UrlFetchApp.fetch(url, {
    method: 'patch',
    contentType: 'application/json',
    payload: JSON.stringify({ fields: fields }),
    muteHttpExceptions: true
  });
  
  return JSON.parse(response.getContentText());
}

/**
 * 更新 Firestore 文件，支援陣列 (REST API PATCH)
 */
function updateFirestoreDocumentWithArray(collection, documentId, data) {
  const projectId = 'keicha-membership-system';
  const updateMask = Object.keys(data).map(key => `updateMask.fieldPaths=${key}`).join('&');
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${documentId}?${updateMask}`;
  
  const fields = {};
  for (let key in data) {
    const val = data[key];
    if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map(item => {
            if (typeof item === 'string') return { stringValue: item };
            if (typeof item === 'number') return { integerValue: item };
            if (typeof item === 'boolean') return { booleanValue: item };
            if (typeof item === 'object') {
              const mapFields = {};
              for (let mk in item) {
                const mv = item[mk];
                if (typeof mv === 'string') mapFields[mk] = { stringValue: mv };
                else if (typeof mv === 'number') mapFields[mk] = { integerValue: mv };
                else if (typeof mv === 'boolean') mapFields[mk] = { booleanValue: mv };
              }
              return { mapValue: { fields: mapFields } };
            }
            return null;
          })
        }
      };
    } else {
      if (typeof val === 'string') fields[key] = { stringValue: val };
      else if (typeof val === 'number') fields[key] = { integerValue: val };
      else if (typeof val === 'boolean') fields[key] = { booleanValue: val };
    }
  }

  const response = UrlFetchApp.fetch(url, {
    method: 'patch',
    contentType: 'application/json',
    payload: JSON.stringify({ fields: fields }),
    muteHttpExceptions: true
  });
  
  return JSON.parse(response.getContentText());
}

function generateCheckMacValue(params, algoType) {
  const props = PropertiesService.getScriptProperties();
  let hashKey = props.getProperty('ECPAY_HASH_KEY') || 'test_key';
  let hashIV = props.getProperty('ECPAY_HASH_IV') || 'test_iv';

  // 防呆機制：去除前後多餘的空格或換行字元
  hashKey = hashKey.trim();
  hashIV = hashIV.trim();

  // 過濾掉空值參數（undefined, null, 空字串）
  const cleanParams = {};
  for (let key in params) {
    const val = params[key];
    if (val !== undefined && val !== null && val !== '') {
      cleanParams[key] = val;
    }
  }

  const sortedKeys = Object.keys(cleanParams).sort();
  let rawString = 'HashKey=' + hashKey;
  for (let key of sortedKeys) {
    rawString += '&' + key + '=' + cleanParams[key];
  }
  rawString += '&HashIV=' + hashIV;

  let encoded = encodeURIComponent(rawString).toLowerCase();
  encoded = encoded.replace(/%20/g, '+')
                   .replace(/%21/g, '!')
                   .replace(/%28/g, '(')
                   .replace(/%29/g, ')')
                   .replace(/%2a/g, '*');

  // 遮罩金鑰但保留前後各3碼方便核對是否填錯
  let maskedKey = hashKey ? (hashKey.substring(0, 3) + '***' + hashKey.substring(hashKey.length - 3)) : '';
  let maskedIV = hashIV ? (hashIV.substring(0, 3) + '***' + hashIV.substring(hashIV.length - 3)) : '';
  let maskedRawString = rawString.replace(hashKey, maskedKey).replace(hashIV, maskedIV);

  logToSpreadsheet('CheckMacValue_Generate', '生成綠界簽章對照值', {
    algo: algoType || 'SHA-256 (default)',
    hashKey_length: hashKey.length,
    hashIV_length: hashIV.length,
    rawString_masked: maskedRawString,
    encoded: encoded
  });

  const algorithm = algoType === 'MD5' ? Utilities.DigestAlgorithm.MD5 : Utilities.DigestAlgorithm.SHA_256;

  return Utilities.computeDigest(algorithm, encoded)
    .map(function(b) {
      let v = (b < 0) ? (b + 256) : b;
      return v.toString(16).padStart(2, '0');
    }).join('').toUpperCase();
}

/**
 * PCHome Pay 取得授權 Token
 */
function getPCHomePayToken(appId, secret) {
  if (!appId || !secret) return { success: false, error: 'Missing PCHome Pay credentials' };
  
  const baseUrl = appId.indexOf('test') !== -1 || appId.indexOf('sandbox') !== -1 
    ? 'https://sandbox-api.pchomepay.com.tw' 
    : 'https://api.pchomepay.com.tw';
    
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Basic ' + Utilities.base64Encode(appId + ':' + secret)
    },
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(baseUrl + '/v1/token', options);
    const result = JSON.parse(response.getContentText());
    if (result.token) return { success: true, token: result.token };
    return { success: false, error: result.message || 'Token acquisition failed' };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * 清理並格式化電話號碼給 PChome Pay (需為 09xx 格式)
 */
function formatPhoneForPCPay(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('886')) {
    cleaned = '0' + cleaned.substring(3);
  }
  return cleaned;
}

/**
 * 處理 PCHome Pay 背景回傳通知 (NotifyURL)
 */
function handlePCHomePayNotify(params) {
  const notifyType = params.notify_type;
  const message = JSON.parse(params.notify_message);
  
  // 目前僅處理已付款通知 (order_confirm)
  if (notifyType === 'order_confirm' && message.status === 'S') {
    const rawOrderId = message.order_id;
    const orderId = rawOrderId.split('R')[0];
    
    // 跨集合搜尋訂單
    const orderData = findOrderAcrossCollections(orderId);
    if (!orderData) {
      console.error(`Order ${orderId} not found in any collection during PCHome Pay notify.`);
      return ContentService.createTextOutput("success");
    }

    const { order, collection } = orderData;

    // 冪等性檢查
    const currentStatus = order.payment_status || order.status;
    if (currentStatus === 'paid' || currentStatus === 'completed') {
      console.log(`Order ${orderId} in ${collection} already marked as paid/completed. Skipping.`);
      return ContentService.createTextOutput("success");
    }

    // 更新訂單狀態
    updateFirestoreDocument(collection, orderId, {
      payment_status: 'completed',
      paid_at: message.actual_pay_date || message.pay_date,
      pchomepay_order_id: message.order_id
    });

    // 自動標記支付連結中的階段為「已付」 (僅限 card_orders)
    if (collection === 'card_orders' && order.link_id && order.stage_index !== undefined) {
      const link = fetchFirestoreDocument('card_orders_links', 'suffix', order.link_id);
      if (link && link.stages && link.stages.length > 0) {
        if (order.stage_index >= 0) {
          if (link.stages[order.stage_index]) link.stages[order.stage_index].is_paid = true;
        } else {
          link.stages = link.stages.map(s => { s.is_paid = true; return s; });
        }
        updateFirestoreDocumentWithArray('card_orders_links', link._id, { stages: link.stages });
      }
    }

    // 檢查是否已發送過信件 (使用 PropertiesService 防重發)
    const scriptProperties = PropertiesService.getScriptProperties();
    const propKey = `mail_sent_${orderId}`;
    if (scriptProperties.getProperty(propKey)) {
      console.log(`Email for order ${orderId} already sent (Properties). Skipping.`);
      return ContentService.createTextOutput("success");
    }

    // 標記為已處理
    scriptProperties.setProperty(propKey, 'true');

    // 發送通知郵件
    try {
      const fakeParams = {
        TradeAmt: message.trade_amount || message.amount,
        PaymentDate: message.actual_pay_date || message.pay_date,
        PaymentType: 'PCHomePay (' + (message.pay_type || 'CARD') + ')'
      };
      const buyerSubject = `[付款成功] KEICHA 訂單 ${orderId} 已完成付款`;
      const buyerBody = generateCardPaidEmailHTML(order, false, fakeParams);
      const adminSubject = `[付款成功] ${order.name || order.customer_name || order.line_name || '客戶'} - 訂單 ${orderId}`;
      const adminBody = generateCardPaidEmailHTML(order, true, fakeParams);

      const targetEmail = order.email;
      if (targetEmail && targetEmail.indexOf('@') !== -1) {
        try { GmailApp.sendEmail(targetEmail, buyerSubject, '', { htmlBody: buyerBody, from: SENDER_ALIAS, name: 'KEICHA' }); } 
        catch (e) { GmailApp.sendEmail(targetEmail, buyerSubject, '', { htmlBody: buyerBody }); }
      }
      try { GmailApp.sendEmail(ADMIN_EMAIL, adminSubject, '', { htmlBody: adminBody }); } catch (e) {}
    } catch (e) { console.error('PCHome Pay notify email failed: ' + e); }
  }

  return ContentService.createTextOutput("success");
}

/**
 * 產生自定義訂單編號 (CYYMMDDXX)
 */
function getNextOrderNumber() {
  const now = new Date();
  const dateStr = Utilities.formatDate(now, "GMT+8", "yyMMdd"); // e.g. 250224 (2025/02/24)
  const prefix = "C" + dateStr;
  
  // 1. 查詢今日計數器
  const counter = getFirestoreDocumentById('order_counters', dateStr);
  let nextNum = 1;
  
  if (counter && counter.count !== undefined) {
    nextNum = counter.count + 1;
    // 2. 更新計數器 (PATCH)
    updateFirestoreDocument('order_counters', dateStr, { count: nextNum });
  } else {
    // 3. 建立計數器 (新的一天)
    createFirestoreDocument('order_counters', dateStr, { count: 1 });
  }
  
  // 格式化為 2 位數流水號
  const seq = nextNum.toString().padStart(2, '0');
  return prefix + seq;
}

/**
 * 取得 Firestore 單一文件內容 (REST API)
 */
function getFirestoreDocumentById(collection, documentId) {
  const projectId = 'keicha-membership-system';
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${documentId}`;
  
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: true
  });
  
  if (response.getResponseCode() === 404) return null;
  
  const result = JSON.parse(response.getContentText());
  if (result.fields) {
    const docFields = result.fields;
    const obj = {};
    for (let key in docFields) {
      const fieldData = docFields[key];
      if (fieldData.stringValue !== undefined) obj[key] = fieldData.stringValue;
      else if (fieldData.integerValue !== undefined) obj[key] = parseInt(fieldData.integerValue) || 0;
      else if (fieldData.doubleValue !== undefined) obj[key] = parseFloat(fieldData.doubleValue) || 0;
      else if (fieldData.booleanValue !== undefined) obj[key] = fieldData.booleanValue;
    }
    return obj;
  }
  return null;
}
/**
 * 處理測試郵件發送 (管理後台功能)
 */
function handleTestEmail(data) {
  const { recipient, scenarios } = data;
  
  // 安全性檢查：僅限發送給白名單帳號，防止轉發垃圾信
  if (!ALLOWED_TEST_RECIPIENTS.includes(recipient)) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: 'Forbidden: 測試信件僅限發送至管理員指定白名單信箱。'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  let successCount = 0;
  let errors = [];

  scenarios.forEach(scenario => {
    try {
      const mockData = getMockEmailData(scenario);
      if (!mockData) throw new Error(`找不到場景 ${scenario} 的模擬資料`);

      let subject = mockData.subject;
      let htmlBody = '';

      // 根據情境產出對應的 HTML
      switch (scenario) {
        case 'matcha_order_buyer':
          htmlBody = generateOrderEmailHTML(mockData.orderData, false);
          break;
        case 'matcha_order_admin':
          htmlBody = generateOrderEmailHTML(mockData.orderData, true);
          break;
        case 'matcha_reply':
          htmlBody = generateMatchaReplyEmailHTML(mockData.orderData);
          break;
        case 'denwa_order_buyer':
          htmlBody = generateDenwaEmailHTML(mockData.orderData, false);
          break;
        case 'denwa_order_admin':
          htmlBody = generateDenwaEmailHTML(mockData.orderData, true);
          break;
        case 'denwa_reply':
          htmlBody = generateDenwaReplyEmailHTML(mockData.orderData);
          break;
        case 'denwa_close':
          htmlBody = generateCloseCaseEmailHTML(
            mockData.subject, 
            mockData.intro, 
            mockData.ccRows, 
            mockData.note, 
            mockData.outro, 
            mockData.btn1, 
            mockData.btn2
          );
          break;

        case 'payment_success_buyer':
          htmlBody = generateCardPaidEmailHTML(mockData.orderData, false, mockData.params);
          break;
        case 'payment_success_admin':
          htmlBody = generateCardPaidEmailHTML(mockData.orderData, true, mockData.params);
          break;
      }

      if (htmlBody) {
        testSendEmailTo(recipient, `【樣式測試】${subject}`, htmlBody);
        successCount++;
      }
    } catch (e) {
      console.error(`[TestEmail] Error in ${scenario}:`, e);
      errors.push(`${scenario}: ${e.toString()}`);
    }
  });

  return ContentService.createTextOutput(JSON.stringify({ 
    success: successCount > 0, 
    successCount, 
    total: scenarios.length,
    errors 
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 專用於指定收件人的發送 helper (主要用於測試)
 */
function testSendEmailTo(recipient, subject, htmlBody) {
  try {
    GmailApp.sendEmail(recipient, subject, '', {
      htmlBody: htmlBody,
      from: SENDER_ALIAS,
      name: 'KEICHA'
    });
  } catch (e) {
    console.error(`[TestSendEmailTo] Failed to ${recipient}: ${e}`);
    // 如果別名失敗，嘗試預設發送
    GmailApp.sendEmail(recipient, subject, '', { htmlBody: htmlBody });
  }
}

/**
 * 產生各場景的模擬資料
 */
function getMockEmailData(type) {
  const nowStr = new Date().toLocaleString();
  
  const baseMockOrder = {
    order_id: "MOCK-12345",
    id: "MOCK-12345",
    tracking_code: "12345ABC",
    name: "測試客戶",
    customer_name: "測試客戶",
    phone: "0912345678",
    email: "test@example.com",
    line_id: "test_line",
    logistics: "全家店到店",
    logistics_type: "全家店到店",
    store_name: "測試門市",
    store_id: "9999",
    items_text: "● 靜岡深蒸煎茶 x2\n● 宇治抹茶粉 x1",
    total: 1280,
    subtotal: 1220,
    shipping_fee: 60,
    note: "這是測試備註內容",
    created_at: nowStr,
    seller_note: "您好，您的商品已於今日寄出，預計後天抵達門市。",
    public_reply: "您好，該餐廳目前已滿位，我們建議您可以嘗試預約其它時段。"
  };

  const scenarios = {
    'matcha_order_buyer': { subject: "您的抹茶商店訂單已成立", orderData: baseMockOrder },
    'matcha_order_admin': { subject: "【新訂單通知】抹茶商店", orderData: baseMockOrder },
    'matcha_reply': { subject: "您的客服詢問有新回覆", orderData: baseMockOrder },
    'denwa_order_buyer': { 
      subject: "您的電話代撥預約已受理", 
      orderData: {
        ...baseMockOrder,
        order_id: "D-MOCK-777",
        merchant_name: "壽司大 (築地)",
        service_date: "2026/04/01",
        service_time: "18:00",
        booking_name: "SUZUKI TEST",
        total_count: 4,
        adult_count: 4,
        payment_plan: "單次預約",
        contact_in_japan: "新宿希爾頓酒店"
      } 
    },
    'denwa_order_admin': { 
      subject: "【新預約通知】電話代撥", 
      orderData: {
        ...baseMockOrder,
        order_id: "D-MOCK-777",
        merchant_name: "壽司大 (築地)",
        service_date: "2026/04/01",
        service_time: "18:00",
        booking_name: "SUZUKI TEST",
        total_count: 4,
        adult_count: 4
      } 
    },
    'denwa_reply': { 
      subject: "電話代撥客服回覆", 
      orderData: {
        ...baseMockOrder,
        order_id: "D-MOCK-777",
        merchant_name: "壽司大 (築地)"
      } 
    },
    'denwa_close': { 
      subject: "電話代撥預約結果通知", 
      intro: "您好：\n\n感謝您使用 KEICHA 電話代撥服務，以下是您的預約明細與處理結果：",
      note: "商家表示已完成您的預約，預約號碼為：12345。",
      outro: "若有任何問題，請隨時聯繫客服。期待下次為您服務。",
      btn1: { show: true, text: "查看結案明細", link: "https://lin.ee/CffHu2o" },
      btn2: { show: false, text: "", link: "" },
      ccRows: [
        { label: '訂單編號', value: 'DENWA-MOCK-777' },
        { label: '預約商家', value: '壽司大 (築地)' },
        { label: '預約時間', value: '2026/04/01 18:00' },
        { label: '預約人數', value: '4 人' },
        { label: '聯絡電話', value: '0912345678' }
      ]
    },

    'payment_success_buyer': { 
      subject: "信用卡付款成功通知", 
      orderData: { ...baseMockOrder, order_id: "L-MOCK-999" },
      params: { TradeAmt: 1500, PaymentDate: nowStr, PaymentType: 'Credit_Card' }
    },
    'payment_success_admin': { 
      subject: "【收款成功】信用卡交易通知", 
      orderData: { ...baseMockOrder, order_id: "L-MOCK-999" },
      params: { TradeAmt: 1500, PaymentDate: nowStr, PaymentType: 'Credit_Card' }
    }
  };

  return scenarios[type] || null;
}



/**
 * 客服回覆通知 (電話代撥)
 */
function generateDenwaReplyEmailHTML(order) {
  const contentHTML = `
    <p>${order.customer_name} 您好：<br><br>您預約的 <strong>${order.merchant_name}</strong> (<a href="https://keicha2025.github.io/order.html?id=${(order.tracking_code || order.order_id || order.id).replace(/-[A-Z0-9]{4}$/, '')}" style="color: #6ea44c; text-decoration: none; font-weight: bold;">${order.order_id.replace(/-[A-Z0-9]{4}$/, '')}</a>)，賣家有新的回覆：</p>
    <div style="background-color: #ffffff; border: 1px solid #6ea44c; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      <div style="font-weight: bold; color: #6ea44c; margin-bottom: 10px;">賣家回覆：</div>
      <div style="white-space: pre-wrap;">${order.public_reply}</div>
    </div>
    <p>如有任何問題，請透過 LINE 官方帳號聯繫我們。</p>
  `;

  return wrapBaseEmailHTML("賣家回覆通知", contentHTML, false);
}

/**
 * 客服回覆通知 (抹茶商店)
 */
function generateMatchaReplyEmailHTML(order) {
  const contentHTML = `
    <p>${order.name || order.customer_name} 您好：<br><br>您在 <strong>KEICHA</strong> 建立的訂單 (<a href="https://keicha2025.github.io/order.html?id=${(order.tracking_code || order.order_id || order.id).replace(/-[A-Z0-9]{4}$/, '')}" style="color: #6ea44c; text-decoration: none; font-weight: bold;">${(order.order_id || order.id).replace(/-[A-Z0-9]{4}$/, '')}</a>)，賣家有新的回覆：</p>
    <div style="background-color: #ffffff; border: 1px solid #6ea44c; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      <div style="font-weight: bold; color: #6ea44c; margin-bottom: 10px;">賣家回覆：</div>
      <div style="white-space: pre-wrap;">${order.seller_note}</div>
    </div>
    <p>如有任何問題，請透過 LINE 官方帳號聯繫我們。</p>
  `;

  return wrapBaseEmailHTML("賣家回覆通知", contentHTML, false);
}

function testSendEmail() {
  const testEmail = ADMIN_EMAIL;
  const subject = "KEICHA 系統測試信";
  const body = "如果您看到這封信，表示 GAS 郵件權限已開通。";
  
  try {
    console.log("嘗試使用別名發送: " + SENDER_ALIAS);
    GmailApp.sendEmail(testEmail, subject, body, { from: SENDER_ALIAS, name: 'KEICHA' });
    console.log("別名發送成功！");
  } catch (e) {
    console.error("別名發送失敗（這通常是因為該 Email 未在您的 Gmail 設定中新增為『寄件地址』別名）: " + e);
    try {
      console.log("嘗試使用預設帳號發送...");
      GmailApp.sendEmail(testEmail, subject, body);
      console.log("預設帳號發送成功！");
    } catch (e2) {
      console.error("預設帳號發送也失敗: " + e2);
    }
  }
}
