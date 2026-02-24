/**
 * KEICHA Firebase Notification Handler (GAS)
 * 用於接收來自前端的呼叫並發送 Email 通知
 */

// ==========================================
// 設定區
// ==========================================
const ADMIN_EMAIL = 'wj209ing@gmail.com';
const SENDER_ALIAS = 'keicha.nihoncha@gmail.com';
const BRAND_COLOR = '#6ea44c'; // 抹茶綠
const LINE_ID = '@366qwylw';
const LINE_LINK = 'https://lin.ee/QJU5mUO';

// 從指令碼屬性取得 Firebase API Key (需手動在 GAS 設定)
const FIREBASE_API_KEY = PropertiesService.getScriptProperties().getProperty('FIREBASE_API_KEY');

// ==========================================
// 入口 (POST)
// ==========================================
function doPost(e) {
  try {
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

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
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
  const buyerSubject = `KEICHA 訂單確認通知 (${order.order_id || '新訂單'})`;
  const buyerBody = generateOrderEmailHTML(order, false);
  const adminSubject = `[新訂單] ${order.name || order.customer_name} - $${order.total}`;
  const adminBody = generateOrderEmailHTML(order, true);
  
  const email = order.email;
  if (email && email.includes('@')) {
    GmailApp.sendEmail(email, buyerSubject, '', { htmlBody: buyerBody, from: SENDER_ALIAS, name: 'KEICHA' });
  }
  GmailApp.sendEmail(ADMIN_EMAIL, adminSubject, '', { htmlBody: adminBody });
  
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleNewDenwaOrder(order) {
  const buyerSubject = `預約確認通知 - ${order.order_id}`;
  const buyerBody = generateDenwaEmailHTML(order, false);
  const adminSubject = `[新預約] ${order.customer_name} - ${order.order_id}`;
  const adminBody = generateDenwaEmailHTML(order, true);
  
  const email = order.email;
  if (email && email.includes('@')) {
    GmailApp.sendEmail(email, buyerSubject, '', { htmlBody: buyerBody, from: SENDER_ALIAS, name: 'KEICHA' });
  }
  GmailApp.sendEmail(ADMIN_EMAIL, adminSubject, '', { htmlBody: adminBody });
  
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
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
          <div>您預約的 <strong>${order.merchant_name}</strong> (${order.order_id})，賣家有新的回覆：</div>
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
          <div>您在 <strong>KEICHA</strong> 建立的訂單 (${order.order_id || order.id || ''})，賣家有新的回覆：</div>
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
      <p style="margin: 0; line-height: 1.6; font-weight: bold; color: #334155;">訂單編號：${data.order_id || '處理中'}</p>
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
            <tr><th>訂單編號</th><td>${data.order_id}</td></tr>
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
