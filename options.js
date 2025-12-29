// ============================================
// 預設提示詞常數
// ============================================
// 當使用者首次使用擴充功能時,會使用此預設提示詞
// 使用者可以在選項頁面中修改此提示詞
const DEFAULT_PROMPT = `說明這家公司的主要業務範圍、主要客戶。
是否為集團的母公司或子公司。
若為母公司則詳細列出相關子公司與子公司各家近期的股價表現狀況(列表)。
判斷是否有明顯季節性循環。

比較最近兩季 "營運現金"、"營業利益"、"自由現金" 三項 🟢正數 與 🔴負數 的狀態關係(意涵)，做成表格，欄位為 "項目"、"Qx"、"Qx-1""意涵"，最新的一季列在右邊欄位，前一季列在左邊欄位。
最後在表格外用文字簡述這個表格結論.

確切說明近10天股價漲跌表現的原因。`;

// ============================================
// DOM 元素參照
// ============================================
// 取得頁面上的各個 DOM 元素,以便後續操作
const promptTextarea = document.getElementById('promptText');  // 提示詞輸入框
const saveBtn = document.getElementById('saveBtn');            // 儲存按鈕
const downloadBtn = document.getElementById('downloadBtn');    // 下載按鈕
const statusDiv = document.getElementById('status');           // 狀態訊息顯示區域
const charCountSpan = document.getElementById('charCount');    // 字元數顯示區域
const debugSwitch = document.getElementById('debugSwitch');    // 偵錯Log開關
const stockLinkSwitch = document.getElementById('stockLinkSwitch'); // 股票代號自動連結開關

// ============================================
// 頁面載入事件監聽器
// ============================================
// 當頁面 DOM 載入完成後,執行初始化動作
document.addEventListener('DOMContentLoaded', () => {
  loadPrompt();      // 載入已儲存的提示詞和設定
  updateCharCount(); // 更新字元數顯示
});

// ============================================
// Textarea 輸入事件監聽器
// ============================================
// 當使用者在 textarea 中輸入時,即時更新字元數
promptTextarea.addEventListener('input', updateCharCount);

// ============================================
// 偵錯開關變化事件監聽器
// ============================================
// 當使用者切換偵錯開關時,記錄狀態 (用於除錯)
debugSwitch.addEventListener('change', () => {
  console.log('Debug switch changed to:', debugSwitch.checked);
});

// ============================================
// 儲存按鈕點擊事件監聽器
// ============================================
saveBtn.addEventListener('click', savePrompt);

// ============================================
// 下載按鈕點擊事件監聽器
// ============================================
downloadBtn.addEventListener('click', downloadPrompt);

// ============================================
// 函數: 載入提示詞和設定
// ============================================
// 功能:
// 1. 從 Chrome Storage 讀取已儲存的提示詞
// 2. 如果沒有儲存的提示詞,使用預設值
// 3. 從 Chrome Storage 讀取偵錯開關狀態
// 4. 從 Chrome Storage 讀取股票代號連結開關狀態
// 5. 更新頁面上的 UI 元素
function loadPrompt() {
  // 從 Chrome Storage 讀取 additionalPrompt、debugEnabled 和 stockLinkEnabled
  chrome.storage.local.get(['additionalPrompt', 'debugEnabled', 'stockLinkEnabled'], (result) => {
    // ============================================
    // 載入提示詞
    // ============================================
    if (result.additionalPrompt) {
      // 如果有儲存的提示詞,使用儲存的值
      promptTextarea.value = result.additionalPrompt;
      console.log('Loaded prompt from storage:', result.additionalPrompt);
    } else {
      // 如果沒有儲存的提示詞,使用預設值
      promptTextarea.value = DEFAULT_PROMPT;
      console.log('Using default prompt');
    }
    
    // ============================================
    // 載入偵錯開關狀態
    // ============================================
    // 預設為 true (顯示偵錯Log)
    // 如果 result.debugEnabled 未定義,使用預設值 true
    // 如果 result.debugEnabled 有值,使用該值
    debugSwitch.checked = result.debugEnabled !== undefined ? result.debugEnabled : true;
    console.log('Loaded debug switch state:', debugSwitch.checked);
    
    // ============================================
    // 載入股票代號連結開關狀態
    // ============================================
    // 預設為 true (啟用股票代號自動連結)
    // 如果 result.stockLinkEnabled 未定義,使用預設值 true
    // 如果 result.stockLinkEnabled 有值,使用該值
    stockLinkSwitch.checked = result.stockLinkEnabled !== undefined ? result.stockLinkEnabled : true;
    console.log('Loaded stock link switch state:', stockLinkSwitch.checked);
    
    // 更新字元數顯示
    updateCharCount();
  });
}

// ============================================
// 函數: 儲存提示詞和設定到 Chrome Storage
// ============================================
// 功能:
// 1. 取得 textarea 中的提示詞內容
// 2. 取得偵錯開關的狀態
// 3. 取得股票代號連結開關的狀態
// 4. 將所有設定儲存到 Chrome Storage
// 5. 顯示儲存成功訊息
function savePrompt() {
  // 取得提示詞內容
  const promptText = promptTextarea.value;
  
  // 取得偵錯開關狀態
  const debugEnabled = debugSwitch.checked;
  
  // 取得股票代號連結開關狀態
  const stockLinkEnabled = stockLinkSwitch.checked;
  
  // 儲存到 Chrome Storage
  chrome.storage.local.set({ 
    additionalPrompt: promptText,      // 儲存提示詞
    debugEnabled: debugEnabled,        // 儲存偵錯開關狀態
    stockLinkEnabled: stockLinkEnabled // 儲存股票代號連結開關狀態
  }, () => {
    // 儲存完成後的回調函數
    console.log('Prompt and settings saved to storage');
    console.log('Debug enabled:', debugEnabled);
    console.log('Stock link enabled:', stockLinkEnabled);
    
    // 顯示儲存成功訊息
    showStatus('✅ 儲存成功!', 'success');
  });
}

// ============================================
// 函數: 下載提示詞為文字檔
// ============================================
// 功能:
// 1. 取得 textarea 中的提示詞內容
// 2. 建立 Blob 物件 (UTF-8 編碼)
// 3. 建立下載連結並觸發下載
// 4. 清理資源
function downloadPrompt() {
  // 取得提示詞內容
  const promptText = promptTextarea.value;
  
  // 設定檔案名稱
  const filename = '附加提示詞.txt';
  
  // ============================================
  // 建立 Blob 物件 (UTF-8 編碼)
  // ============================================
  // Blob 是一個類似檔案的物件,用於儲存二進位資料
  const blob = new Blob([promptText], { type: 'text/plain;charset=utf-8' });
  
  // ============================================
  // 建立下載連結
  // ============================================
  // 建立一個暫時的 URL,指向 Blob 物件
  const url = URL.createObjectURL(blob);
  
  // 建立一個隱藏的 <a> 元素
  const a = document.createElement('a');
  a.href = url;           // 設定連結指向 Blob URL
  a.download = filename;  // 設定下載的檔案名稱
  
  // ============================================
  // 觸發下載
  // ============================================
  document.body.appendChild(a);  // 將 <a> 元素加入 DOM
  a.click();                     // 模擬點擊,觸發下載
  
  // ============================================
  // 清理資源
  // ============================================
  document.body.removeChild(a);  // 從 DOM 中移除 <a> 元素
  URL.revokeObjectURL(url);      // 釋放 Blob URL 佔用的記憶體
  
  // 記錄下載動作
  console.log('Prompt downloaded as:', filename);
  
  // 顯示下載成功訊息
  showStatus('📥 檔案已下載: ' + filename, 'success');
}

// ============================================
// 函數: 更新字元數顯示
// ============================================
// 功能: 計算 textarea 中的字元數,並更新顯示
function updateCharCount() {
  // 取得 textarea 中的字元數
  const count = promptTextarea.value.length;
  
  // 更新顯示
  charCountSpan.textContent = count;
}

// ============================================
// 函數: 顯示狀態訊息
// ============================================
// 參數:
// - message: 要顯示的訊息文字
// - type: 訊息類型 ('success' 或 'error')
// 功能:
// 1. 顯示狀態訊息
// 2. 3 秒後自動隱藏
function showStatus(message, type) {
  // 設定訊息文字
  statusDiv.textContent = message;
  
  // 設定訊息樣式 (success 或 error)
  statusDiv.className = 'status ' + type;
  
  // 顯示訊息
  statusDiv.style.display = 'block';
  
  // 3 秒後自動隱藏
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}
