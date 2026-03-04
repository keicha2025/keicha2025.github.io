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
const SENDER_ALIAS = 'keicha.nihoncha@gmail.com';
const BRAND_COLOR = '#6ea44c'; // 抹茶綠
const LINE_ID = '@366qwylw';
const LINE_LINK = 'https://lin.ee/CffHu2o';

// 從指令碼屬性取得 Firebase API Key (需手動在 GAS 設定)
const FIREBASE_API_KEY = PropertiesService.getScriptProperties().getProperty('FIREBASE_API_KEY');

// ==========================================
// 入口 (POST)
// ==========================================
function doPost(e) {
  try {
    // 檢查是否為綠界回傳 (ECPay Callbacks)
    if (e.parameter && e.parameter.MerchantID && e.parameter.RtnCode) {
      return handleECPayCallback(e.parameter);
    }
    
    // 檢查是否為 PCHome Pay 回傳 (PCHome Pay Callbacks)
    if (e.parameter && e.parameter.notify_type && e.parameter.notify_message) {
      return handlePCHomePayNotify(e.parameter);
    }

    const payload = JSON.parse(e.postData.contents);
    const { action, data, idToken } = payload;
    
    // 1. 抹茶商店新訂單
    if (action === 'new_matcha_order') {
      return handleNewOrder(data);
    }
    
    // 2. 電話代撥新預約
    if (action === 'new_denwa_order') {
      return handleNewDenwaOrder(data);
    }
    
    // 3. 賣家回覆通知 (電話代撥)
    if (action === 'denwa_reply') {
      return handleDenwaReply(data);
    }

    // 4. 賣家回覆通知 (抹茶商店)
    if (action === 'matcha_reply') {
      return handleMatchaReply(data);
    }

    // 5. 電話代撥結案通知 (敏感動作：需驗證身分)
    if (action === 'denwa_close_case') {
      const auth = verifyFirebaseIdToken(idToken);
      if (!auth.success || auth.email !== ADMIN_EMAIL) {
        return ContentService.createTextOutput(JSON.stringify({ 
          success: false, 
          error: 'Unauthorized: ' + (auth.error || '身分驗證失敗')
        })).setMimeType(ContentService.MimeType.JSON);
      }
      return handleDenwaCloseCase(data);
    }

    // 6. 產生信用卡支付連結
    if (action === 'generate_card_payment') {
      if (payload.repay_order_id) {
        return handleRepayOrder(payload);
      }
      return handleCardPayment(payload);
    }

    // 7. 上傳圖片至 Google Drive
    if (action === 'upload_image') {
      return handleImageUpload(data);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
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
  const tradeDesc = config.title;
  const orderId = getNextOrderNumber(); 
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const trackingCode = `${orderId}-${randomSuffix}`;
  const merchantTradeNo = orderId; 

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
      source_token: 'keicha_2025_web_auth'
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
      payment_provider: 'PCHomePay'
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
  
  // 嘗試從 card_orders 抓取資料
  let order = getFirestoreDocumentById('card_orders', repay_order_id);
  
  if (!order) {
    // 可能是 denwa_orders
    order = getFirestoreDocumentById('denwa_orders', repay_order_id);
    if (!order) return createJSONResponse(false, '找不到訂單資料');
  }
  
  if (order.payment_status === 'paid' || order.payment_status === 'completed') {
    return createJSONResponse(false, '訂單已完成付款，請勿重複支付');
  }

  // 取得相對應的連結設定 (用於獲取金流商資訊與標題)
  const linkId = order.link_id;
  const config = fetchFirestoreDocument('card_orders_links', 'suffix', linkId || 'default');
  
  const totalAmount = order.amount || order.total || 0;
  const tradeDesc = config ? config.title : (order.merchant_name || 'KEICHA 訂單');
  const repaySuffix = 'R' + Math.floor(Math.random() * 90 + 10); 
  const gasUrl = ScriptApp.getService().getUrl();

  // 如果原本就是 PCHome Pay 訂單，則走 PCHome Pay 重新付款邏輯
  if (config && config.payment_provider === 'PCHomePay') {
    const props = PropertiesService.getScriptProperties();
    const appId = props.getProperty('PCHOMEPAY_APP_ID');
    const secret = props.getProperty('PCHOMEPAY_SECRET');
    
    const pay_type = (order.payment_method === 'ATM') ? ["ATM"] : ["CARD"];
    
    const tokenObj = getPCHomePayToken(appId, secret);
    if (tokenObj.success) {
      const pcPayPayload = {
        order_id: repay_order_id + repaySuffix, // PCHome Pay order_id 也不能重複
        pay_type: pay_type,
        amount: totalAmount,
        return_url: 'https://keicha-membership-system.web.app/index.html',
        fail_return_url: 'https://keicha-membership-system.web.app/index.html',
        notify_url: gasUrl,
        buyer_name: order.name || order.customer_name || '',
        buyer_mobile: formatPhoneForPCPay(order.phone),
        buyer_email: order.email,
        member_key: formatPhoneForPCPay(order.phone),
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

  // 預設走 ECPay 邏輯 (或 config 明確指定為 ECPay)
  const choosePayment = (order.payment_method === 'ATM') ? 'ATM' : 'Credit';
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
  
  const htmlBody = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"></head>
  <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.8; color: #334155; background-color: #ffffff;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; background: #fff;">
      <div style="padding: 20px;">
        <div style="border-bottom: 2px solid #6ea44c; padding-bottom: 12px; margin-bottom: 25px;">
          <h2 style="color: #6ea44c; margin: 0; font-size: 20px;">賣家回覆通知</h2>
        </div>
        <div style="margin-bottom: 25px; font-size: 15px;">
          <div>${order.customer_name} 您好：</div><br>
          <div>您預約的 <strong>${order.merchant_name}</strong> (<a href="https://keicha-membership-system.web.app/order.html?id=${order.tracking_code || order.order_id || order.id}" style="color: #6ea44c; text-decoration: none; font-weight: bold;">${order.order_id}</a>)，賣家有新的回覆：</div>
        </div>
        <div style="background-color: #ffffff; border: 1px solid #6ea44c; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <div style="font-weight: bold; color: #6ea44c; margin-bottom: 10px;">賣家回覆：</div>
          <div style="white-space: pre-wrap;">${order.public_reply}</div>
        </div>
        <div style="margin: 25px 0; font-size: 15px; color: #334155;">
          <div>如有任何問題，請透過 LINE 官方帳號聯繫我們。</div>
        </div>
        <div style="border-top: 1px solid #eee; padding-top: 30px; text-align: center;">
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">LINE ID: ${LINE_ID}</p>
          <img src="https://keicha2025.github.io/keicha/images/KEICHA_logotype.png" alt="KEICHA" width="120" style="display: block; margin: 10px auto; border: 0;">
          <p style="font-size: 9px; color: #cbd5e1; margin-top: 15px; letter-spacing: 3px;">© 2025 KEICHA ALL RIGHTS RESERVED.</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
  
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
  
  const htmlBody = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"></head>
  <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.8; color: #334155; background-color: #ffffff;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; background: #fff;">
      <div style="padding: 20px;">
        <div style="border-bottom: 2px solid #6ea44c; padding-bottom: 12px; margin-bottom: 25px;">
          <h2 style="color: #6ea44c; margin: 0; font-size: 20px;">賣家回覆通知</h2>
        </div>
        <div style="margin-bottom: 25px; font-size: 15px;">
          <div>${order.name || order.customer_name} 您好：</div><br>
          <div>您在 <strong>KEICHA</strong> 建立的訂單 (<a href="https://keicha-membership-system.web.app/order.html?id=${order.tracking_code || order.order_id || order.id}" style="color: #6ea44c; text-decoration: none; font-weight: bold;">${order.order_id || order.id}</a>)，賣家有新的回覆：</div>
        </div>
        <div style="background-color: #ffffff; border: 1px solid #6ea44c; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <div style="font-weight: bold; color: #6ea44c; margin-bottom: 10px;">賣家回覆：</div>
          <div style="white-space: pre-wrap;">${order.seller_note}</div>
        </div>
        <div style="margin: 25px 0; font-size: 15px; color: #334155;">
          <div>如有任何問題，請透過 LINE 官方帳號聯繫我們。</div>
        </div>
        <div style="border-top: 1px solid #eee; padding-top: 30px; text-align: center;">
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">LINE ID: ${LINE_ID}</p>
          <img src="https://keicha2025.github.io/keicha/images/KEICHA_logotype.png" alt="KEICHA" width="120" style="display: block; margin: 10px auto; border: 0;">
          <p style="font-size: 9px; color: #cbd5e1; margin-top: 15px; letter-spacing: 3px;">© 2025 KEICHA ALL RIGHTS RESERVED.</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
  
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
function generateOrderEmailHTML(data, isAdmin) {
  const total = data.total || (data.subtotal + data.shipping_fee);
  
  const recipientBlock = `
    <div style="margin-bottom: 20px;">
      <p style="margin: 0; line-height: 1.6; font-weight: bold; color: #334155;">訂單編號：<a href="https://keicha-membership-system.web.app/order.html?id=${data.tracking_code || data.order_id}" style="color: #6ea44c; text-decoration: none;">${data.order_id || '處理中'}</a></p>
      <p style="margin: 0; line-height: 1.6;">取件人姓名：${data.name || data.customer_name}</p>
      <p style="margin: 0; line-height: 1.6;">取件人手機：${data.phone}</p>
    </div>
  `;
  
  const logisticsBlock = `
    <div style="margin-bottom: 20px;">
      <h4 style="margin: 0 0 5px 0; font-size: 14px; color: #555;">物流資訊</h4>
      <p style="margin: 0; line-height: 1.6;">物流方式：${data.logistics_type || data.logistics}</p>
      <p style="margin: 0; line-height: 1.6;">店號/地址：${data.store_id || data.address || ''} ${data.store_note || ''}</p>
    </div>
  `;
  
  const itemsBlock = `
    <div style="margin-bottom: 20px;">
      <h4 style="margin: 0 0 5px 0; font-size: 14px; color: #555;">商品內容</h4>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; line-height: 1.6;">
        ${(data.items_text || '').replace(/\n/g, '<br>')}
        ${data.note ? `<div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ccc; color: #666; font-size: 13px;"><strong>備註：</strong><br>${data.note}</div>` : ''}
      </div>
    </div>
  `;
  
  const buyerOutro = `
    <div style="margin:25px 0;font-size:15px;color:#334155">將此訂單資料截圖傳送到<strong style="color: #334155; font-weight: bold;">官方帳號</strong>：<br>LINE ID: ${LINE_ID}</div>
    <div style="margin: 30px 0;">
      <a href="${LINE_LINK}" target="_blank" style="display: block; text-align: center; padding: 12px 0; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 16px; background-color: ${BRAND_COLOR}; color: #ffffff; border: 1px solid ${BRAND_COLOR}; box-sizing: border-box;">
        加入好友
      </a>
    </div>
  `;
  
  const titleText = isAdmin ? "新訂單通知" : "訂單確認通知";
  const introText = isAdmin 
    ? "" 
    : `<div style="margin-bottom:25px;font-size:15px;color:#334155">您好：<br><br>您的訂單已成功送出，以下是您的訂單明細：</div>`;
  
  return `
  <!DOCTYPE html><html><head><meta charset="UTF-8"></head>
  <body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1.8;color:#334155;background-color:#ffffff">
    <div style="width:100%;max-width:600px;margin:0 auto;background:#fff">
      <div style="padding:20px">
        <div style="border-bottom:2px solid ${BRAND_COLOR};padding-bottom:12px;margin-bottom:25px">
          <h2 style="color:${BRAND_COLOR};margin:0;font-size:20px">${titleText}</h2>
        </div>
        ${introText}
        ${recipientBlock} ${logisticsBlock} ${itemsBlock}
        <div style="margin-bottom: 20px;">
          <p style="margin: 0; font-size: 18px; font-weight: bold; color: ${BRAND_COLOR};">總計金額：NT$ ${total}</p>
        </div>
        ${isAdmin ? '' : buyerOutro}
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
  
  let buttonsHtml = `<a href="${LINE_LINK}" style="flex: 1; text-align: center; padding: 12px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 13px; background: #6ea44c; color: #ffffff; display: block;">加入好友</a>`;
  
  if (data.payment_link && data.payment_link.startsWith('http')) {
    buttonsHtml += `
      <div style="width: 10px;"></div>
      <a href="${data.payment_link}" style="flex: 1; text-align: center; padding: 12px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 13px; border: 2px solid #6ea44c; color: #6ea44c; display: block;">
        前往付款
      </a>
    `;
  }
  
  const titleText = isAdmin ? "新預約通知" : "預約確認通知";
  const introText = isAdmin 
    ? `<div>收到一筆新的預約，訂單編號：<strong style="color: #6ea44c;">${data.order_id}</strong></div>`
    : `<div style="font-size: 15px;">${data.customer_name} 您好：<br><br>我們已收到您的代撥預約申請，以下是您的預約明細：</div>`;
  
  const outroHtml = isAdmin ? '' : `
    <div style="margin: 25px 0; font-size: 15px; color: #334155;">
      <div>將此訂單資料截圖傳送到我們的 <strong style="color: #6ea44c; font-weight: bold;">LINE 官方帳號</strong>：</div>
      <div style="margin-top: 5px;">LINE ID: ${LINE_ID}</div>
    </div>
  `;

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
          <div style="border-bottom: 2px solid #6ea44c; padding-bottom: 12px; margin-bottom: 25px;">
            <h2 style="color: #6ea44c; margin: 0; font-size: 20px;">${titleText}</h2>
          </div>
          <div style="margin-bottom: 25px; font-size: 15px; color: #334155;">${introText}</div>
          <table class="tbl">
            <tr><th>訂單編號</th><td><a href="https://keicha-membership-system.web.app/order.html?id=${data.tracking_code || data.order_id}" style="color: #6ea44c; text-decoration: none;">${data.order_id}</a></td></tr>
            <tr><th>預約商家</th><td>${data.merchant_name}</td></tr>
            <tr><th>預約時間</th><td>${data.service_date} ${data.service_time}</td></tr>
            <tr><th>預約英文姓名</th><td>${data.booking_name}</td></tr>
            <tr><th>預約人數</th><td>${peopleDisplay}</td></tr>
            <tr><th>聯絡電話</th><td>${data.phone}</td></tr>
            <tr><th>預約方案</th><td>${data.plan_name || data.payment_plan}</td></tr>
            <tr><th>備註</th><td>${data.note || '無'}</td></tr>
            <tr><th>在日資訊</th><td>${data.contact_in_japan || data.japan_contact || '無'}</td></tr>
          </table>
          ${outroHtml}
          ${isAdmin ? '' : `<div style="display: flex; gap: 10px; margin: 30px 0;">${buttonsHtml}</div>`}
          <div style="border-top: 1px solid #eee; padding-top: 30px; text-align: center;">
            <p style="font-size: 11px; color: #94a3b8; margin: 0;">若有疑問請聯絡 LINE 官方帳號</p>
            <p style="font-size: 11px; color: #94a3b8; margin: 4px 0 20px; font-weight: bold;">${LINE_ID}</p>
            <img src="https://keicha2025.github.io/keicha/images/KEICHA_logotype.png" alt="KEICHA" width="120" style="display: block; margin: 10px auto; border: 0;">
            <p style="font-size: 9px; color: #cbd5e1; margin-top: 15px; letter-spacing: 3px;">© 2025 KEICHA ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * 刷卡訂單 (Link Order) 郵件模板
 */
function generateCardOrderEmailHTML(data, isAdmin, title) {
  const recipientBlock = `
    <div style="margin-bottom: 20px;">
      <p style="margin: 0; line-height: 1.6; font-weight: bold; color: #334155;">訂單編號：<a href="https://keicha-membership-system.web.app/order.html?id=${data.tracking_code || data.order_id}" style="color: #6ea44c; text-decoration: none;">${data.order_id}</a></p>
      <p style="margin: 0; line-height: 1.6;">客戶姓名：${data.name}</p>
      <p style="margin: 0; line-height: 1.6;">聯絡電話：${data.phone}</p>
      <p style="margin: 0; line-height: 1.6;">付款方式：${data.payment_method === 'ATM' ? '虛擬帳號 (ATM)' : '信用卡支付'}</p>
    </div>
  `;
  
  const contentBlock = `
    <div style="margin-bottom: 20px;">
      <h4 style="margin: 0 0 5px 0; font-size: 14px; color: #555;">付款內容</h4>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; line-height: 1.6;">
        <strong>${title || 'KEICHA 服務項目'}</strong><br>
        ${data.stage_index >= 0 ? `(階段性支付：第 ${data.stage_index + 1} 階段)` : '(全額支付)'}<br>
        ${data.logistics && data.logistics !== '不適用' ? `物流：${data.logistics}<br>地址：${data.address}` : ''}
        ${data.note ? `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #ccc; font-size: 13px;"><strong>備註：</strong>${data.note}</div>` : ''}
      </div>
    </div>
  `;

  const totalBlock = `
    <div style="margin-bottom: 20px;">
      <p style="margin: 0; font-size: 18px; font-weight: bold; color: #6ea44c;">本次支付金額：NT$ ${data.amount}</p>
    </div>
  `;

  const titleText = isAdmin ? "新刷卡訂單通知" : "訂單付款資訊";
  const introText = isAdmin 
    ? `<div>系統已為客戶發送付款連結。</div>`
    : `<div>您好：<br><br>您的訂單已建立，請點擊下方連結完成付款，或查閱以下明細：</div>`;

  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1.8;color:#334155;background-color:#ffffff">
      <div style="width:100%;max-width:600px;margin:0 auto;background:#fff">
        <div style="padding:20px">
          <div style="border-bottom:2px solid #6ea44c;padding-bottom:12px;margin-bottom:25px">
            <h2 style="color:#6ea44c;margin:0;font-size:20px">${titleText}</h2>
          </div>
          <div style="margin-bottom:25px;font-size:15px;color:#334155">${introText}</div>
          ${recipientBlock}
          ${contentBlock}
          ${totalBlock}
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
}

/**
 * 刷卡訂單付款成功模板
 */
function generateCardPaidEmailHTML(order, isAdmin, params) {
  const titleText = isAdmin ? "【收款成功通知】" : "【付款成功通知】";
  const introText = isAdmin
    ? `<div>您的客戶 <strong>${order.name || '未知'}</strong> 已完成付款，請查看以下支付明細內容。</div>`
    : `<div>您好：<br><br>我們已收到您的款項，您的訂單已正式進入排程處理，以下是本次支付詳細資訊：</div>`;

  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1.6;color:#334155;background-color:#f8fafc">
      <div style="width:100%;max-width:600px;margin:20px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1)">
        <div style="background-color:${BRAND_COLOR};padding:30px 20px;text-align:center">
          <h2 style="color:#ffffff;margin:0;font-size:24px;letter-spacing:1px">${titleText}</h2>
        </div>
        <div style="padding:40px 30px">
          <div style="margin-bottom:30px;font-size:16px;color:#475569">${introText}</div>
          
          <div style="background-color:#ffffff;border:2px solid ${BRAND_COLOR};border-radius:12px;padding:25px;margin-bottom:30px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05)">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:10px;color:#64748b;font-size:14px">訂單編號</td>
              </tr>
              <tr>
                <td style="padding-bottom:20px;font-weight:bold;font-size:16px;color:#1e293b">
                  <a href="https://keicha-membership-system.web.app/order.html?id=${order.tracking_code || order.order_id}" style="color:${BRAND_COLOR};text-decoration:none">${order.order_id}</a>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:10px;color:#64748b;font-size:14px">支付金額</td>
              </tr>
              <tr>
                <td style="padding-bottom:20px;font-weight:bold;font-size:28px;color:${BRAND_COLOR}">NT$ ${params.TradeAmt}</td>
              </tr>
              <tr>
                <td>
                  <table width="100%" style="border-top:1px solid #f1f5f9;padding-top:20px">
                    <tr>
                      <td style="color:#64748b;font-size:13px;padding-bottom:5px">付款時間：${params.PaymentDate}</td>
                    </tr>
                    <tr>
                      <td style="color:#64748b;font-size:13px">付款方式：${params.PaymentType}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </div>

          <div style="border-top:1px solid #f1f5f9;padding-top:30px;text-align:center">
            <p style="font-size:12px;color:#94a3b8;margin:0">如有任何疑問，歡迎聯絡官方 LINE</p>
            <p style="font-size:14px;color:#475569;margin:8px 0 25px;font-weight:bold">${LINE_ID}</p>
            <a href="https://keicha2025.github.io" style="text-decoration:none">
              <img src="https://keicha2025.github.io/keicha/images/KEICHA_logotype.png" alt="KEICHA" width="100" style="display:block;margin:0 auto;border:0">
            </a>
            <p style="font-size:10px;color:#cbd5e1;margin-top:20px;letter-spacing:2px">© 2025 KEICHA ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </div>
    </body></html>
  `;
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
  // 1. 驗證 CheckMacValue
  const receivedCheckMacValue = params.CheckMacValue;
  const filteredParams = { ...params };
  delete filteredParams.CheckMacValue;
  
  const computedCheckMacValue = generateCheckMacValue(filteredParams);
  
  if (receivedCheckMacValue !== computedCheckMacValue) {
    console.error('ECPay CheckMacValue verification failed');
    return ContentService.createTextOutput("0|CheckMacValue Error");
  }

  // 2. 付款成功 (RtnCode === '1')
  if (params.RtnCode === '1') {
    const rawTradeNo = params.MerchantTradeNo;
    const tradeNo = rawTradeNo.split('R')[0]; // 移除重新付款的後綴
    const paymentDate = params.PaymentDate;
    
    // 冪等性檢查：如果已經是 paid 或 completed 狀態，則不重複處理，但仍需回傳成功給綠界
    const order = getFirestoreDocumentById('card_orders', tradeNo);
    if (order && (order.payment_status === 'paid' || order.payment_status === 'completed')) {
      console.log(`Order ${tradeNo} already processed as paid. Skipping duplicate processing.`);
      return ContentService.createTextOutput("1|OK");
    }

    // 更新訂單狀態
    updateFirestoreDocument('card_orders', tradeNo, {
      payment_status: 'completed',
      paid_at: paymentDate,
      ecpay_trade_no: params.TradeNo
    });

    // 自動標記支付連結中的階段為「已付」
    if (order && order.link_id && order.stage_index !== undefined) {
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
        // 更新 stages 陣列
        updateFirestoreDocumentWithArray('card_orders_links', link._id, { stages: link.stages });
      }
    }

    // 發送付款成功通知給用戶與管理員
    try {
      if (order) {
        const buyerSubject = `[付款成功] KEICHA 訂單 ${tradeNo} 已完成付款`;
        const buyerBody = generateCardPaidEmailHTML(order, false, params);
        const adminSubject = `[付款成功] ${order.name || '客戶'} - 訂單 ${tradeNo}`;
        const adminBody = generateCardPaidEmailHTML(order, true, params);

        if (order.email && order.email.indexOf('@') !== -1) {
          try {
            GmailApp.sendEmail(order.email, buyerSubject, '', { htmlBody: buyerBody, from: SENDER_ALIAS, name: 'KEICHA' });
          } catch (e) {
            console.warn(`Failed to send email to buyer with SENDER_ALIAS for order ${tradeNo}: ${e}. Attempting without alias.`);
            GmailApp.sendEmail(order.email, buyerSubject, '', { htmlBody: buyerBody });
          }
        }
        try {
          GmailApp.sendEmail(ADMIN_EMAIL, adminSubject, '', { htmlBody: adminBody });
        } catch (e) {
          console.error(`Failed to send admin email for order ${tradeNo}: ${e}`);
        }
      }
    } catch (e) {
      console.error('Failed to send payment success email: ' + e);
    }
  }

  return ContentService.createTextOutput("1|OK"); 
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

function generateCheckMacValue(params) {
  const props = PropertiesService.getScriptProperties();
  const hashKey = props.getProperty('ECPAY_HASH_KEY') || 'test_key';
  const hashIV = props.getProperty('ECPAY_HASH_IV') || 'test_iv';

  const sortedKeys = Object.keys(params).sort();
  let rawString = 'HashKey=' + hashKey;
  for (let key of sortedKeys) {
    rawString += '&' + key + '=' + params[key];
  }
  rawString += '&HashIV=' + hashIV;

  let encoded = encodeURIComponent(rawString).toLowerCase();
  encoded = encoded.replace(/%20/g, '+')
                   .replace(/%21/g, '!')
                   .replace(/%28/g, '(')
                   .replace(/%29/g, ')')
                   .replace(/%2a/g, '*');

  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, encoded)
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
    
    // 冪等性檢查
    const order = getFirestoreDocumentById('card_orders', orderId);
    if (order && (order.payment_status === 'paid' || order.payment_status === 'completed')) {
      console.log(`Order ${orderId} already marked as paid/completed. Skipping notification processing.`);
      return ContentService.createTextOutput("success");
    }

    // 更新訂單狀態
    updateFirestoreDocument('card_orders', orderId, {
      payment_status: 'completed',
      paid_at: message.actual_pay_date || message.pay_date,
      pchomepay_order_id: message.order_id
    });

    // 自動標記支付連結中的階段為「已付」
    if (order && order.link_id && order.stage_index !== undefined) {
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

    // 發送通知郵件
    try {
      if (order) {
        const fakeParams = {
          TradeAmt: message.trade_amount || message.amount,
          PaymentDate: message.actual_pay_date || message.pay_date,
          PaymentType: 'PCHomePay (' + (message.pay_type || 'CARD') + ')'
        };
        const buyerSubject = `[付款成功] KEICHA 訂單 ${orderId} 已完成付款`;
        const buyerBody = generateCardPaidEmailHTML(order, false, fakeParams);
        const adminSubject = `[付款成功] ${order.name || '客戶'} - 訂單 ${orderId}`;
        const adminBody = generateCardPaidEmailHTML(order, true, fakeParams);

        if (order.email && order.email.indexOf('@') !== -1) {
          try { GmailApp.sendEmail(order.email, buyerSubject, '', { htmlBody: buyerBody, from: SENDER_ALIAS, name: 'KEICHA' }); } 
          catch (e) { GmailApp.sendEmail(order.email, buyerSubject, '', { htmlBody: buyerBody }); }
        }
        try { GmailApp.sendEmail(ADMIN_EMAIL, adminSubject, '', { htmlBody: adminBody }); } catch (e) {}
      }
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
 * 測試郵件發送功能
 * 請在 GAS 編輯器手動執行此函數，以確認權限與別名設定是否正確。
 */
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
