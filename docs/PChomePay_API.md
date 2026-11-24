

**PChomePay**

API document

# **1\. 申請方式**

1. 合作方可申請正式及測試 APP ID 及 SECRET  
2. 請求 API 都須經由 HTTP Basic Auth 加上 APP ID 及 SECRET 來完成  
3. 如欲針對發起請求之 IP 設限，須於申請串接服務前提供 IP，或於服務開通後至會員中心自行設置白名單  
4. 合作方如有防火牆設定，為確保串接順利，請先開通我們的連線 IP 位址

# **2\. 費用說明**

1. 金流手續費採內扣制，交易成功後將訂單金額扣除手續費後，內帳至合作方之代收帳戶中  
2. 手續費只跟合作方收取，用戶無須負擔  
3. 退款時帳戶中，必須包含應退款金額 \+ 退款手續費，方可發動退款

# **3\. 付款方式**

1. 信用卡  
   1. 用戶各分期 0 利率  
   2. 可全額退款或部分退款  
   3. 支援 VISA / Mastercard / JCB 國外卡交易（合作方須須在後台開啟此功能）  
   4. 國外卡交易僅提供一次付清  
   5. 無退款手續費  
2. 拍錢包  
   1. 用戶[綁定聯名卡交易享 5% P 幣回饋](https://www.esunbank.com/zh-tw/personal/credit-card/intro/co-branded-card/pi-card)  
   2. 可全額退款或部分退款  
   3. 用戶須是拍錢包會員且使用拍錢在 5 分鐘完成付款  
   4. 用戶可使用綁卡一次付清交易或慢點付支付且可使用 P 幣折抵（1 P 幣 \= 1 元）  
   5. 無退款手續費  
3. ATM 虛擬帳號  
   1. 用戶可選擇 3 家銀行虛擬帳號付款（免跨行轉帳手續費，他行轉帳手續費由轉帳銀行收取）  
   2. 可全額退款或部分退款  
   3. 合作方須負擔退款手續費  
   4. 可設置虛擬帳號有效期限  
4. 超商取貨付款  
   1. 合作方須先至後台設置退件聯繫資訊  
   2. 當商品寄出後，無論用戶是否有取貨付款，合作方須負擔該筆物流手續費  
   3. 僅能全額退款，且退款時須提供欲退回款項之銀行帳戶  
5. 超商代碼  
   1. 僅能全額退款，且退款時須提供欲退回款項之銀行帳戶  
   2. 用戶付款方式範例說明  
      1. 訂單資訊  
         1. 合作方訂單編號：B2C1747135711  
         2. 訂單金額：100  
         3. 繳款期限：2025/05/20 23:59:59  
         4. 代碼 / 條碼資訊  
            付款代碼：047863167030  
            第 1 段條碼：140520980  
            第 2 段條碼：0478631620040001  
            第 3 段條碼：842359540000100  
      2. 合作方可以提供  
         1. code39 格式之 3 段條碼（用戶可依此條碼直接至超商櫃檯掃描繳費）  
            140520980  
            ![][image1]  
            0478631620040001  
            ![][image2]  
            842359540000100  
            ![][image3]  
         2. 繳費 QR Code（用戶可依此 QR code 直接至超商櫃檯掃描繳費）  
            將 3 段條碼之資訊放依序放在 Code1、Code2 和 Code3 並產生 QR Code  
            {"Utility":\[{"Ordinary":\[{"Device":"POS","Code1":"140520980","Code2":"0478631620040001","Code3":"842359540000100"}\]}\]}  
            ![][image4]  
         3. 繳費代碼（用戶須至 ibon 機台輸入此代碼或透過掃描 QR Code 產生繳費單後，至超商櫃檯掃描繳費）  
            047863167030  
            ![][image5]

# 

# **4\. 串接流程**

## 流程圖

採用 REST 格式串接，減少開發難度，API 除對帳為特規 JSON 外，其他所有請求以及回應都以 JSON 做為標準請求或回傳格式。

## Domain Name

正式環境

```shell
https://api.pchomepay.com.tw
```

測試環境

```shell
https://sandbox-api.pchomepay.com.tw
```

## 

## 請求方法

1. 合作方需在 HTTP Basic Auth 加入所申請之 APP ID 及 SECRET 以確認擁有授權，並依需求請求相對應 API 服務  
2. 請求格式採用 JSON 做為標準請求格式，我們也會以 JSON 格式依照請求成功與否做出相對應回應  
3. 正式和測試環境會透過以下位址發送 API 請求，為了確保能收到 Notify 通知，可將以下 IP 加入白名單中。

```shell
113.196.231.190
```

   

**取得 token 請求範例**

```shell
curl --location --request POST 'https://api.pchomepay.com.tw/v1/token' \
--header 'Authorization: Basic RTIzNjc5QkY2NEFFNDU0RjRDQjY3MTFGQUMzNjp4UGdWTmdXb2I4YkdnRVQyZUJSc25pX3lYRW10cXV0bHhVa19VVXVo' \
--header 'Cookie: PHPSESSID=bfap42jg1oc3a0cetl76gb8umd; Wf9N4nm3xC/IBA@@=v1D8w6g++C0xr'
```

**建立 ATM 虛擬帳號訂單**

```shell
curl --location 'https://api.pchomepay.com.tw/v1/payment/atmva' \
--header 'Content-Type: application/json' \
--header 'pcpay-token: tiBZfJg_e_uxMyqZt4KuS3w_l7N4F8atjXfCTycU' \
--header 'Cookie: PHPSESSID=bfap42jg1oc3a0cetl76gb8umd; Wf9N4nm3xC/IBA@@=v1D8w6g++C0xr' \
--data '{
    "order_id": "B2CATM1696314297",
    "amount":500,
    "item_name":"休閒褲",
    "item_url":"https://shop.googlemerchandisestore.com/",
    "expire_days":3,
    "atm_bank": "812"
}'
```

## 

## 測試說明

以下規則僅限用於 Sandbox 測試環境中，方便合作方可以模擬正式環境中的各種訂單情境用於測試使用。

1\. 信用卡

* 成功訂單  
* VISA  
  * 卡號: 4013-5243-8125-0527  
    * 有效期限(月/年): 12/30  
    * 安全碼: 999  
  * JCB  
    * 卡號: 3534-0332-8368-6434  
    * 有效期限(月/年): 12/30  
    * 安全碼: 999  
  * Mastercard  
    * 卡號: 5172-0254-1302-0031  
    * 有效期限(月/年): 12/30  
    * 安全碼: 999  
* 失敗訂單  
* 卡號: 5149-1477-0000-0300  
* 有效期限(月/年): 08/25  
* 安全碼: 231

2\. ATM

* 自動付款完成：訂單金額尾數 0 \~ 7  
* 依 expire\_days 參數過期訂單：訂單金額尾數 8  
* 5 分鐘後虛擬帳號過期：訂單金額尾數 9

4\. 超商取貨

* 7-11 門市：桃園市桃園區中埔六街36號1樓 維瀚門市  
* 各訂單金額尾數之物流狀態  
  * 0 或 6 \~ 9：已建立  
  * 1：已交寄  
  * 2：配送中  
  * 3：已到店  
  * 4：已收款  
  * 5：已退件

5\. 代碼付款

* 3 分鐘後自動付款完成：訂單金額尾數 0 \~ 5  
* 3 分鐘後逾期付款失敗：訂單金額尾數 6  
* 依正常流程處理訂單狀態：訂單金額尾數 7 \~ 9

# **5\. API**

## 取得 Token

需先取得 Token 之後，再將 Token 帶入 header 中 pcpay-token 之欄位來發起其他請求。

**POST	https://api.pchomepay.com.tw/v1/token**

| 請求欄位 | 必填 | 型態 | 說明 |
| ----- | :---: | :---: | :---- |
| 無 |  |  |  |

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| token | \* | String(50) | 回應之 token 值 |
| expired\_in | \* | Int | token 失效的秒數，預設為 28,800 秒（8 小時） |
| expired\_timestamp | \* | Int | token 失效的時間 |

**範例程式碼 (php)**

```php
<?php
//取得新的 token, 如果 token 還在有效期內的話請不要重複取得
$str_url = 'https://api.pchomepay.com.tw/v1/token';
$headers = array(
    'Content-Type:application/json',
    //將 APPID 和 SECRET 以 base64 encode 後帶在 header 中取得 token
    'Authorization: Basic '. base64_encode("0F46D58D576A09BD96E4F22339A5:8gKryfZEcY3tWKWJIlc0QLq9pvJ_XQaj1s7ktfva")
);
$ch = curl_init();
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_URL,$str_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, null);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
$result = curl_exec($ch);
curl_close($ch);
//$result 裡會有可用的 token, 在失效時間 [expired_timestamp] 之前 token 都有效
//這裡用指定的方式來展示 json 的格式
$result = '{"token":"zHm67sQRuPSO__eiuy2h_lEgtPlS12aVqrcVz3Kc","expired_in":28800,"expired_timestamp":1474470110}';
//use the token to call api
$token = json_decode($result);
$str_url = 'https://api.pchomepay.com.tw/v1/payment';
$headers = array(
    'Content-Type:application/json',
    'pcpay-token:'.$token->token);
$requestPayload = '{
  "order_id":"J2016101000005",
  "pay_type":["ACCT"],
  "amount":100,
  "return_url":"http://www.pchomepay.com.tw",
  "items":[{"name":"商品名稱","url":"商品連結"}]
}';
$ch = curl_init();
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_URL,$str_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $requestPayload);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
$result = curl_exec($ch);
curl_close($ch);
/**
 * result when success
 * {"order_id":"J2016101000005","payment_url":"https:\/\/pay.pchomepay.com.tw\/
 * ppwf?_pwfkey_=rVKHID0O1KIltnH-MHD5vHtheBCUYLEQtYZxrGsjG9K6IXPSyp6lnx4nOQ__"}
 */
/**
 * result when fail
 * {"error_type":"invalid_request_error","code":20001,"message":"order id duplicate"}
 */
echo $result;
```

## 

## 建立訂單

當訂單成功建立後，會回應一組付款頁面連結，可將付款用戶導頁至該頁面完成付款。

**POST	https://api.pchomepay.com.tw/v1/payment**

| 請求欄位 | 必填 | 型態 | 說明 |  |
| :---- | ----- | ----- | :---- | ----- |
| order\_id | \* | String(50) | 合作方訂單編號 1\. 不得重複 2\. 限英數、連字號和底線 |  |
| pay\_type | \* | Array | 付款方式 1\. 信用卡付款: CARD 2\. 拍錢包付款: PI 3\. ATM 轉帳匯款: ATM  4\. 超商取貨付款     (1) 7-11: IPL7     (2) 全家: IPLFM     (3) 萊爾富: IPLHL 5\. 超商代碼付款: BCODE |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
| amount | \* | Int | 訂單金額 1\. 信用卡付款，金額須在 30 \~ 199,999 元之間 2\. 拍錢包付款，金額須在 1 \~ 199,999 元之間 3\. ATM 付款，金額須在 1 \~ 49,999 元之間 4\. 超商取貨付款，金額須在 65 \~ 20,000 元之間 5\. 超商代碼付款，金額須在 25 \~ 20,000 元之間 |  |
| items | \* | Array | [商品資訊](#bookmark=id.1hdqn5x5g3p)，可同時帶入多筆商品資訊限 8000 字以內，字數統計包含 name、url 欄位名稱及符號 |  |
| return\_url |  | String(200) | 付款成功導頁之 URL 1\. 用戶可透過付款頁面下方之「返回」按鈕，或自動跳轉至指定頁面 2\. 預設為使用[環境設定](https://web.pchomepay.com.tw/api-setting/environment-setting)之 Return URL |  |
| fail\_return\_url |  | String(300) | 付款失敗導頁之 URL 1\. 用戶可透過付款頁面下方之「返回」按鈕，或自動跳轉至指定頁面 2\. 預設為使用[環境設定](https://web.pchomepay.com.tw/api-setting/environment-setting)之 Return URL |  |
| notify\_url |  | String(255) | 通知接收之 URL 1\. 訂單狀態變更時，會將[通知](#6.-通知)內容傳遞至該 URL 2\. 預設為使用[環境設定](https://web.pchomepay.com.tw/api-setting/environment-setting)之 Notify URL |  |
| buyer\_email |  | String(50) | 付款人電子郵件信箱 |  |
| atm\_info |  | Object | [ATM 訂單進階設定](#bookmark=id.kc23io5vvdql) 1\. 可以設定付款期限 2\. 預設值為 5 天 |  |
| bcode\_info |  | Object | [代碼付款訂單進階設定](#bookmark=id.7qsuow1oddnq) 1\. 可以設定付款期限 2\. 預設值為 7 天 |  |
| card\_installment |  | String | 信用卡分期期數 1\. 預設為一次付清 2\. 支援 1 / 3 / 6 / 12 / 18 / 24 不同期數，[各分期支援銀行](#查詢支援信用卡分期銀行)可透過 API 查得 3\. 欲提供多期數，以逗號分隔表示 |  |
| return\_timer |  | String(1) | 訂單成功或失敗之自動跳轉設定 1\. Y: 倒數 10 秒後跳轉，此為預設值 2\. N: 立即跳轉 3\. 此設定不影響 ATM 之付款訂單 |  |
| member\_key |  | String(30) | 平台會員 ID 1\. 記憶付卡時填寫的信用卡卡號及姓名資訊 2\. 可記憶用戶超商取貨付款訂單之超商收件資訊 |  |
| platform\_code |  | String(64) | 平台代碼 |  |

**items**

| 請求欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| name | \* | String | 商品名稱，200 字以內 |
| url | \* | String | 商品連結，255 字以內 |

**atm\_info**

| 請求欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| expire\_days |  | Int | 可付款之期限 1\. 用戶須於交易日 T \+ D 天內完成付款 2\. 1 ≦ D ≦ 5 3\. 預設值為 5 |

**bcode\_info**

| 請求欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| expire\_days |  | Int | 可付款之期限 1\. 用戶須於交易日 T \+ D 天內完成付款 2\. 1 ≦ D ≦ 7 3\. 預設值為 7 |

```shell
curl --location 'https://api.pchomepay.com.tw/v1/payment' \
--header 'Content-Type: application/json' \
--header 'pcpay-token: DDjz2xrCdCvBRPSFGaoNedVrGHvED8JbAAcU17WT' \
--header 'Cookie: PHPSESSID=5kkj1qbjp98kqbrhql2hsu46a0; visid_incap_2426970=7hgRX1ZvTwKF0wMCQmURjwSjSGUAAAAAQUIPAAAAAAASlrEHdBFd/x9GY077gswe' \
--data '{
    "order_id": "B2C1703247199",
    "pay_type": ["CARD"],
    "amount": 2675,
    "return_url": "https://shop.googlemerchandisestore.com/success",
    "fail_return_url": "https://shop.googlemerchandisestore.com/failed",
    "items": [
        {
            "name": "Chrome Dino Camp Shirt",
            "url": "https://shop.googlemerchandisestore.com/Google+Redesign/Apparel/Chrome+Dino+Camp+Shirt"
        }
    ],
    "card_installment":"1,3,6,12"
}'
```

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | ----- | :---- | :---- |
| order\_id | \* | String(50) | 合作方訂單編號 |
| payment\_url | \* | String | 付款頁面之URL 回傳一組URL供合作方將使用者導頁至支付連相應付款頁面。 |

```json
{
    "order_id": "B2C1703247193",
    "payment_url": "https://pchomepay.com.tw/apipay/ppwf?_pwfkey_=TElVd0FkRzFCY2NCLVE3MlNvRHBSZkdCeixMdFBoU1doNkhJaUVGR3hXejExbG1EN0Zra1phUUdqRjdVT1A0RA=="
}
```

## 建立 ATM 虛擬帳號訂單

此為幕後取號之服務，如果想在自己的頁面顯示轉帳相關資訊，而不是讓用戶跳轉至付款頁面來操作，可以直接由此直接拿到虛擬帳戶資訊。當訂單成功建立後，會回應指定銀行的虛擬帳號供用戶轉帳付款使用。

**POST	https://api.pchomepay.com.tw/v1/payment/atmva**

| 請求欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| order\_id | \* | String(50) | 合作方訂單編號 |
| amount | \* | Int | 訂單金額 |
| expire\_days |  | Int | 可付款之期限 1\. 用戶須於交易日 T \+ D 天內完成付款 2\. 1 ≦ D ≦ 5 3\. 預設值為 5 天 |
| item\_name | \* | String(200) | 商品名稱 |
| item\_url | \* | String(200) | 商品頁面 |
| atm\_bank |  | String(3) | 指定銀行之虛擬帳號 1\. 預設為上海商銀 (011) 2\. [目前支援之銀行代碼](#查詢-atm-支援虛擬帳號之銀行) |
| notify\_url |  | String(255) | 通知接收之 URL 1\. 訂單狀態變更時，會將[通知](#6.-通知)內容傳遞至該 URL 2\. 預設為使用[環境設定](https://web.pchomepay.com.tw/api-setting/environment-setting)之 Notify URL |
| buyer\_name | \* | String | 付款人姓名 |
| buyer\_mobile | \* | String | 付款人電話 |
| buyer\_email |  | String(50) | 付款人電子郵件信箱 |
| platform\_code |  | String(64) | 平台代碼 |

```shell
curl --location 'https://api.pchomepay.com.tw/v1/payment/atmva' \
--header 'Content-Type: application/json' \
--header 'pcpay-token: Ep_hnSTTM0lvYdOet_n_9L0LsQfE5xwZrl57uyNx' \
--header 'Cookie: PHPSESSID=bc8i4svgq566apq9e13ccuid32' \
--data-raw '{
    "order_id": "B2CATM1735808899",
    "amount": 500,
    "expire_days": 3,
    "item_name": "休閒褲",
    "item_url": "https://www.google.com.tw",
    "atm_bank": "812",
    "notify_url":"https://notify.com/",
    "buyer_name":"王大明",
    "buyer_mobile":"0912345678",
    "buyer_email":"mingwang@corp.com"
}'
```

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| order\_id | \* | String(50) | 合作方訂單編號 |
| virtual\_account | \* | String(20) | ATM 虛擬帳號 |
| bank\_id | \* | String(3) | 銀行代碼 |
| expire\_date | \* | String(14) | 有效期限，格式 YYYYMMDDhh24MiSS |

```json
{
    "order_id": "B2CATM1696393715",
    "virtual_account": "8766824148422803",
    "bank_id": "812",
    "expire_date": "20231007235959"
}
```

## 建立超商代碼繳費訂單

此為幕後取號之服務，無須依賴用戶跳轉至付款頁面來操作取號。當訂單成功建立後，會回應超商繳費 3 段條碼及付款代碼，可以再透過條碼產生工具，產生 code39 格式之 3 段條碼或用 QR code 的形式呈付款代碼。

用戶可以直接至超商提供 3 段條碼來繳費或至 ibon 機台掃描繳費代碼之 QR code 或自行手動輸入繳費代碼。

**POST	https://api.pchomepay.com.tw/v1/payment/barcode**

| 請求欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| order\_id | \* | String(50) | 合作方訂單編號 |
| amount | \* | Int | 訂單金額 |
| items | \* | Array | [商品資訊](#bookmark=id.27kqih6s1opl) 1\. 可同時帶入多筆商品資訊 2\. 字元上限（含欄位名稱）須在 8,000 字元內 |
| expire\_days |  | Int | 可付款之期限 1\. 用戶須於交易日 T \+ D 天內完成付款 2\. 1 ≦ D ≦ 7 3\. 預設值為 7 天 |
| notify\_url |  | String(255) | 通知接收之 URL 1\. 訂單狀態變更時，會將[通知](#6.-通知)內容傳遞至該 URL 2\. 預設為使用[環境設定](https://web.pchomepay.com.tw/api-setting/environment-setting)之 Notify URL |
| buyer\_name | \* | String(50) | 付款人姓名 |
| buyer\_mobile | \* | String | 付款人電話，格式 09 開頭的 10 碼數字  |
| buyer\_email |  | String(50) | 付款人電子郵件信箱 |
| platform\_code |  | String(64) | 平台代碼 |

**items**

| 請求欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| name | \* | String | 商品名稱 |
| url | \* | String | 商品連結 |

```shell
curl --location 'https://api.pchomepay.com.tw/v1/payment/barcode' \
--header 'Content-Type: application/json' \
--header 'pcpay-token: hKfn0ZWBwCb3Q_nNtkyvs2quP_7R2MHkX9Oqjte5' \
--header 'Cookie: PHPSESSID=gsm73urte8dokkc28bu9s5b90k' \
--data-raw '{
    "order_id": "B2CBARCODE1732620171",
    "amount": 500,
    "items": [
        {
            "name":"Chrome Dino Camp Shirt",
            "url":"https://shop.googlemerchandisestore.com/Google+Redesign/Apparel/Chrome+Dino+Camp+Shirt"
        }
    ],
    "notify_url": "https://notify.com/",
    "buyer_name": "John Doe",
    "buyer_mobile": "0912345678",
    "buyer_email":"buyer@email.com"
}'
```

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| order\_id | \* | String(50) | 合作方訂單編號 |
| pincode | \* | String | 付款代碼，可至 ibon 機台所使用之付款代碼 |
| barcode1 | \* | String | 第 1 段條碼 |
| barcode2 | \* | String | 第 2 段條碼 |
| barcode3 | \* | String | 第 3 段條碼 |
| expire\_date | \* | String(14) | 有效期限，格式 YYYYMMDDhh24MiSS |

```json
{
    "order_id":"B2CBARCODE1732620171",
    "pincode":"251264755740",
    "barcode1":"130912968",
    "barcode2":"2512647520801218",
    "barcode3":"682359650000100",
    "expire_date":"20241130235959"
}
```

## 

## 

## 查詢 ATM 支援虛擬帳號之銀行 {#查詢-atm-支援虛擬帳號之銀行}

**GET	https://api.pchomepay.com.tw/v1/payment/atm/banks**

| 請求欄位 | 必填 | 型態 | 說明 |
| ----- | :---: | :---: | :---- |
| 無 |  |  |  |

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| banks | \* | Array | 目前支援 ATM 虛擬帳號之銀行清單 |
| bank\_id | \* | String(3) | 銀行代碼 |
| bank\_name | \* | String(20) | 銀行名稱 |

```json
{
    "banks": [
        {
            "bank_id": "812",
            "bank_name": "台新銀行"
        },
        {
            "bank_id": "011",
            "bank_name": "上海商銀"
        }
    ]
}
```

## 

## 查詢支援信用卡分期銀行 {#查詢支援信用卡分期銀行}

**GET	https://api.pchomepay.com.tw/v1/payment/card/banks**

| 請求欄位 | 必填 | 型態 | 說明 |
| ----- | :---: | :---: | :---- |
| 無 |  |  |  |

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| banks | \* | Array | 目前支援 ATM 虛擬帳號之銀行清單 |
| bank\_id | \* | String(3) | 銀行代碼 |
| bank\_name | \* | String(20) | 銀行名稱 |
| installment | \* | String(50) | 可用分期數，以逗號分隔表示多期數 |

```json
{
    "banks": [
        {
            "bank_id": "011",
            "bank_name": "上海商業儲蓄銀行",
            "installment": "3,6,12,18,24"
        },
        {
            "bank_id": "812",
            "bank_name": "台新國際商業銀行",
            "installment": "3,6,12,18,24"
        }
    ]
}
```

## 查詢訂單

**GET	https://api.pchomepay.com.tw/v1/payment/{order\_id}**

| 請求欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| order\_id | \* | String(50) | 合作方訂單編號 |

```shell
curl --location 'https://api.pchomepay.com.tw/v1/payment/B2C1695210352' \
--header 'pcpay-token: DDjz2xrCdCvBRPSFGaoNedVrGHvED8JbAAcU17WT' \
--header 'Cookie: PHPSESSID=bfap42jg1oc3a0cetl76gb8umd; Wf9N4nm3xC/IBA@@=v1D8w6g++C0xr'
```

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| order\_id | \* | String(50) | 合作方訂單編號 |
| amount | \* | String | 訂單金額 |
| pay\_type | \* | String(5) | 付款方式 |
| trade\_amount | \* | Int | 實際交易金額 |
| platform\_amount | \* | Int | 合作方實際入帳金額 \= 實際交易金額 \- 手續費 |
| pp\_fee | \* | Int | 手續費 |
| create\_date | \* | String(14) | 訂單建立時間，格式 YYYYMMDDhh24MiSS |
| pay\_date | \* | String(14) | 訂單確認時間，格式 YYYYMMDDhh24MiSS |
| actual\_pay\_date | \* | String(14) | 實際付款時間，格式 YYYYMMDDhh24MiSS |
| fail\_date | \* | String(14) | 交易失敗時間，格式 YYYYMMDDhh24MiSS 當訂單因逾期、付款失敗…等其他因素造成時才有值 |
| status | \* | String(1) | 訂單狀態 S: 交易完成 W: 交易等待中 F: 交易失敗 |
| status\_code | \* | String | 訂單狀態代碼 |
| payment\_info | \* | Object | [訂單付款資訊](#bookmark=id.nc3xbbjrj9nq)，依付款方式決定欄位內容 |
| available\_date | \* | String(14) | 訂單款項轉可提領時間 |
| items | \* | Array | 訂單商品資訊 |

```json
{
    "order_id": "B2C1695210352",
    "amount": "500",
    "pay_type": "ATM",
    "trade_amount": 500,
    "platform_amount": 490,
    "pp_fee": 10,
    "create_date": "20230920194551",
    "pay_date": "20230920194616",
    "actual_pay_date": 20230920194616,
    "fail_date": null,
    "status": "S",
    "status_code": null,
    "payment_info": {
        "virtual_account": "2606092510742523",
        "bank_code": "013",
        "expire_date": "20230925235959"
    },
    "available_date": "20230922163311",
    "items": [
        {
            "name": "休閒上衣",
            "url": "https://shop.googlemerchandisestore.com/"
        }
    ]
}
```

| status\_code | 說明 |
| :---- | :---- |
| FE | 訂單逾時 |
| FT | 連線失敗 |
| WO | 信用卡等待 OTP 驗證 |
| FF、FA | 信用卡授權失敗 |
| FF-1 | 請與發卡銀行聯絡 (Call Bank) |
| FF-2 | 拒絕交易 (Decline) |
| FF-3 | 異常卡片 (Pickup) |
| FF-4 | 卡片過期 (Expire card) |
| FF-5 | 交易日期錯誤 |
| FF-6 | 信用卡交易逾時 |
| FX | ATM 虛擬帳號失效 |
| WP | ATM 待繳款 |
| WB | 尚未選擇銀行 |
| WAP | 審單中 |
| FP | 審單拒絕 |
| WAC | 合作方自行審單中 |
| FC | 合作方審單拒絕 |
| FB | 支付連餘額不足 |
| WD | 超商取貨等待商品交寄 |

**payment\_info 物件**

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| virtual\_account | \* | String(20) | ATM 虛擬帳號 |
| bank\_code | \* | String(3) | ATM 虛擬帳號之銀行代號 |
| expire\_date | \* | String(14) | ATM 虛擬帳號或代碼付款之有效期限，格式 YYYYMMDDhh24MiSS |
| buyer\_bank\_code |  | String(3) | 用戶轉出之帳戶銀行代碼 |
| buyer\_account\_last5 |  | String(5) | 用戶轉出帳戶之帳號末 5 碼 |
| installment | \* | String | 信用卡分期期數 |
| rate | \* | Float | 信用卡金流手續費率 |
| pp\_rate | \* | Float | 此欄位目前已無使用 |
| card\_last\_number | \* | String | 信用卡卡號末 4 碼 |
| pp\_fee | \* | Int | 信用卡金流手續費 |
| logistic\_id | \* | String(11) | 超商物流代號 |
| receiver\_name | \* | String | 取件人姓名 |
| receiver\_mobile | \* | String | 取件人電話 |
| store\_id | \* | String | 取件門市代號 |
| store\_name | \* | String | 取件門市名稱 |
| pincode | \* | String | 代碼付款，可至 iBon 機台所使用之付款代碼 |
| barcode1 | \* | String | 代碼付款，第 1 段條碼 |
| barcode2 | \* | String | 代碼付款，第 2 段條碼 |
| barcode3 | \* | String | 代碼付款，第 3 段條碼 |

## 

## 建立退款

同一筆訂單可做多次退款（除信用卡分期付款外），退款金額不得超過訂單剩餘金額，且帳戶需有足夠餘額支付退款金額加上退款手續費。

**POST	https://api.pchomepay.com.tw/v1/refund**

| 請求欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| order\_id | \* | String(50) | 合作方訂單編號 |
| refund\_id | \* | String(50) | 合作方退款編號 |
| trade\_amount | \* | Int | 退款金額 |

```shell
curl --location 'https://api.pchomepay.com.tw/v1/refund' \
--header 'Content-Type: application/json' \
--header 'pcpay-token: GBAzpVgverJKVbF0j9WgCDbmw_pfLUQBPFDW6iUr' \
--header 'Cookie: PHPSESSID=bfap42jg1oc3a0cetl76gb8umd' \
--data '{
    "order_id": "B2C1695210352",
    "refund_id": "B2C1695210352-Refund",
    "trade_amount": 100
}
'
```

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| order\_id | \* | String(50) | 合作方訂單編號 |
| refund\_id | \* | String(50) | 合作方退款編號 |
| pay\_type | \* | String(10) | 退款方式，依原訂單付款方式處理 |
| trade\_amount | \* | Int | 退款金額 |
| fee | \* | Int | 退還手續費，依退款金額與原訂單金額之佔比，退還等比例之手續費 |
| transfer\_fee | \* | Int | 退款手續費 |
| cover\_transfee |  | String(1) | 是否收取退款手續費 (Y/N)  |

```json
{
    "order_id": "B2C1695210352",
    "refund_id": "B2C1695210352-Refund",
    "pay_type": "ATM",
    "trade_amount": 100,
    "fee": 2,
    "transfer_fee": 15,
    "cover_transfee": "Y"
}
```

### 

**退款說明**

1. 退款方式  
   1. 信用卡交易退刷至原信用卡  
   2. ATM 交易退款至原匯款帳戶  
   3. 超商取貨付款及代碼繳費可退款至指定的銀行帳戶  
   4. 拍錢包交易則依[拍錢包交易退款規則](https://web.piapp.com.tw/faq/bs18122107/)  
2. 退款限制  
   1. 信用卡分期付款 / 超商取貨付款 / 代碼繳費，僅接受一次性全額退款；其他付款方式，可支援部分退款或全額退款  
   2. 帳戶須有足夠之餘額（退款金額 \+ 退款手續費）才可退款成功  
   3. 欲退款金額，不可超過原訂單之金額或原訂單剩餘可退款之金額  
   4. 超商取貨付款，需待款項清算完成才能進行退款  
3. 退款手續費，以下退款每筆收 15 元退款手續費  
   1. ATM 虛擬帳號  
   2. 超商取貨付款  
   3. 代碼繳費  
4. 信用卡退款說明  
   1. 全額退款  
      訂單條件：訂單金額 100 元，手續費 2%，實際入帳 \= 100 \- (100 x 2%) \= 98 元  
      退款請求：欲退款金額 trade\_amount \= 100 元  
      退款回應：實際退款金額 trade\_amount \= 100 元  
      用戶實收：100 元  
      合作方退還：98 元  
   2. 部分退款  
      訂單條件：訂單金額 1,500 元，手續費 2%，實際入帳 \= 1,500 \- (1,500 x 2%) \= 1,470 元  
      第一次退款金額 500 元，返還 30 x (500 / 1,500) \= 10 元之手續費  
      第二次退款金額 1,000 元，返還剩餘手續費 20 元

## 

## 查詢退款

**GET	https://api.pchomepay.com.tw/v1/refund/{refund\_id}**

| 請求欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| refund\_id | \* | String(50) | 合作方退款編號 |

```shell
curl --location 'https://api.pchomepay.com.tw/v1/refund/B2C1695210352-Refund' \
--header 'pcpay-token: DDjz2xrCdCvBRPSFGaoNedVrGHvED8JbAAcU17WT' \
--header 'Cookie: PHPSESSID=bbgd5liqoher81sceskg045np4; visid_incap_2426970=7hgRX1ZvTwKF0wMCQmURjwSjSGUAAAAAQUIPAAAAAAASlrEHdBFd/x9GY077gswe'
```

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| refund\_id | \* | String(50) | 合作方退款編號 |
| status | \* | String(5) | 退款狀態 INIT: 已建立 WAIT: 處理中 SUCC: 退款成功 FAIL: 退款失敗 |
| amount | \* | String | 退款金額 |
| fee | \* | String | 退還手續費，依退款金額與原訂單金額之佔比，退還等比例之手續費 |
| transfer\_fee | \* | String | 退款手續費 |
| refund\_date | \* | String(14) | 退款建立時間，格式 YYYYMMDDhh24MiSS |
| cover\_transfee | \* | String(1) | 是否收取退款手續費 (Y/N)  |
| actual\_refund\_date | \* | String(8) | 實際退款時間，格式 YYYYMMDD |

```json
{
    "refund_id": "B2C1695210352-Refund",
    "status": "SUCC",
    "amount": "100",
    "fee": "2",
    "transfer_fee": "15",
    "refund_date": "20231004134645",
    "cover_transfee": "Y",
    "actual_refund_date": "20231004"
}
```

## 

## 

## 查詢帳戶餘額

**GET	https://api.pchomepay.com.tw/v1/balance**

| 請求欄位 | 必填 | 型態 | 說明 |
| ----- | :---: | :---: | :---- |
| 無 |  |  |  |

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| all | \* | Int | 帳戶總餘額 |
| available | \* | Int | 可提領餘額 |
| processing | \* | Int | 處理中餘額，提領中或清算中之款項 |

```json
{
    "all": 1030519,
    "available": 1010347,
    "processing": 20172
}
```

## 提領款項

提領可用餘額至綁定認證銀行帳戶，若有多筆提領銀行帳戶則會選用第 1 組提領銀行帳戶。

**POST	https://api.pchomepay.com.tw/v1/withdraw**

| 請求欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| amount | \* | Int | 提領金額 |

```shell
curl --location 'https://api.pchomepay.com.tw/v1/withdraw' \
--header 'Content-Type: application/json' \
--header 'pcpay-token: DDjz2xrCdCvBRPSFGaoNedVrGHvED8JbAAcU17WT' \
--header 'Cookie: PHPSESSID=bbgd5liqoher81sceskg045np4; visid_incap_2426970=7hgRX1ZvTwKF0wMCQmURjwSjSGUAAAAAQUIPAAAAAAASlrEHdBFd/x9GY077gswe' \
--data '{
    "amount": 500
}'
```

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| withdraw\_amount | \* | Int | 提領金額 |
| transfer\_fee | \* | Int | 跨行提領手續費 |
| bank\_id | \* | String(3) | 帳戶銀行代碼 |
| bank\_account | \* | String | 帳戶銀行號碼 |

```json
{
    "withdraw_amount": 500,
    "transfer_fee": 10,
    "bank_id": 822,
    "bank_account": 170923402112
}
```

## 查詢對帳資料

可以查詢指定日期之訂單、退款明細帳務資料。

**GET	https://api.pchomepay.com.tw/v1/checking/{date}/{type}**

| 請求欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| date | \* | String(8) | 欲查詢對帳之日期 1\. 格式 YYYYMMDD 2\. 此日期為該筆訂單之交易確認日期或退款訂單之退款確認日期 3\. 此日期僅能查詢 120 天前（不含當日）的對帳資料。 |
| type | \* | String(10) | 欲查詢對帳資料之類型 1\. orders: 訂單 2\. refunds: 退款 |

```shell
curl --location 'https://api.pchomepay.com.tw/v1/checking/20231012/orders' \
--header 'pcpay-token: DDjz2xrCdCvBRPSFGaoNedVrGHvED8JbAAcU17WT' \
--header 'Cookie: PHPSESSID=bbgd5liqoher81sceskg045np4; Wf9N4nm3xC/IBA@@=v1D8w6g++C0xr; visid_incap_2426970=7hgRX1ZvTwKF0wMCQmURjwSjSGUAAAAAQUIPAAAAAAASlrEHdBFd/x9GY077gswe'
```

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| total\_recs | \* | String(5) | 查詢日期之帳務資料筆數 |
|  |  | JSON | 訂單或退款之帳務資料，其內容與查詢訂單或查詢退款之資料相同 |

```json
{
    "total_recs": "2"
}
{
    "order_id": "B2C1696581256",
    "amount": "500",
    "pay_type": "ATM",
    "trade_amount": 500,
    "platform_amount": 500,
    "pp_fee": 0,
    "create_date": "20231006163417",
    "pay_date": null,
    "actual_pay_date": null,
    "fail_date": "20231012120023",
    "status": "F",
    "status_code": "FX",
    "payment_info": {
        "virtual_account": "8766826137822847",
        "bank_code": "812",
        "expire_date": "20231011235959"
    },
    "available_date": null,
    "items": [
        {
            "name": "運動衫",
            "url": "https://shop.googlemerchandisestore.com/"
        }
    ]
}
{
    "order_id": "B2C1699956990",
    "amount": "100",
    "pay_type": "PI",
    "trade_amount": 100,
    "platform_amount": 97,
    "pp_fee": 3,
    "create_date": "20231012181630",
    "pay_date": "20231012181739",
    "actual_pay_date": "20231012181739",
    "fail_date": null,
    "status": "S",
    "status_code": null,
    "payment_info": null,
    "available_date": "20231015165319",
    "items": [
        {
            "name": "魚油-Omega-3 (60粒)",
            "url": "https://shop.googlemerchandisestore.com"
        }
    ]
}
```

## 取號列印交寄單

超商取貨的訂單須在 30 天內完成取號交寄單列印，當完成取號列印交單後（當日為 T），有 T \+ X 天時間可以到指定門市去寄送商品。以下是各超商交寄截止日之規則（以同樣在 6/10 取號印單後為範例）

* 統一超商須在 T+ 10 日完成交寄（須在 6/20 23:59 前完成交寄）  
* 全家須在 T+ 6 日完成交寄（須在 6/16 23:59 前完成交寄）  
* 萊爾富須在 T \+ 7 日完成交寄（須在 6/17 23:59 前完成交寄）

**POST	https://api.pchomepay.com.tw/v1/logistic/batch**

| 請求欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| order\_id | \* | Array | 欲列印交寄單之訂單編號 |

```shell
curl --location 'https://api.pchomepay.com.tw/v1/logistic/batch' \
--header 'Content-Type: application/json' \
--header 'pcpay-token: __kJw1OMKTkwwssWPsAnGNtIzMYFIZ5ymmkq8nCd' \
--header 'Cookie: PHPSESSID=iikbeqbjjm8q4njdrqi9hh7tbs; Wf9N4nm3xC/IBA@@=v1D8w6g++C0xr; visid_incap_2426970=7hgRX1ZvTwKF0wMCQmURjwSjSGUAAAAAQUIPAAAAAAASlrEHdBFd/x9GY077gswe' \
--data '{
    "order_id": ["B2C1702640091"]
}'
```

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| print\_no | \* | String | 要號成功之交貨便服務代碼 |
| error\_order\_id | \* | String | 要號失敗之訂單編號 |
| print\_url | \* | String | 交寄單頁面連結 |

```json
{
    "print_no": "N63399396760",
    "error_order_id": null,
    "print_url": "https://pay.pchomepay.com.tw/apipay/ppwf?_pwfkey_=TnR3Z3AzY20xbk1wZFE0cGEsdU00aFNGcGNwNjVzcVkzVEwxZ1JPeGR3YUc5QWkwMk5yakEwSFlvdk5ZWHFoaQ=="
}
```

## 

## 查詢物流歷程

查詢指定訂單之物流狀態歷程資訊。

**GET	https://api.pchomepay.com.tw/v1/logistic/query/{order\_id}/history**

| 請求欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| order\_id | \* | String(50) | 合作方訂單編號 |

```shell
curl --location 'https://api.pchomepay.com.tw/v1/logistic/query/B2C1723815435/history' \
--header 'Content-Type: application/json' \
--header 'pcpay-token: 0BZyFozlvqFtlwJoL5HQstTbNW_gNrNmsPQ4upc7' \
--header 'Cookie: PHPSESSID=b7p8ialf257orej366cetp64jf; visid_incap_2426970=7hgRX1ZvTwKF0wMCQmURjwSjSGUAAAAAQUIPAAAAAAASlrEHdBFd/x9GY077gswe' \
--data ''
```

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| order\_id | \* | String(50) | 合作方訂單編號 |
| history | \* | Array | [歷程紀錄](#bookmark=id.a6cuzelw0ggw) |

**history**

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| logistic\_id | \* | String(50) | 超商物流代號 |
| status | \* | String(50) | 訂單與物流狀態 1\. 訂單建立 2\. 已交寄 3\. 配送中 4\. 已到店 5\. 已付款 6\. 已撥付（表示款項已轉可提領） |
| status\_date | \* | Date | 該狀態日期，格式 YYYY/MM/DD |
| status\_time | \* | Date | 該狀態時間，格式 HH:MM:SS |

```json
{
    "order_id": "B2C1723815435",
    "history": [
        {
            "logistic_id": "L24081201043969",
            "status": "訂單建立",
            "status_date": "2024/08/16",
            "status_time": "21:37:15"
        },
        {
            "logistic_id": "L24081201043969",
            "status": "已交寄",
            "status_date": "2024/08/16",
            "status_time": "21:39:02"
        }
    ]
}
```

## 物流歷程查詢頁

透過頁面，查詢指定訂單之物流狀態歷程。

**GET	https://api.pchomepay.com.tw/v1/logistic/query/{order\_id}/history-page**

| 請求欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| order\_id | \* | String(50) | 合作方訂單編號 |

```shell
curl --location 'https://api.pchomepay.com.tw/v1/logistic/query/{order_id}/history-page' \
--header 'Content-Type: application/json' \
--header 'pcpay-token: e0A_XRsPMDgCKvRnrikpdMTfEJzvIGuveJsn_695' \
--header 'Cookie: PHPSESSID=mtfdlc6h0d37vpunlk27mas1dj; visid_incap_2426970=7hgRX1ZvTwKF0wMCQmURjwSjSGUAAAAAQUIPAAAAAAASlrEHdBFd/x9GY077gswe' \
--data ''
```

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| order\_id | \* | String(50) | 合作方訂單編號 |
| history\_url | \* | String | 物流歷程查詢頁 |

```json
{
    "logistic_id": "L24041201043748",
    "history_url": "https://pchomepay.com.tw/apipay/ppwf?_pwfkey_=UjdkdVlreEV5cjlKRlRZeHdlUSxRUVVkVk0ta09uZGlINCxoRSxicEs2ZVB0UnhkcDBkY0RkZE84R0dSU3hFcA=="
}
```

## 查詢未出貨訂單

查詢未出貨之超商取貨訂單

**GET	https://api.pchomepay.com.tw/v1/logistic/yet**

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| order\_id | \* | String(50) | 合作方訂單編號 |
| status | \* | String | 商品目前物流狀態 1\. LINT：訂單建立 2\. LGNO：已取號 |

```json
[
    {
        "order_id": "B2C1744189821",
        "status": "LGNO"
    },
    {
        "order_id": "B2C1744189822",
        "status": "LINT"
    }
]
```

## 

## 

## 查詢未取貨訂單

查詢買家未至超商取貨之物流編號

**GET	https://api.pchomepay.com.tw/v1/logistic/store\_return/{date}**

| 請求欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| date | \* | String(8) | 欲查詢對帳之日期，格式 YYYYMMDD |

```shell
curl --location 'https://api.pchomepay.com.tw/v1/logistic/store_return/20250409' \
--header 'pcpay-token: F6uG0pXXTPTHDMRkIj_HGnzrWJvom_m_HhPxf296' \
--header 'Cookie: PHPSESSID=5kkj1qbjp98kqbrhql2hsu46a0; visid_incap_2426970=7hgRX1ZvTwKF0wMCQmURjwSjSGUAAAAAQUIPAAAAAAASlrEHdBFd/x9GY077gswe' \
--data ''
```

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| order\_id | \* | String(50) | 合作方訂單編號 |
| logistic\_id | \* | String(50) | 訂單物流編號 |
| status | \* | String | 商品目前物流狀態，僅會有 SATB 狀態的資料 SATB：商品已到取件門市  |

```json
[
    {
        "order_id": "B2C1744192674",
        "logistic_id": "L25041201044206",
        "status": "SATB"
    }
]
```

## 

## 查詢物流手續費對帳資料

查詢指定日期之物流手續費帳務資料。

**GET	https://api.pchomepay.com.tw/v1/logistic/accounting/{date}**

| 請求欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| date | \* | String(8) | 欲查詢對帳之日期 1\. 格式 YYYYMMDD 2\. 此日期僅能查詢 30 天前的對帳資料。 |

```shell
curl --location 'https://api.pchomepay.com.tw/v1/logistic/accounting/20240816' \
--header 'pcpay-token: fGVWZrMrYEVLHbj1joxn7CpdjsygFYYN8vLaygGM' \
--header 'Cookie: PHPSESSID=b7p8ialf257orej366cetp64jf; visid_incap_2426970=7hgRX1ZvTwKF0wMCQmURjwSjSGUAAAAAQUIPAAAAAAASlrEHdBFd/x9GY077gswe'
```

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| total\_recs | \* | String(5) | 查詢日期之帳務資料筆數 |
|  |  | JSON | 訂單之物流手續費對帳明細 |

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| order\_id | \* | String(50) | 合作方訂單編號 |
| logistic\_type | \* | String | 物流類型 1\. 7-11: PL711 2\. 全家: PLFMI 3\. 萊爾富: PLHIL 4\. OK: PLOK |
| logistic\_amount | \* | Int | 物流手續費 |
| accounting\_date | \* | String(14) | 帳務日期，格式 YYYYMMDDhh24MiSS |

```json
{
    "total_recs": 1
}
{
    "order_id": "B2C1723809155",
    "logistic_type": "PL711",
    "logistic_amount": 65,
    "accounting_date": "20240816195407"
}
{
    "order_id": "B2C1723808237",
    "logistic_type": "PLFMI",
    "logistic_amount": 65,
    "accounting_date": "20240818201412"
}
```

## 

## 

## 查詢貨物寄丟之賠款入帳資料

**GET	https://api.pchomepay.com.tw/v1/logistic/compensation/{date}**

| 請求欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| date | \* | String(8) | 欲查詢入帳之年月，格式 YYYYMM |

```shell
curl --location 'https://api.pchomepay.com.tw/v1/logistic/compensation/202408' \
--header 'pcpay-token: fGVWZrMrYEVLHbj1joxn7CpdjsygFYYN8vLaygGM' \
--header 'Cookie: PHPSESSID=b7p8ialf257orej366cetp64jf; visid_incap_2426970=7hgRX1ZvTwKF0wMCQmURjwSjSGUAAAAAQUIPAAAAAAASlrEHdBFd/x9GY077gswe'
```

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| total\_recs | \* | String(5) | 查詢日期之帳務資料筆數 |
|  |  | JSON | 訂單之物流手續費對帳明細 |

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| order\_id | \* | String(50) | 合作方訂單編號 |
| logistic\_type | \* | String | 物流類型 1\. 7-11: PL711 2\. 全家: PLFMI 3\. 萊爾富: PLHIL 4\. OK: PLOK |
| logistic\_amount | \* | Int | 物流手續費 |
| accounting\_date | \* | String(14) | 帳務日期，格式 YYYYMMDDhh24MiSS |

```json
{
    "total_recs": 1
}
{
    "order_id": "B2C1723809155",
    "logistic_type": "PL711",
    "logistic_amount": 200,
    "accounting_date": "20240816195407"
}
{
    "order_id": "B2C1723808237",
    "logistic_type": "PLFMI",
    "logistic_amount": 565,
    "accounting_date": "20240818201412"
}
```

## 

## 

## 查詢退件清單（已下線）

**GET	https://api.pchomepay.com.tw/v1/logistic/return\_list/{date}/{type}**

| 請求欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| date | \* | String(8) | 欲查詢退件之日期，格式 YYYYMMDD |
| type | \* | String | 欲查詢類型 all: 全部 store: 店退 warehouse: 廠退 |

```shell
curl --location 'https://api.pchomepay.com.tw/v1/logistic/return_list/20250408/all' \
--header 'pcpay-token: 4SgAgY23ubbsmctDWcLYu4adCuEkXhBlrRQ1UDsV' \
--header 'Cookie: PHPSESSID=b7p8ialf257orej366cetp64jf; visid_incap_2426970=7hgRX1ZvTwKF0wMCQmURjwSjSGUAAAAAQUIPAAAAAAASlrEHdBFd/x9GY077gswe'
```

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| store\_return |  | Array | 門店退件訂單，包含以下狀態的訂單 1\. 當商品從取件門市退件至物流中心 RRPB 2\. 當商品從退件門市退件至物流中心 RRPC |
| warehouse\_return |  | Array | 物流退件訂單 商品從物流中心送至退件門市之訂單 RWTC |

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| logistic\_id | \* | String(50) | 合作方訂單物流編號 |
| pla\_order\_id | \* | String(50) | 廠商訂單編號 |
| return\_date | \* | Date | 退件日期，格式 YYYY/MM/DD HH:MM:SS |

```json
{
    "store_return": [
        {
            "logistic_id": "15000411764",
            "pla_order_id": "B2C1736149122",
            "return_date": "2025/04/08 00:00:00"
        },
        {
            "logistic_id": "14000411216",
            "pla_order_id": "B2C1735565905",
            "return_date": "2025/04/08 00:00:00"
        }
    ],
    "warehouse_return": [
        {
            "logistic_id": "14000410365",
            "pla_order_id": "B2C1743504520",
            "return_date": "2025/04/08 17:05:53"
        }
    ]
}
```

## 查詢會員記憶信用卡

合作方可查詢平台會員已記憶之信用卡列表。

**GET	https://api.pchomepay.com.tw/v1/payment/card/cardinfo/{member\_key}**

| 請求欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| member\_key | \* | String(30) | 平台會員 ID |

```shell
curl --location 'https://api.pchomepay.com.tw/v1/payment/card/cardinfo/johndoe' \
--header 'Content-Type: application/json' \
--header 'pcpay-token: DDjz2xrCdCvBRPSFGaoNedVrGHvED8JbAAcU17WT' \
--header 'Cookie: PHPSESSID=bbgd5liqoher81sceskg045np4; visid_incap_2426970=7hgRX1ZvTwKF0wMCQmURjwSjSGUAAAAAQUIPAAAAAAASlrEHdBFd/x9GY077gswe' \
--data ''
```

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| status | \* | String | 查詢結果 |
| message | \* | String | 查詢結果對應訊息 |
| cardList | \* | Array | 已記錄之信用卡列表 |

| cardList | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| no | \* | String(100) | 加密過之信用卡卡號 |
| alias | \* | String(50) | 銀行名稱 |
| last4 | \* | String(4) | 信用卡末 4 碼 |

```json
{
    "status": "success",
    "message": "Successfully retrieved the stored card number.",
    "cardList": [
        {
            "no": "TnBBeWViQUlET3FTTkt5MWhNWnhudndFMTZRWi1MTjlsQ2c0ZWZnZXRhSG9Hci05MUhOMmxvYUJNd1NucTF0dA==",
            "alias": "上海銀行",
            "last4": "3014"
        }
    ]
}
```

## 刪除會員記憶信用卡

合作方可刪除平台會員已記憶之信用卡列表。

**POST	https://api.pchomepay.com.tw/v1/payment/card/cardinfo/delete**

| 請求欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| member\_key | \* | String(30) | 平台會員 ID |
| card\_no | \* | String(100) | 欲刪除之會員[加密過信用卡卡號](#bookmark=id.ejpmx7sxcbjq) |

```shell
curl --location 'https://api.pchomepay.com.tw/v1/payment/card/cardinfo/delete' \
--header 'Content-Type: application/json' \
--header 'pcpay-token: DDjz2xrCdCvBRPSFGaoNedVrGHvED8JbAAcU17WT' \
--header 'Cookie: PHPSESSID=bbgd5liqoher81sceskg045np4; visid_incap_2426970=7hgRX1ZvTwKF0wMCQmURjwSjSGUAAAAAQUIPAAAAAAASlrEHdBFd/x9GY077gswe' \
--data '{
    "member_key":"johndoe",
    "card_no":"TnBBeWViQUlET3BYdEpkZ1QzV09uYVZhUzAzQnBuZlBaeHpsR2hGWFpnNkREbnN4Z3NrbFUzaDdwYlU5LTlkNQ=="
}'
```

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| status | \* | String | 刪除結果 |
| message | \* | String | 刪除結果對應訊息 |

```json
{
    "status": "success",
    "message": "Successfully removed the stored card number."
}
```

## 

## 訂單審單（已下線）

當訂單在滿足設定之金額條件時，訂單狀態會進入「交易等待中」的狀態，合作方可以透過此 API 決定是否接受買家的訂單。

**POST	https://api.pchomepay.com.tw/v1/payment/audit**

| 請求欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| order\_id | \* | String(50) | 合作方訂單編號 |
| status | \* | String(4) | 審單結果，PASS: 通過 / DENY: 拒絕 |

```shell
curl --location 'https://api.pchomepay.com.tw/v1/payment/audit' \
--header 'Content-Type: application/json' \
--header 'pcpay-token: GBAzpVgverJKVbF0j9WgCDbmw_pfLUQBPFDW6iUr' \
--header 'Cookie: PHPSESSID=bfap42jg1oc3a0cetl76gb8umd' \
--data '{
    "order_id": "B2C1700224689",
    "status": "PASS"
}
'
```

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| order\_id | \* | String(50) | 合作方訂單編號 |
| status | \* | String(4) | 審單結果，SUCC: 審核成功 |

```shell
{
    "order_id": "B2C1700224689",
    "status": "SUCC"
}
```

## 

# **6\. 通知** {#6.-通知}

用戶付款完成付款後，將以 POST 方式通知合作方所設置之 Notify URL 訂單狀態（建立、失敗、等待），各種不同之付款方式將會有相對應之通知物件，若欄位為空值，則會回傳 null。

合作方在收到通知後須於 3 秒內回傳 “success”，若合作方無回應或回應非 “success” 時，則會在 5 分鐘內發送第 2 則通知，後續每隔 5 分鐘會嘗試重新再發次送，最多發送 5 次通知。

**合作方回傳結果範例**

```shell
success
```

注意事項：「代碼付款」之通知 pay\_type 會以 BCODE 的參數傳遞

| 通知欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| notify\_type | \* | String | 通知種類 1\. [order\_audit](#bookmark=id.fa63i0e4kllr)  2\. [order\_confirm](#bookmark=id.56x6jpcgovsn) 3\. [order\_expired](#bookmark=id.iaw8pdkqq7eq) 4\. [order\_failed](#bookmark=id.8yrd7x8drrn9) 5\. [refund\_success](#bookmark=id.rlde68fj5p10) |
| notify\_message | \* | String | 通知訊息，合作方可依通知訊息做後續處理 |

## order\_audit

此通知可用來取得，用戶在 ATM 付款訂單所選擇銀行之虛擬帳號，或取得代碼付款之付款條碼資訊。超商取貨的訂單，也會透過此通知來同步用戶已選好取件門市之訂單資訊。

通知範例

```shell
curl --location 'https://notify.com/' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'notify_type=order_audit' \
--data-urlencode 'notify_message={
      "order_id":"20170518225853-2",
      "amount":"3492",
      "pay_type":"ATM",
      "trade_amount":3492,
      "platform_amount":3492,
      "pp_fee":0,
      "create_date":"20240223151738",
      "pay_date":null,
      "actual_pay_date":null,
      "fail_date":null,
      "status":"W",
      "status_code":"WP",
      "payment_info":{
         "virtual_account":"0702405595386988",
         "bank_code":"011",
         "expire_date":"20240224235959"
      },
      "available_date":null,
      "items":[
         {
            "name":"Google Canyonlands Sweatshirt",
            "url":"https://shop.googlemerchandisestore.com/Google+Redesign/Google+Canyonlands+Sweatshirt"
         }
      ]
   }'
```

## order\_confirm

當該筆訂單用戶已成功付款時，會發送此筆通知表示已完成代收入帳至代收帳戶中。

通知範例

```shell
curl --location 'https://notify.com/' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'notify_type=order_confirm' \
--data-urlencode 'notify_message={
      "order_id":"20170518225853-1",
      "amount":"1000",
      "pay_type":"CARD",
      "trade_amount":1000,
      "platform_amount":980,
      "pp_fee":20,
      "create_date":"20170518230249",
      "pay_date":"20170803162239",
      "fail_date":null,
      "status":"S",
      "status_code":null,
      "payment_info":{
         "installment":"1",
         "rate":0.02,
         "pp_rate":null,
         "card_last_number":"0527",
         "pp_fee":20
      },
      "available_date":"20170809000000",
      "items":[
         {
            "name":"Super G Yellowstone Eco Beanie",
            "url":"https://shop.googlemerchandisestore.com/Google+Redesign/Super+G+Yellowstone+Eco+Beanie"
         }
      ]
   }
'
```

## order\_expired

當該筆訂單未在時效內完成付款時，會發送此筆通知表示該訂單已逾未付。

通知範例

```shell
curl --location 'https://notify.com/' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'notify_type=order_expired' \
--data-urlencode 'notify_message={
   "order_id":"20240729164002-3",
   "amount":"3000",
   "pay_type":"CARD",
   "trade_amount":3000,
   "platform_amount":3000,
   "pp_fee":0,
   "create_date":"20240729164002",
   "pay_date":null,
   "actual_pay_date":null,
   "fail_date":"20240729170002",
   "status":"F",
   "status_code":"FE",
   "payment_info":null,
   "available_date":null,
   "items":[
      {
         "name":"Google Cloud Straw Tumbler",
         "url":"https://your.merch.google/google-cloud-straw-tumbler.html"
      }
   ]
}'
```

## order\_failed

當該筆訂單付款失敗時，會發送此筆通知。

通知範例

```shell
curl --location 'https://notify.com/' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'notify_type=order_failed' \
--data-urlencode 'notify_message={
   "order_id":"24072900454608-4",
   "amount":"4980",
   "pay_type":"CARD",
   "trade_amount":4980,
   "platform_amount":4880,
   "pp_fee":100,
   "create_date":"20240729170639",
   "pay_date":null,
   "actual_pay_date":null,
   "fail_date":"20240729170841",
   "status":"F",
   "status_code":"FF",
   "payment_info":{
      "installment":"1",
      "rate":0.02,
      "pp_rate":null,
      "card_last_number":"7427",
      "pp_fee":100
   },
   "available_date":null,
   "items":[
      {
         "name":"Barrel Bag - Black",
         "url":"https://your.merch.google/barrel-bag-black.html"
      }
   ]
}'
```

## refund\_success

當該筆退款成功時，會發送此筆通知表示該筆退款金額已從代收帳戶中扣除款項及手續費。

通知範例

```shell
curl --location 'https://notify.com/' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'notify_type=refund_success' \
--data-urlencode 'notify_message={
      "refund_id":"R230830000100_312100",
      "status":"S",
      "amount":"200",
      "fee":4,
      "transfer_fee":0,
      "refund_date":"20230830232759",
      "cover_transfee":Y,
      "actual_refund_date":"20230830232759"
   }
}
'
```

## 物流狀態

當商品透過物流配送至各個站點時，系統將會發送相對應的通知。

| 回應欄位 | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| order\_id | \* | String(50) | 合作方訂單編號 |
| pay\_type | \* | String(5) | 付款方式 |
| logistic\_info | \* | Object | 物流資訊 |

| logistic\_info | 必填 | 型態 | 說明 |
| :---- | :---: | :---: | :---- |
| logistic\_id | \* | String(11) | 超商物流代號 |
| logistic\_status | \* | String | 物流狀態 1\. SSND: 商品已至「寄件門店」 2\. SATB: 商品已至「取件門店」 3\. SATC: 商品已至「退件門店」 |
| logistic\_type | \* | String | 物流類型 1\. C2C: 店到店 2\. B2C: 大宗寄倉（目前尚未提供服務） |
| status\_date | \* | String(14) | 該狀態日期，格式 YYYYMMDDhh24MiSS |

### **seller\_dispatched**

當訂單之商品已至「寄件門店」時，會發送此通知表示當前的商品配送狀態。

通知範例

```shell
curl --location 'https://notify.com/' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'notify_type=refund_success' \
--data-urlencode 'notify_message={
      "order_id":"B2C_Uni_1769850289",
      "pay_type":"IPL7",
      "logistic_info":{
        "logistic_id":"M22216559430",
        "logistic_status":"SSND",
        "logistic_type":"C2C",
        "status_date":"20240924183250"
    }
}
'
```

### **pickup\_shipped**

當訂單之商品已至「取件門店」時，會發送此通知表示當前的商品配送狀態。

通知範例

```shell
curl --location 'https://notify.com/' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'notify_type=refund_success' \
--data-urlencode 'notify_message={
      "order_id":"B2C_Uni_1769850289",
      "pay_type":"IPL7",
      "logistic_info":{
        "logistic_id":"M22216559430",
        "logistic_status":"SATB",
        "logistic_type":"C2C",
        "status_date":"20240925212043"
    }
}
'
```

### **return\_shipped**

當訂單之商品已至「退件門店」時，會發送此通知表示當前的商品配送狀態。

通知範例

```shell
curl --location 'https://notify.com/' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'notify_type=refund_success' \
--data-urlencode 'notify_message={
      "order_id":"B2C_Uni_1769850289",
      "pay_type":"IPL7",
      "logistic_info":{
        "logistic_id":"M22216559430",
        "logistic_status":"RATC",
        "logistic_type":"C2C",
        "status_date":"20240927090822"
    }
}
'
```

# **7\. 錯誤代碼**

| 代碼 | 英文描述 | 中文描述 |
| :---: | :---- | :---- |
| 10001 | invalid user password | APPID 和 Secret 錯誤 |
| 10002 | Server IP not allow | 不被允許的 IP 位址 |
| 10003 | invalid token | token 錯誤 |
| 10004 | token expired | token 逾期 |
| 10006 | api client has not set notifyURL or returnURL yet | 未設定 notifyURL 或 returnURL |
| 10007 | you are temporarily unable to perform this function, please contact customer service | 會員帳號無法使用功能服務 |
| 20001 | order id duplicate | 訂單編號不可重複 |
| 20002 | order not exists | 訂單不存在 |
| 20003 | pay type not support | 付款類別錯誤 |
| 20005 | params is not valid | 參數錯誤 |
| 20006 | When the credit card installments, the amount of orders can not be less than 30 | 信用卡分期的商品金額須為 30 元以上 |
| 20007 | It not allow to check today's data | 目前無法查詢當日資料 |
| 20008 | order items string too long | 商品名稱超過字數限制 |
| 20009 | Request data is not a json structure data | 請求格式不是 JSON 格式 |
| 20011 | bank code or bank account not exists. | 銀行代號或銀行帳戶不存在 |
| 20013 | ATM bank code invalid | ATM 銀行代碼錯誤 |
| 20014 | cvs setting error. | 未設定超商退貨門市 |
| 20019 | create pi payment fail. | 建立拍錢包訂單失敗 |
| 20020 | pi payment is disable | 拍錢包收款尚未啟用 |
| 20022 | order amount is exceeds the pi setting | 拍錢包訂單金額超過上限 |
| 20023 | function lock. | 會員帳號暫時無法使用此收款功能 |
| 20025 | remove card info fail. | 移除記憶信用卡失敗 |
| 20030 | platform code not accept | 平台代碼錯誤 |
| 20031 | Currently unable to create installment payment orders. | 暫時無法建立信用卡分期付款訂單 |
| 40001 | invalid atm expire date | ATM 逾期錯誤 |
| 40003 | function lock. | 會員帳號暫時無法此功使用 |
| 40005 | member balance not enough. | 餘額不足 |
| 50001 | Refund id is duplicate. | 退款編號不可重複 |
| 50002 | The order is not confirm yet, refund can't be execute | 該筆訂單並未成功付款，無法退款 |
| 50003 | The order is not found, order id might invalid | 訂單編號不存在 |
| 50004 | Refund amount must bigger than 0 | 退款金額需大於 0 |
| 50005 | Your balance is not enough to refund | 帳戶餘額不足以退款 |
| 50006 | Can not find the information of the refund id | 查無此退款編號之資料 |
| 50007 | Order payed by credit card with installment can only refund with full order amount only. | 信用卡分期之退款只能全額退，不支援部分退款 |
| 50009 | The atm refund data is not ready. Please send the refund request later | ATM 退款資訊未備齊，請隔日再試 |
| 50010 | The order is failed, refund can't be execute | 訂單已失敗，不可退款 |
| 50011 | Refund amount must equal to order amount | 退款金額必須與訂單金額相同 |
| 50012 | The order is already refund | 訂單已退款 |
| 50013 | The order is not allow to refund | 訂單目前不能退款 |
| 50014 | The pay type is not allow to refund | 訂單不支援此退款方式 |
| 50015 | Call Pi refund API error. | 建立拍錢包退款失敗 |
| 50016 | Bank code not support atm refund. | 原付款行不支援退回原帳戶 |
| 70001 | withdraw must be bigger than 10 dollars | 本行提領金額需 \> 1元 他行提領金額需 ≧ 11元 |
| 70003 | withdraw amount is over than available balance | 提領金額超過可提領餘額 |
| 70004 | withdraw amount is over than withdraw daily limit | 提領金額超過本日提領額度上限 |
| 70005 | information of bank to withdraw is not set yet | 提領銀行尚未設定 |
| 70006 | function lock. | 會員帳號暫時無法使用提領功能 |
| 90001 | invalid status | 物流狀態錯誤 |
| 90002 | logistic status history not found | 物流狀態歷程不存在 |
| 90004 | Print delivery note fail. | 列印交寄單失敗 |

## 

# 

# **8\. 購物車模組**

合作店家透過安裝支付連金流外掛模組，便可以輕鬆串接支付連的 API 金流系統

舊版購物車模組連結：[https://github.com/PChomePay](https://github.com/PChomePay)

新版購物車模組請參考此份文件 [PChomePay WooCommerce User Guide](https://docs.google.com/document/d/1ItCUQvY0A4VeVAlOdAMbt48lKB-xlNVZCu7E6L9d0Mg/edit)

# **9\. 技術服務信箱**

如果在技術串接上遇到問題，可以聯繫我們的[技術服務信箱](mailto:tech_support@pchomepay.com.tw)，我們會儘快提供必要的協助，謝謝 

# **10\. 版本修訂紀錄**

| 版本 | 日期 | 更新內容 |
| :---: | :---: | :---- |
| 1.6.9 | 2026-01-19 | 新增 platform\_code 欄位，因應不同平台發起的交易有更明確的識別值 |
| 1.6.8 | 2025-12-22 | 因應銀行支付服務下線，刪除跟銀行支付 (EACH) 相關段落 |
| 1.6.7 | 2025-09-04 | 調整 /v1/payment/{order\_id} 查詢訂單 API 針對 ATM 訂單擴充用戶轉帳之銀行代號及帳號 相關之 notify 亦比照上述規格擴充欄位 |
| 1.6.6 | 2025-08-08 | 調整 /v1/refund 當付款方式為 PI 時 response 從 IPPI 調整為 PI 使其所有的 pay\_type 邏輯較為一致 |
| 1.6.5 | 2025-07-31 | 調整 /v1/payment 付款方式 pay\_type 移除 IPPI 和 IBRCD 調整 /v1/payment/{order\_id} 的 status\_code WO 亦適用於信用卡付款的等待 OTP 流程 |
| 1.6.4 | 2025-06-20 | 更新 超商條碼正名為超商代碼繳費 調整 /v1/payment 擴充 bcode\_info 可設置該代碼繳費的效期 調整 /v1/payment 擴充超商代碼繳費，可以用 BCODE 當作 pay\_type 來傳送 |
| 1.6.3 | 2025-05-14 | 更新 查詢未出貨訂單 API 移除 history 欄位 新增 付款方式段落 |
| 1.6.2 | 2025-04-23 | 更新 超商取貨相關 API 之說明 |
| 1.6.1 | 2025-03-24 | 調整 /v1/payment/card/cardinfo/{member\_key} 的回應欄位 調整 /v1/payment/card/cardinfo/delete 的回應欄位 |
| 1.6.0 | 2025-02-10 | 新增 建立超商代碼繳費訂單（代碼付款幕後取號） 調整 /v1/payment 當 pay\_type 為 IBRCD 時，預設繳款期限從原本的 2 天調整為 7 天 |
| 1.5.5 | 2024-12-27 | 修改 建立 ATM 虛擬帳號訂單 /v1/payment/atmva 擴充 notify\_url / buyer\_name / buyer\_mobile / buyer\_email |
| 1.5.4 | 2024-11-26 | 新增 建立超商代碼繳費訂單 /v1/payment/barcode 服務 |
| 1.5.3 | 2024-09-24 | 通知 新增描述說明 |
| 1.5.2 | 2024-09-18 | 新增 查詢訂單 /v1/payment/{order\_id}，payment\_info 物件代碼付款之相關資訊 新增 通知 order\_audit / order\_confirm / order\_failed 會傳遞條碼相關資訊 |
| 1.5.1 | 2024-01-26 | 通知，移除 refund\_pending 及 refund\_fail 通知 修正，訂單查詢及退款查詢金額欄位型態 |
| 1.5.0 | 2023-12-22 | API 文件改版，多處地方更正資訊 |
| 1.4.1 | 2023-07-21 | 更新 4.2 建立訂單，移除 IPLOK 超商收款功能 |
| 1.4.0 | 2022-08-02 | 新增 4.2 建立訂單\_member\_key說明：需記錄會員信用卡號、超商收件人時才需要填寫的 key 值 |

# 

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALAAAAAeCAIAAAADwwOXAAAB8UlEQVR4Xu2SS4oDQQxDO5/7XzgknsICEaaMKHsWs5EWoel+khXQdV1XpN7vN56v1P1+X8+32w3Pr9fr8Xh8Ph98Jbl+10s+r9+Vs/j1sLzf73Fl5eBrlx/0Ifl8Pn8l4+tKA/z93//ep8wXPMQrsAh+0Acd6NV835ACGR7E1qfMFzzEKx7EET/oQ9KDQAd6Nd83pECGB7H1KfMFD/GKB3HED/qQ9CDQgV7N9w0pkOFBbH3KfMFDvOJBHPGDPiQ9CHSgV/N9QwpkeBBbnzJf8BCveBBH/KAPSQ8CHejVfN+QAhkexNanzBc8xCsexBE/6EPSg0AHejXfN6RAhgex9SnzBQ/xigdxxA/6kPQg0IFezfcNKZDhQWx9ynzBQ7ziQRzxgz4kPQh0oFfzfUMKZHgQW58yX/AQr3gQR/ygD0kPAh3o1XzfkAIZHsTWp8wXPMQrHsQRP+hD0oNAB3o13zekQIYHsfUp8wUP8YoHccQP+pD0INCBXs33DSmQ4UFsfcp8wUO84kEc8YM+JD0IdKBX831DCmR4EFufMl/wEK94EEf8oA9JDwId6NV835ACGR7E1qfMFzzEKx7EET/oQ9KDQAd6Nd83pECGB7H1KfMFD/GKB3HED/qQ9CDQgV7N9w0pkOFBbH3KfMFDvPK/g/gBks/6662Wi4wAAAAASUVORK5CYII=>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASAAAAAeCAIAAAAD5lS+AAAEMUlEQVR4Xu2Ty25tMQhDTx///8N9+G6BZKEq4dqMMogH1T50GRwhXq/XC6Gfn5/8foXe39+f77e3t/z++vr6+Pj4/f0lk66n/vx3wLP+zM3K480O39/fn5+fT/35mR0yWzZnwuV3Wp6//83zioYJZ3+Sz3R2S6y68jvjsZ6zmjys/Hkv61lR8uz4vj9C4325/Gl5Gj5Fl7IvOPdiG+oY5QFLnvV7YG6eHd/3R2i8L5c/LU/Dp+hS9gXnXmxDHaM8YMmzfg/MzbPj+/4Ijffl8qflafgUXcq+4NyLbahjlAcsedbvgbl5dnzfH6Hxvlz+tDwNn6JL2Rece7ENdYzygCXP+j0wN8+O7/sjNN6Xy5+Wp+FTdCn7gnMvtqGOUR6w5Fm/B+bm2fF9f4TG+3L50/I0fIouZV9w7sU21DHKA5Y86/fA3Dw7vu+P0HhfLn9anoZP0aXsC8692IY6RnnAkmf9HpibZ8f3/REa78vlT8vT8Cm6lH3BuRfbUMcoD1jyrN8Dc/Ps+L4/QuN9ufxpeRo+RZeyLzj3YhvqGOUBS571e2Bunh3f90dovC+XPy1Pw6foUvYF515sQx2jPGDJs34PzM2z4/v+CI335fKn5Wn4FF3KvuDci22oY5QHLHnW74G5eXZ83x+h8b5c/rQ8DZ+iS9kXnHuxDXWM8oAlz/o9MDfPju/7IzTel8uflqfhU3Qp+4JzL7ahjlEesORZvwfm5tnxfX+Exvty+dPyNHyKLmVfcO7FNtQxygOWPOv3wNw8O77vj9B4Xy5/Wp6GT9Gl7AvOvdiGOkZ5wJJn/R6Ym2fH9/0RGu/L5U/L0/ApupR9wbkX21DHKA9Y8qzfA3Pz7Pi+P0Ljfbn8aXkaPkWXsi8492Ib6hjlAUue9Xtgbp4d3/dHaLwvlz8tT8On6FL2BedebEMdozxgybN+D8zNs+P7/giN9+Xyp+Vp+BRdyr7g3IttqGOUByx51u+BuXl2fN8fofG+XP60PA2fokvZF5x7sQ11jPKAJc/6PTA3z47v+yM03pfLn5an4VN0KfuCcy+2oY5RHrDkWb8H5ubZ8X1/hMb7cvnT8jR8ii5lX3DuxTbUMcoDljzr98DcPDu+74/QeF8uf1qehk/RpewLzr3YhjpGecCSZ/0emJtnx/f9ERrvy+VPy9PwKbqUfcG5F9tQxygPWPKs3wNz8+z4vj9C4325/Gl5Gj5Fl7IvOPdiG+oY5QFLnvV7YG6eHd/3R2i8L5c/LU/Dp+hS9gXnXmxDHaM8YMmzfg/MzbPj+/4Ijffl8qflafgUXcq+4NyLbahjlAcsedbvgbl5dnzfH6Hxvlz+tDwNn6JL2Rece7ENdYzygCXP+j0wN8+O7/sjNN6Xy5+Wp+FTdCn7gnMvtqGOUR6w5Fm/B+bm2fF9f4TG+3L50/I0fIouZV+Q7+Ufn1UkC8GQ9iYAAAAASUVORK5CYII=>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARAAAAAeCAIAAABrFdaGAAACxUlEQVR4Xu2T24pCUQxDvf3/D4tmNgaCtKVMn6YDycNB6soxleZyuVzw0ev14ufLR7fb7Xy+Xq/8/Hw+7/f7+/3mtyLP8wzPs+FFHp35+fb7Ded3OTlekQTOhC//zpZ5/qhc/Hyw77cxW2D45E9wyOSPxyN4+e13nmZfavp+fPT7/yfwTZ5tPCWX/h8+/2RfjO5/bPiIJFyYtC81fT8++v3/E/gmzzaeksuFibxITA6CExcm71vyTZ5tPCWXCxN5kZgcBCcuTN635Js823hKLhcm8iIxOQhOXJi8b8k3ebbxlFwuTORFYnIQnLgwed+Sb/Js4ym5XJjIi8TkIDhxYfK+Jd/k2cZTcrkwkReJyUFw4sLkfUu+ybONp+RyYSIvEpOD4MSFyfuWfJNnG0/J5cJEXiQmB8GJC5P3LfkmzzaeksuFibxITA6CExcm71vyTZ5tPCWXCxN5kZgcBCcuTN635Js823hKLhcm8iIxOQhOXJi8b8k3ebbxlFwuTORFYnIQnLgwed+Sb/Js4ym5XJjIi8TkIDhxYfK+Jd/k2cZTcrkwkReJyUFw4sLkfUu+ybONp+RyYSIvEpOD4MSFyfuWfJNnG0/J5cJEXiQmB8GJC5P3LfkmzzaeksuFibxITA6CExcm71vyTZ5tPCWXCxN5kZgcBCcuTN635Js823hKLhcm8iIxOQhOXJi8b8k3ebbxlFwuTORFYnIQnLgwed+Sb/Js4ym5XJjIi8TkIDhxYfK+Jd/k2cZTcrkwkReJyUFw4sLkfUu+ybONp+RyYSIvEpOD4MSFyfuWfJNnG0/J5cJEXiQmB8GJC5P3LfkmzzaeksuFibxITA6CExcm71vyTZ5tPCWXCxN5kZgcBCcuTN635Js823hKLhcm8iIxOQhOXJi8b8k3ebbxlFwuTORFYnIQnLgwed+Sb/Js4ym5/ldhfgDCM7IWBsp0zgAAAABJRU5ErkJggg==>

[image4]: <data:image/png;base64,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>

[image5]: <data:image/png;base64,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>