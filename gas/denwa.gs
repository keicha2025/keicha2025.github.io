// ==========================================
// 設定區 (Configuration)
// ==========================================
const SHEET_ID = '1Q3igPghf2xh3Vbf_uiA_WAcNkMMKLM76_6gRcvCJZw4'; // 代撥專屬表 ID
const SHEET_NAME = 'denwa-orders'; 
const SETTING_SHEET_NAME = '方案設定'; 

const MAIN_SHOP_ID = '1gMCtmZBk8SM2rJUTY1Qz2B4-bUqDuwcnQPrSqMFocQE'; // 商店總表 ID
const MAIN_DB_SHEET_NAME = 'DB_Query'; // 商店總表中的查詢分頁名稱

// ★★★ 請在此填入您要「接收通知」的 Email (您的主帳號) ★★★
const ADMIN_EMAIL = 'wj209ing@gmail.com'; 

// ★★★ 請在此填入寄給客人的「寄件別名」 (必須是您 Gmail 設定過的別名) ★★★
const SENDER_ALIAS = 'keicha.nihoncha@gmail.com';

// ==========================================
// 1. 處理前端送來的 POST 請求 (建立訂單)
// ==========================================
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); 
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'error', 
      'message': '系統忙碌中，請稍後再試'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const params = e.parameter;
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const now = new Date();

    // --- A. 生成訂單編號 ---
    const dateStr = Utilities.formatDate(now, 'Asia/Taipei', 'yyMMdd');
    const idPrefix = 'denwa-' + dateStr;
    let nextSeq = 1;
    const lastRow = sheet.getLastRow();
    
    if (lastRow > 1) {
      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
      const todayIds = ids.filter(id => id && id.toString().startsWith(idPrefix));
      if (todayIds.length > 0) {
        const maxSeq = todayIds.reduce((max, id) => {
          const seqStr = id.toString().replace(idPrefix, '');
          const seq = parseInt(seqStr, 10);
          return seq > max ? seq : max;
        }, 0);
        nextSeq = maxSeq + 1;
      }
    }
    
    const seqStr = nextSeq.toString().padStart(2, '0');
    const orderId = idPrefix + seqStr; 
    
    // --- B. 查找付款連結與價格 ---
    // 這裡會呼叫下方定義的輔助函式
    const paymentLink = getLinkByPlanName(params.paymentPlan);
    const planPrice = getPriceByPlanName(params.paymentPlan); 
    params.paymentLink = paymentLink;

// ... (保留前面代碼) ...

    // --- C. 寫入資料 (代撥專屬表) ---
    // ★★★ 修改：params.phone 改為 "'" + params.phone (強制轉文字) ★★★
    const rowData = [
      orderId,                  
      '待確認',                 
      now,                      
      params.customerName,      
      params.email,             
      params.lineName,          
      params.serviceItem,       
      params.shopName,          
      params.serviceDate,       
      params.serviceTime,       
      params.adultCount,        
      params.childCount,        
      params.totalCount,        
      params.bookingName,       
      "'" + params.phone,  // <--- 這裡加了單引號
      params.paymentPlan,       
      params.note,              
      params.japanContact,
      '' 
    ];

    sheet.appendRow(rowData);

    // --- D. 同步寫入資料 (商店總表 DB_Query) ---
    try {
      const mainSs = SpreadsheetApp.openById(MAIN_SHOP_ID);
      const mainSheet = mainSs.getSheetByName(MAIN_DB_SHEET_NAME);
      const productDetail = `${params.shopName}-電話代撥-${params.paymentPlan}`;
      
      mainSheet.appendRow([
        orderId,        
        productDetail,  
        planPrice,      
        '待確認',       
        '',             
        "'" + params.phone    // <--- 這裡也加了單引號
      ]);
    } catch (err) {
      console.error("寫入總表失敗: " + err.toString());
    }
    
// ... (保留後面代碼) ...
    
    // --- E. 發送確認信 ---
    sendConfirmationEmails(rowData, params);

    return ContentService.createTextOutput(JSON.stringify({
      'result': 'success',
      'order_id': orderId
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock(); 
  }
}

// ==========================================
// 2. 處理 GET 請求
// ==========================================
function doGet(e) {
  const action = e.parameter.action;

  if (action === 'getPlans') {
    return getPlans();
  }
  
  if (action === 'confirm' && e.parameter.order_id) {
    return handleConfirmOrder(e.parameter.order_id);
  }
  
  return HtmlService.createHtmlOutput("無效的請求。");
}

// ==========================================
// 3. 編輯觸發同步功能 (Installable Trigger)
// ==========================================
function syncToMainDB(e) {
  const sheet = e.source.getActiveSheet();
  const range = e.range;
  
  if (sheet.getName() !== SHEET_NAME) return;
  
  const row = range.getRow();
  const col = range.getColumn();
  
  if (row <= 1) return;

  const lastCol = sheet.getLastColumn();
  const rowValues = sheet.getRange(row, 1, 1, lastCol).getValues()[0];
  
  const IDX_ORDER_ID = 0;   // A欄
  const IDX_STATUS = 1;     // B欄 (第2欄)
  const IDX_CUSTOMER = 3;   // D欄
  const IDX_EMAIL = 4;      // E欄
  const IDX_SHOP = 7;       // H欄
  const IDX_REPLY = 18;     // S欄 (第19欄)

  const orderId = rowValues[IDX_ORDER_ID];
  const newStatus = rowValues[IDX_STATUS];
  const publicReply = rowValues[IDX_REPLY];
  
  let mainSheet;
  try {
    mainSheet = SpreadsheetApp.openById(MAIN_SHOP_ID).getSheetByName(MAIN_DB_SHEET_NAME);
  } catch (err) {
    console.error("無法開啟商店總表: " + err.toString());
    return;
  }

  // 情況 A: 編輯「狀態」 (第2欄) -> 同步狀態
  if (col === 2) {
    updateMainDB(mainSheet, orderId, 3, newStatus); 
  }
  
  // 情況 B: 編輯「公開回覆」 (第19欄) -> 同步回覆 + 寄信
  if (col === 19) {
    updateMainDB(mainSheet, orderId, 4, publicReply); 
    
    const customerName = rowValues[IDX_CUSTOMER];
    const customerEmail = rowValues[IDX_EMAIL];
    const shopName = rowValues[IDX_SHOP];
    
    if (customerEmail && publicReply) {
      sendReplyNotification(customerEmail, customerName, orderId, shopName, publicReply);
    }
  }
}

function updateMainDB(sheet, targetOrderId, targetColIndex, newValue) {
  const finder = sheet.getRange("A:A").createTextFinder(targetOrderId);
  const cell = finder.findNext();
  if (cell) {
    const row = cell.getRow();
    sheet.getRange(row, targetColIndex + 1).setValue(newValue);
  }
}

// ==========================================
// 4. 輔助功能函式 (這裡補上了缺失的部分)
// ==========================================
function getPlans() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SETTING_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1);
  const plans = rows.filter(row => row[3] === 'ON').map(row => ({
    name: row[0],
    price: row[1],
    desc: row[2],
    link: row[4] || ''
  }));
  return ContentService.createTextOutput(JSON.stringify(plans)).setMimeType(ContentService.MimeType.JSON);
}

// ★★★ 之前缺失的函式補在這裡 ★★★
function getLinkByPlanName(planName) {
  return getDataFromPlan(planName, 4); // E欄: 付款連結 (Index 4)
}

function getPriceByPlanName(planName) {
  const price = getDataFromPlan(planName, 1); // B欄: 價格 (Index 1)
  return price || 0;
}

function getDataFromPlan(planName, colIndex) {
  if (!planName) return '';
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SETTING_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  // 從第2行開始找
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === planName) {
      return data[i][colIndex];
    }
  }
  return '';
}
// ★★★★★★★★★★★★★★★★★★★★★★

function handleConfirmOrder(targetOrderId) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const COL_STATUS_INDEX = 1; 
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === targetOrderId.toString()) {
      sheet.getRange(i + 1, COL_STATUS_INDEX + 1).setValue('已確認');
      
      // 嘗試同步總表
      try {
        const mainSheet = SpreadsheetApp.openById(MAIN_SHOP_ID).getSheetByName(MAIN_DB_SHEET_NAME);
        updateMainDB(mainSheet, targetOrderId, 3, '已確認');
      } catch(e) {}

      return HtmlService.createHtmlOutput(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #6ea44c;">訂單 ${targetOrderId} 已確認受理</h1>
          <p>系統狀態已更新。</p>
        </div>
      `);
    }
  }
  return HtmlService.createHtmlOutput(`<h1 style="text-align:center; margin-top:50px;">找不到訂單 ${targetOrderId}</h1>`);
}

// ==========================================
// 5. 寄信函式 (新訂單確認信)
// ==========================================
function sendConfirmationEmails(rowData, params) {
  const customerEmail = params.email;
  const orderId = rowData[0];
  const scriptUrl = ScriptApp.getService().getUrl(); 
  const confirmLink = `${scriptUrl}?action=confirm&order_id=${orderId}`;

  let peopleDisplay = `${params.totalCount} 人`;
  const adult = parseInt(params.adultCount) || 0;
  const child = parseInt(params.childCount) || 0;
  if (child > 0) {
    peopleDisplay = `${adult}大${child}小 (共 ${params.totalCount} 人)`;
  }

  let buttonsHtml = `
    <a href="https://line.me/R/ti/p/@366qwylw" style="flex: 1; text-align: center; padding: 12px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 13px; background: #6ea44c; color: #ffffff; display: block;">
      加入好友
    </a>
  `;
  
  if (params.paymentLink && params.paymentLink.startsWith('http')) {
    buttonsHtml += `
      <div style="width: 10px;"></div>
      <a href="${params.paymentLink}" style="flex: 1; text-align: center; padding: 12px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 13px; border: 2px solid #6ea44c; color: #6ea44c; display: block;">
        前往付款
      </a>
    `;
  }

  const generateEmailBody = (isForAdmin) => {
    const titleText = isForAdmin ? "新訂單通知" : "預約確認通知";
    const introText = isForAdmin 
      ? `<div>收到一筆新的預約，訂單編號：<strong style="color: #6ea44c;">${orderId}</strong></div>`
      : `<div style="font-size: 15px;">${params.customerName} 您好：<br><br>我們已收到您的代撥預約申請，以下是您的預約明細：</div>`;
    
    const outroHtml = isForAdmin ? '' : `
      <div style="margin: 25px 0; font-size: 15px; color: #334155;">
        <div>將此訂單資料截圖傳送到我們的 <strong style="color: #6ea44c; font-weight: bold;">LINE 官方帳號</strong>：</div>
        <div style="margin-top: 5px;">LINE ID: @366qwylw</div>
      </div>
    `;

    const adminActionHtml = `
      <div style="margin: 30px 0; text-align: center;">
        <a href="${confirmLink}" style="display: inline-block; padding: 12px 32px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 13px; background: #6ea44c; color: #ffffff;">
          確認受理
        </a>
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
              <tr><th>訂單編號</th><td>${orderId}</td></tr>
              <tr><th>預約商家</th><td>${params.shopName}</td></tr>
              <tr><th>預約時間</th><td>${params.serviceDate} ${params.serviceTime}</td></tr>
              <tr><th>預約英文姓名</th><td>${params.bookingName}</td></tr>
              <tr><th>預約人數</th><td>${peopleDisplay}</td></tr>
              <tr><th>聯絡電話</th><td>${params.phone}</td></tr>
              <tr><th>預約方案</th><td>${params.paymentPlan}</td></tr>
              <tr><th>備註</th><td>${params.note || '無'}</td></tr>
              <tr><th>在日資訊</th><td>${params.japanContact || '無'}</td></tr>
            </table>
            ${outroHtml}
            ${isForAdmin ? '' : `<div style="display: flex; gap: 10px; margin: 30px 0;">${buttonsHtml}</div>`}
            ${isForAdmin ? adminActionHtml : ''}
            <div style="border-top: 1px solid #eee; padding-top: 30px; text-align: center;">
              <p style="font-size: 11px; color: #94a3b8; margin: 0;">若有疑問請聯絡 LINE 官方帳號</p>
              <p style="font-size: 11px; color: #94a3b8; margin: 4px 0 20px; font-weight: bold;">@366qwylw</p>
              <img src="https://keicha2025.github.io/keicha/images/KEICHA_logotype.png" alt="KEICHA" width="120" style="display: block; margin: 10px auto; border: 0;">
              <p style="font-size: 9px; color: #cbd5e1; margin-top: 15px; letter-spacing: 3px;">© 2025 KEICHA ALL RIGHTS RESERVED.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  if(customerEmail) {
    try {
      GmailApp.sendEmail(customerEmail, `預約確認通知 - ${orderId}`, 'HTML Email Required', {
        htmlBody: generateEmailBody(false),
        from: SENDER_ALIAS, 
        name: 'KEICHA 日本電話代撥'
      });
    } catch(e) { console.error(e); }
  }

  GmailApp.sendEmail(ADMIN_EMAIL, `[新預約] ${params.customerName} - ${orderId}`, '新訂單通知', {
    htmlBody: generateEmailBody(true),
    name: 'KEICHA 系統通知'
  });
}

// ==========================================
// 6. 賣家回覆通知信
// ==========================================
function sendReplyNotification(email, name, orderId, shopName, replyContent) {
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
            <div>${name} 您好：</div><br>
            <div>您預約的 <strong>${shopName}</strong> (${orderId})，賣家有新的回覆：</div>
          </div>
          <div style="background-color: #ffffff; border: 1px solid #6ea44c; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <div style="font-weight: bold; color: #6ea44c; margin-bottom: 10px;">賣家回覆：</div>
            <div style="white-space: pre-wrap;">${replyContent}</div>
          </div>
          <div style="margin: 25px 0; font-size: 15px; color: #334155;">
            <div>如有任何問題，請透過 LINE 官方帳號聯繫我們。</div>
          </div>
          <div style="border-top: 1px solid #eee; padding-top: 30px; text-align: center;">
            <p style="font-size: 11px; color: #94a3b8; margin: 0;">LINE ID: @366qwylw</p>
            <img src="https://keicha2025.github.io/keicha/images/KEICHA_logotype.png" alt="KEICHA" width="120" style="display: block; margin: 10px auto; border: 0;">
            <p style="font-size: 9px; color: #cbd5e1; margin-top: 15px; letter-spacing: 3px;">© 2025 KEICHA ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    GmailApp.sendEmail(email, `賣家回覆通知 - ${orderId}`, 'HTML Email Required', {
      htmlBody: htmlBody,
      from: SENDER_ALIAS, 
      name: 'KEICHA 日本電話代撥'
    });
  } catch(e) { console.error("回覆信發送失敗: " + e.toString()); }
}