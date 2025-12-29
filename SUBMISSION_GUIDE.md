# Edge Store 提交準備指南

## 📋 檢查清單

### ✅ 已完成項目

#### 1. Manifest.json 修正
- [x] 添加 `description` 欄位
- [x] 添加 `author` 欄位  
- [x] 添加 `homepage_url` 欄位
- [x] 更新 `icons` 為完整路徑

#### 2. 圖示準備
- [x] icon-16.png (16x16)
- [x] icon-32.png (32x32)
- [x] icon-48.png (48x48)
- [x] icon-128.png (128x128)

#### 3. 文件建立
- [x] README.md（英文）
- [x] privacy_policy.html（繁體中文）
- [x] STORE_LISTING.md（商店資料）

#### 4. 程式碼檢查
- [x] 無安全問題
- [x] 使用 Manifest V3
- [x] 註解完整
- [x] 權限使用合理

---

### ⏳ 待完成項目

#### 1. 截圖準備
您需要準備 3-5 張功能截圖（建議尺寸：1280x800 或更大）：

1. **右鍵選單功能**
   - 在任何網頁上右鍵，顯示「將內容傳送到 Gemini」選項
   
2. **Gemini 自動貼上**
   - 顯示內容自動貼到 Gemini 輸入框的畫面
   
3. **股票代號自動連結**
   - Gemini 回應中的股票代號（如 2330）變成藍色連結
   
4. **設定頁面**
   - 擴充功能的選項頁面
   
5. **ChatGPT 支援**（選用）
   - 同樣功能在 ChatGPT 上的展示

#### 2. 促銷圖片（選用但建議）
- 大型促銷磚：1400x560 px
- 小型促銷磚：440x280 px

#### 3. 隱私政策託管
您有兩個選擇：

**選項 A：使用現有網站**
```
將 privacy_policy.html 上傳到您的網站：
https://gd.myftp.org/privacy_policy.html
```

**選項 B：使用 GitHub Pages**
```
1. 建立 GitHub repository
2. 上傳 privacy_policy.html
3. 啟用 GitHub Pages
4. 使用產生的 URL
```

---

## 📦 打包步驟

### 方法 1：手動打包（推薦）

```powershell
# 1. 切換到專案目錄
cd "r:\紅綠燈AI外掛\gemini-autopaste"

# 2. 建立打包目錄
New-Item -ItemType Directory -Path "../edge-store-package" -Force

# 3. 複製需要的檔案
$files = @(
    "manifest.json",
    "background.js",
    "content.js",
    "source_content.js",
    "options.html",
    "options.js",
    "icon.png",
    "gpticon.png",
    "gpticon_32.png",
    "使用說明.html",
    "安裝說明.html"
)

foreach ($file in $files) {
    Copy-Item $file "../edge-store-package/"
}

# 4. 複製 icons 資料夾
Copy-Item -Recurse "icons" "../edge-store-package/"

# 5. 壓縮成 ZIP（不要包含根目錄）
cd "../edge-store-package"
Compress-Archive -Path * -DestinationPath "../gemini-autopaste-v1.0.zip" -Force

Write-Output "✅ 打包完成：gemini-autopaste-v1.0.zip"
```

### 方法 2：使用 Edge 擴充功能打包工具

1. 開啟 Edge 瀏覽器
2. 前往 `edge://extensions/`
3. 啟用「開發人員模式」
4. 點擊「載入解壓縮」，選擇專案資料夾
5. 測試擴充功能是否正常運作
6. 點擊「封裝擴充功能」
7. 選擇專案資料夾，產生 .zip 檔案

---

## 🚀 Edge Store 提交流程

### 步驟 1：註冊開發者帳戶

1. 前往 [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview)
2. 使用 Microsoft 帳戶登入
3. 完成開發者註冊（可能需要支付一次性註冊費）
4. 填寫開發者資料

### 步驟 2：建立新的擴充功能提交

1. 在 Partner Center 點擊「建立新的擴充功能」
2. 選擇「手動上傳」
3. 上傳打包的 .zip 檔案

### 步驟 3：填寫商店列表資訊

參考 `STORE_LISTING.md` 的內容填寫：

#### 基本資訊
- **名稱**：財報紅綠燈 to Gemini
- **簡短描述**：自動將財報資料傳送到 Gemini AI，支援股票代號快速查詢與智能分析
- **分類**：Productivity（生產力工具）
- **隱私政策 URL**：https://gd.myftp.org/privacy_policy.html

#### 詳細描述
複製 `STORE_LISTING.md` 中的「詳細描述 - 繁體中文版本」

#### 圖片上傳
- 上傳截圖（3-5 張）
- 上傳促銷圖片（選用）

#### 版本資訊
- **版本號**：1.0
- **更新說明**：複製 `STORE_LISTING.md` 中的「版本說明」

### 步驟 4：設定權限和隱私

在提交表單中說明每個權限的用途：

```
storage: 儲存使用者的自訂設定（提示詞、開關等）
activeTab: 讀取當前分頁內容（僅在使用者觸發時）
contextMenus: 在右鍵選單新增「傳送到 Gemini」選項
<all_urls>: 允許在任何網頁上擷取內容（僅在使用者主動觸發時）
```

說明外部網站訪問：
```
- gemini.google.com: 貼上內容到 Gemini AI
- chatgpt.com: 貼上內容到 ChatGPT
- gd.myftp.org: 股票代號連結目標（財報紅綠燈網站）
```

### 步驟 5：提交審核

1. 檢查所有資訊是否正確
2. 確認隱私政策 URL 可訪問
3. 點擊「提交審核」
4. 等待 Microsoft 審核（通常 3-7 個工作天）

---

## 🔍 提交前最終檢查

請在提交前確認以下項目：

### 技術檢查
- [ ] 在 Edge 開發者模式載入擴充功能無錯誤
- [ ] 右鍵選單功能正常
- [ ] Gemini 自動貼上功能正常
- [ ] ChatGPT 貼上功能正常（選用）
- [ ] 股票代號自動連結功能正常
- [ ] 設定頁面可以正常儲存/載入
- [ ] 所有圖示正確顯示

### 文件檢查
- [ ] manifest.json 無語法錯誤
- [ ] 隱私政策 URL 可訪問
- [ ] README.md 內容完整
- [ ] 所有必要檔案都包含在 .zip 中

### 商店資料檢查
- [ ] 擴充功能名稱清晰易懂
- [ ] 簡短描述吸引人且在 132 字元內
- [ ] 詳細描述完整說明功能
- [ ] 截圖清晰且展示主要功能
- [ ] 分類正確
- [ ] 關鍵字相關且有用

---

## ⚠️ 常見審核拒絕原因（務必避免）

1. **隱私政策不可訪問**
   - 確保 URL 永久有效
   - 確保內容符合實際功能

2. **權限使用說明不足**
   - 在商店描述中清楚說明每個權限的用途
   - 避免要求不必要的權限

3. **截圖品質不佳**
   - 使用高解析度截圖
   - 確保文字清晰可讀
   - 展示實際功能而非模擬畫面

4. **描述誤導或不準確**
   - 確保描述與實際功能一致
   - 不誇大功能
   - 不使用誤導性標語

5. **功能無法正常運作**
   - 在多個環境測試
   - 確保與最新版 Edge 相容
   - 測試所有宣稱的功能

---

## 📞 審核後續

### 如果通過審核
- 擴充功能會在 24 小時內上架
- 您會收到電子郵件通知
- 可以在 Edge Add-ons 商店搜尋到

### 如果被拒絕
- 仔細閱讀拒絕理由
- 修正問題
- 重新提交（可能需要增加版本號）

### 更新擴充功能
- 修改程式碼後，增加版本號
- 重新打包
- 在 Partner Center 提交新版本
- 重複審核流程

---

## 💡 提升審核通過率的建議

1. **提供測試帳號**（如果需要）
   - 在「給審核人員的備註」中提供測試步驟
   
2. **詳細的權限說明**
   - 在商店描述中明確說明為何需要每個權限
   
3. **高品質截圖**
   - 使用 1920x1080 或更高解析度
   - 添加註解說明功能
   
4. **清晰的隱私政策**
   - 說明收集哪些資料（即使是「不收集」）
   - 說明資料如何使用和儲存
   
5. **完整的功能測試**
   - 在不同版本的 Edge 測試
   - 在不同作業系統測試（Windows/Mac）

---

## 📊 預計時程

| 階段 | 預計時間 |
|------|----------|
| 準備截圖和促銷圖 | 1-2 小時 |
| 上傳隱私政策 | 30 分鐘 |
| 打包擴充功能 | 15 分鐘 |
| 填寫商店資料 | 1 小時 |
| 提交審核 | 5 分鐘 |
| **Microsoft 審核** | **3-7 個工作天** |
| 上架後處理 | 1 天 |

**總計**：約 1 週（含審核時間）

---

## ✅ 下一步行動

您目前需要完成：

1. **準備截圖**
   - 安裝擴充功能到 Edge
   - 截取 3-5 張功能畫面
   - 確保解析度至少 1280x800

2. **上傳隱私政策**
   - 將 `privacy_policy.html` 上傳到您的網站
   - 確認 URL 可訪問

3. **測試擴充功能**
   - 在 Edge 開發者模式測試所有功能
   - 確認無錯誤

4. **打包提交**
   - 執行上方的打包指令
   - 前往 Partner Center 提交

---

## 📧 需要協助？

如果在提交過程中遇到問題：
- 參考 [Microsoft Edge 擴充功能文件](https://docs.microsoft.com/microsoft-edge/extensions-chromium/)
- 查看 [Partner Center 說明](https://partner.microsoft.com/support)

**祝您提交順利！** 🎉
