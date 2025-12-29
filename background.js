// ============================================
// 偵錯Log控制機制
// ============================================
// 目的: 根據使用者設定控制是否顯示 console.log
// 運作方式:
// 1. 先暫時停用所有 console.log (避免非同步讀取時序問題)
// 2. 從 Chrome Storage 讀取 debugEnabled 設定
// 3. 如果設定為 true (或未設定,預設為 true),則恢復 console.log
// 4. 如果設定為 false,則保持停用狀態
(function() {
  const originalLog = console.log; // 保存原始的 console.log 函數
  console.log = function() {}; // 先暫時停用,等讀取設定後再決定
  
  // 從 Chrome Storage 讀取偵錯開關狀態
  chrome.storage.local.get(['debugEnabled'], (result) => {
    // 預設為 true (顯示log),只有明確設為 false 才停用
    if (result.debugEnabled !== false) {
      console.log = originalLog; // 恢復 console.log
    }
    // 如果 result.debugEnabled === false,則保持停用狀態
  });
})();

// ============================================
// 擴充功能安裝事件監聽器
// ============================================
// 當擴充功能首次安裝或更新時觸發
chrome.runtime.onInstalled.addListener(() => {
  console.log("Gemini AutoPaste: Background script installed.");
  
  // 建立右鍵選單項目
  chrome.contextMenus.create({
    id: "sendToGemini",                    // 選單項目的唯一識別碼
    title: "將內容傳送到 Gemini",          // 顯示在右鍵選單的文字
    contexts: ["all"]                      // 在所有情境下都顯示 (包括 textarea、選取文字等)
  });
});

// ============================================
// 右鍵選單點擊事件監聽器
// ============================================
// 當使用者點擊右鍵選單的「將內容傳送到 Gemini」時觸發
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log("Gemini AutoPaste: Context menu clicked", info);
  
  // 優先使用選取的文字
  let text = info.selectionText || "";
  
  // 如果沒有選取文字
  if (!text) {
    console.log("Gemini AutoPaste: 沒有選取文字，嘗試從頁面元素獲取...");
    
    // 向當前分頁的 content script 發送訊息,請求取得點擊元素的內容
    chrome.tabs.sendMessage(tab.id, { action: "getClickedElementValue" }, (response) => {
      text = response?.value || "";  // 取得回應的值,如果沒有則為空字串
      saveAndOpen(text);             // 儲存文字並開啟 Gemini
    });
  } else {
    // 有選取文字,直接處理
    saveAndOpen(text);
  }
});

// ============================================
// 來自 Content Script 的訊息監聽器
// ============================================
// 監聽來自 content script 的直接請求 (例如按鈕點擊)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 檢查是否為「從按鈕傳送到 Gemini」的請求
  if (request.action === "sendToGeminiFromButton") {
    console.log("Gemini AutoPaste: Received button click event with text:", request.text);
    saveAndOpen(request.text);  // 儲存文字並開啟 Gemini
  }
});

// ============================================
// 儲存文字並開啟 Gemini 函數
// ============================================
// 參數: text - 要傳送到 Gemini 的文字內容
// 功能:
// 1. 驗證文字是否存在
// 2. 將文字儲存到 Chrome Storage
// 3. 設定 autoPasteEnabled 標記為 true (允許自動貼上)
// 4. 開啟新分頁到 Gemini 網址
function saveAndOpen(text) {
  // 驗證文字是否存在
  if (!text) {
    console.warn("Gemini AutoPaste: 沒有抓到任何文字內容！");
    return;  // 如果沒有文字,直接返回,不執行後續動作
  }
  
  // 記錄準備傳送的文字資訊
  console.log("Gemini AutoPaste: 準備傳送文字 (長度:", text.length, "字元)");
  console.log("Gemini AutoPaste: 文字預覽:", text.substring(0, 100) + "...");
  console.log("Gemini AutoPaste: 完整文字:", text);
  
  // 同時儲存文字和自動貼上標記到 Chrome Storage
  chrome.storage.local.set({ 
    "pendingText": text,           // 待貼上的文字內容
    "autoPasteEnabled": true       // 標記為按鈕觸發,允許自動貼上
  }, () => {
    console.log("Gemini AutoPaste: 文字已存入 storage (autoPasteEnabled: true)，開啟 Gemini...");
    
    // 開啟新分頁到 Gemini 網址
    // content.js 會在 Gemini 頁面載入後自動讀取 storage 並貼上文字
    chrome.tabs.create({ url: "https://gemini.google.com/app" });
  });
}
