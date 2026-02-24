/* KEICHA 抹茶商店後端 API - 已新增品牌隱藏邏輯 */

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // --- 1. 讀取品牌列表 ---
  const brandSheet = ss.getSheetByName("brands");
  if (!brandSheet) return createJSONOutput({ error: "找不到 'brands' 分頁" });

  const brandRows = brandSheet.getDataRange().getValues();
  brandRows.shift(); // 移除標題列

  // 修改後的過濾與映射邏輯
  const brands = brandRows.map(row => {
    // 假設 hidden 位於 E 欄 (row[4])
    const isBrandHidden = (row[4] === true || row[4] === "TRUE" || String(row[4]).toLowerCase() === "true");
    
    // 如果隱藏，則回傳 null
    if (isBrandHidden) return null;

    return {
      key: row[0],
      name: row[1],
      status: row[2],
      order: row[3] // 排序權重
    };
  }).filter(b => b !== null && b.key); // 移除隱藏的品牌與空值

  // --- 2. 讀取商品 ---
  // (此處邏輯不變，因為 brands 陣列已經過濾掉隱藏品牌，forEach 自然不會執行該品牌分頁)
  let allProducts = [];

  brands.forEach(brand => {
    const sheet = ss.getSheetByName(brand.key);
    if (sheet) {
      const rows = sheet.getDataRange().getValues();
      rows.shift(); 

      const sheetProducts = rows.map(r => {
        // r[10] (K欄) 為隱藏，支援勾選(TRUE)
        const isHidden = (r[10] === true || r[10] === "TRUE" || String(r[10]).toLowerCase() === "true" || r[10] === "隱藏");
        
        if (isHidden) return null;

        return {
          brand_key:   brand.key,
          name:        r[0],      // A: 商品標題
          spec:        r[1],      // B: 標題旁的小規格
          price:       r[2],      // C: 價格
          price_multi: r[3],      // D: 多件優惠價
          status:      r[4],      // E: 狀態 (控管邏輯用)
          stock:       (String(r[4]).toLowerCase() === "out-of-stock") 
                         ? 0 
                         : ((r[5] === "" || r[5] == null) ? 99 : r[5]), // F: 庫存
          max_limit:   r[6],      // G: 限購 (空=不限)
          note:        r[7],      // H: 右上角標籤
          tag:         r[8],      // I: 標題下方描述
          img:         r[9]       // J: 圖片連結
        };
      }).filter(p => p !== null && p.name && String(p.name).trim() !== ""); 

      allProducts = allProducts.concat(sheetProducts);
    }
  });

  return createJSONOutput({
    brands: brands,
    products: allProducts,
    generated_time: new Date().toString()
  });
}

function createJSONOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) { return createJSONOutput({ status: "success" }); }