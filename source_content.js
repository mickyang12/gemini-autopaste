// ============================================
// 偵錯Log控制機制
// ============================================
// 目的: 根據使用者設定控制是否顯示 console.log
(function() {
  const originalLog = console.log; // 保存原始的 console.log 函數
  console.log = function() {}; // 先暫時停用,等讀取設定後再決定
  
  // 從 Chrome Storage 讀取偵錯開關狀態
  chrome.storage.local.get(['debugEnabled'], (result) => {
    // 預設為 true (顯示log),只有明確設為 false 才停用
    if (result.debugEnabled !== false) {
      console.log = originalLog; // 恢復 console.log
    }
  });
})();

// ============================================
// 全域變數: 記錄最後右鍵點擊的元素
// ============================================
// 用途: 當使用者右鍵點擊時,記錄點擊的元素,以便後續取得其內容
let lastRightClickedElement = null;

// ============================================
// 監聽右鍵點擊事件
// ============================================
// 當使用者在頁面上右鍵點擊時,記錄點擊的元素
document.addEventListener('contextmenu', (event) => {
  lastRightClickedElement = event.target; // 記錄點擊的元素
  console.log("Gemini AutoPaste (Source): 右鍵點擊元素", lastRightClickedElement);
}, true); // 使用捕獲階段,確保能捕捉到所有元素的右鍵點擊

// ============================================
// 監聽來自 Background Script 的訊息
// ============================================
// 當 background script 需要取得點擊元素的內容時,會發送訊息到這裡
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 檢查是否為「取得點擊元素內容」的請求
  if (request.action === "getClickedElementValue") {
    let value = "";
    
    // 如果有記錄到點擊的元素
    if (lastRightClickedElement) {
      // 嘗試取得元素的值 (優先 value 屬性,其次 innerText)
      value = lastRightClickedElement.value || lastRightClickedElement.innerText || "";
      console.log("Gemini AutoPaste (Source): 提取到的內容:", value);
    }
    
    // 回傳取得的內容
    sendResponse({ value: value });
  }
  return true; // 保持訊息通道開啟 (非同步回應)
});

// ============================================
// 功能 1: 自動注入 Gemini 浮動按鈕
// ============================================
// 目的: 在頁面上的特定按鈕旁邊注入 Gemini 圖示按鈕
// 觸發時機: 頁面載入後、DOM 變化時、定期檢查

/**
 * 注入 Gemini 浮動按鈕函數
 * 功能:
 * 1. 尋找頁面上所有包含 onclick="opengemini()" 的按鈕
 * 2. 在這些按鈕旁邊注入 Gemini 圖示
 * 3. 點擊圖示時,讀取 textarea 內容並傳送到 Gemini
 */
function injectGeminiButton() {
  // ============================================
  // 步驟 1: 尋找目標按鈕
  // ============================================
  // 尋找所有包含 onclick="opengemini()" 的按鈕
  const targetButtons = document.querySelectorAll('button[onclick*="opengemini"]');
  
  // 如果沒有找到目標按鈕,直接返回
  if (targetButtons.length === 0) {
    console.log("Gemini AutoPaste (Source): 未偵測到目標按鈕 (opengemini)，將持續監聽...");
    return;
  }

  // ============================================
  // 步驟 2: 為每個目標按鈕注入 Gemini 圖示
  // ============================================
  targetButtons.forEach(btn => {
    // 避免重複注入 (檢查按鈕旁邊是否已經有 Gemini 圖示)
    if (btn.nextElementSibling && btn.nextElementSibling.classList.contains('gemini-float-btn')) {
      return; // 已經注入過,跳過
    }

    console.log("Gemini AutoPaste (Source): 找到目標按鈕，正在注入圖示...");

    // ============================================
    // 步驟 3: 建立 Gemini 圖示元素
    // ============================================
    const img = document.createElement('img');
    img.src = chrome.runtime.getURL("icon.png"); // 取得擴充功能的圖示 URL
    img.className = 'gemini-float-btn';          // 設定 class (用於識別和避免重複注入)
    img.title = "傳送到 Gemini";                 // 滑鼠懸停時顯示的提示文字
    
    // 設定圖示樣式
    img.style.cssText = `
      width: 32px;
      height: 32px;
      margin-left: 10px;
      cursor: pointer;
      vertical-align: middle;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      transition: transform 0.2s;
    `;
    
    // ============================================
    // 步驟 4: 設定滑鼠移入/移出效果
    // ============================================
    img.onmouseover = () => img.style.transform = "scale(1.1)"; // 滑鼠移入時放大
    img.onmouseout = () => img.style.transform = "scale(1)";    // 滑鼠移出時恢復

    // ============================================
    // 步驟 5: 設定點擊事件
    // ============================================
    img.onclick = (e) => {
      e.stopPropagation(); // 阻止事件冒泡
      e.preventDefault();  // 阻止預設行為
      
      // ============================================
      // 步驟 5.1: 尋找 textarea (使用多種策略)
      // ============================================
      let content = "";
      let container = btn.parentElement;
      
      // 策略 1: 在按鈕的父容器中尋找 textarea
      let textarea = container.querySelector('textarea, input[type="text"]');
      
      // 策略 2: 如果沒找到,往上一層尋找
      if (!textarea) {
        if (container.parentElement) {
           textarea = container.parentElement.querySelector('textarea');
        }
      }
      
      // 策略 3: 如果還是沒找到,在整個頁面中尋找第一個 textarea
      if (!textarea) {
         textarea = document.querySelector('textarea');
      }

      // ============================================
      // 步驟 5.2: 讀取 textarea 內容並傳送
      // ============================================
      if (textarea) {
        // 讀取 textarea 當前內容 (已經包含自動附加的提示詞)
        content = textarea.value || textarea.innerText || '';
        console.log("Gemini AutoPaste (Source): 從 textarea 讀取內容 (長度:", content.length, "字元)");
        console.log("Gemini AutoPaste (Source): 內容開頭:", content.substring(0, 50));
        console.log("Gemini AutoPaste (Source): 內容結尾:", content.substring(content.length - 100));
        console.log("Gemini AutoPaste (Source): 完整內容:", content);
        
        if (content) {
          // 傳送訊息到 background script,請求開啟 Gemini 並貼上內容
          console.log("Gemini AutoPaste (Source): 正在傳送到 Gemini...");
          chrome.runtime.sendMessage({ action: "sendToGeminiFromButton", text: content });
        } else {
          alert("Gemini AutoPaste: textarea 內容為空");
        }
      } else {
        // ============================================
        // 步驟 5.3: 如果找不到 textarea,嘗試抓取選取文字
        // ============================================
        content = window.getSelection().toString();
        console.log("Gemini AutoPaste (Source): 找不到輸入框，抓取選取文字", content);
        
        if (content) {
          chrome.runtime.sendMessage({ action: "sendToGeminiFromButton", text: content });
        } else {
          alert("Gemini AutoPaste: 找不到要在這裡傳送的內容 (找不到 textarea 或選取文字)");
        }
      }
    };

    // ============================================
    // 步驟 6: 將圖示插入到按鈕後面
    // ============================================
    btn.parentNode.insertBefore(img, btn.nextSibling);
  });
}

// ============================================
// 註冊注入按鈕的觸發時機
// ============================================

// 觸發時機 1: 頁面載入完成後
window.addEventListener('load', injectGeminiButton);

// 觸發時機 2: DOM 變化時 (處理動態載入的內容,例如 SPA 網頁)
const observer = new MutationObserver((mutations) => {
  // 如果偵測到頁面上出現目標按鈕,執行注入
  if (document.querySelector('button[onclick*="opengemini"]')) {
    injectGeminiButton();
  }
});
// 開始監聽整個 body 的 DOM 變化
observer.observe(document.body, { childList: true, subtree: true });

// 觸發時機 3: 定期檢查 (每 2 秒檢查一次,以防萬一)
setInterval(injectGeminiButton, 2000);

// ============================================
// 功能 2: 自動附加提示詞到 textarea
// ============================================
// 目的: 在特定 URL 的頁面上,自動將提示詞附加到 textarea 尾端
// 觸發時機: 頁面載入後、textarea 出現時

// 全域變數: 記錄已處理的 textarea (使用 WeakSet 避免記憶體洩漏)
let processedTextareas = new WeakSet();

/**
 * 自動附加提示詞到 textarea 函數
 * 功能:
 * 1. 檢查是否在指定的 URL
 * 2. 尋找頁面上的 textarea
 * 3. 讀取 textarea 原始內容
 * 4. 清除已存在的舊提示詞
 * 5. 將新提示詞附加到內容尾端
 * 6. 更新 textarea 顯示
 */
function autoAppendTextToTextarea() {
  // ============================================
  // 步驟 1: 檢查是否在指定的 URL
  // ============================================
  const currentUrl = window.location.href;
  const targetUrl = 'https://gd.myftp.org/lb/gpt.asp';
  
  // 如果不在目標 URL,直接返回 (不執行自動附加)
  if (!currentUrl.startsWith(targetUrl)) {
    console.log("Gemini AutoPaste (Source): 不在目標 URL,跳過自動附加");
    console.log("Gemini AutoPaste (Source): 當前 URL:", currentUrl);
    console.log("Gemini AutoPaste (Source): 目標 URL:", targetUrl);
    return;
  }
  
  console.log("Gemini AutoPaste (Source): ✅ 在目標 URL,繼續執行自動附加");
  
  // ============================================
  // 步驟 2: 尋找頁面上的 textarea
  // ============================================
  const textarea = document.querySelector('textarea');
  
  if (!textarea) {
    console.log("Gemini AutoPaste (Source): 未找到 textarea");
    return;
  }
  
  // ============================================
  // 步驟 3: 防止重複附加 (雙重檢查機制)
  // ============================================
  // 檢查 1: 使用 WeakSet 檢查
  // 檢查 2: 使用 dataset 屬性檢查
  if (processedTextareas.has(textarea) || textarea.dataset.geminiAppended === 'true') {
    console.log("Gemini AutoPaste (Source): textarea 已經附加過文字,跳過");
    return;
  }
  
  // 標記為已處理
  processedTextareas.add(textarea);                // WeakSet 標記
  textarea.dataset.geminiAppended = 'true';        // dataset 標記
  
  // 清除 storage 中的舊 pendingText (避免干擾)
  chrome.storage.local.remove("pendingText", () => {
    console.log("Gemini AutoPaste (Source): 已清除 storage 中的舊 pendingText");
  });
  
  // ============================================
  // 步驟 4: 讀取 textarea 當前內容
  // ============================================
  const content = textarea.value || textarea.innerText || '';
  console.log("Gemini AutoPaste (Source): 自動附加 - 原始內容", content);
  
  // ============================================
  // 步驟 5: 從 Chrome Storage 讀取附加提示詞
  // ============================================
  chrome.storage.local.get(['additionalPrompt'], (result) => {
    // 使用儲存的提示詞,如果沒有則使用舊的預設值 (保持向下相容)
    const additionalText = result.additionalPrompt || `比較最近兩季營運現金、營業利益、自由現金 三項 🟢正數 與 🔴負數 的狀態關係(意涵)，做成表格，欄位為 "項目"、"Qx"、"Qx-1""意涵"，最後在表格外用文字簡述這個表格結論.

說明近10天股價漲跌的原因。`;
    
    console.log("Gemini AutoPaste (Source): 使用的附加提示詞", additionalText);
    
    // ============================================
    // 步驟 6: 清除內容中已存在的舊提示詞
    // ============================================
    let cleanContent = content;
    
    // 使用正則表達式移除舊的提示詞片段
    // 正則表達式 1: 移除 "比較最近兩季..." 段落
    // 匹配開頭可能有的引號, 以及內容直到 "表格結論." 結束
    const regex1 = /['"]?比較最近兩季[\s\S]*?表格結論\.?/g;
    
    // 正則表達式 2: 移除 "說明近10天..." 段落
    // 匹配 "說明近10天" 開始, 直到 "原因。" 或 "原因." 結束
    const regex2 = /說明近10天[\s\S]*?原因[。.]/g;
    
    // 執行替換
    cleanContent = cleanContent.replace(regex1, '');
    cleanContent = cleanContent.replace(regex2, '');
    
    // 清理多餘的換行 (3個以上的換行替換為2個)
    cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n').trim();
    
    console.log("Gemini AutoPaste (Source): 清理後的內容", cleanContent);
    
    // ============================================
    // 步驟 7: 將提示詞附加到內容尾端
    // ============================================
    const mergedContent = cleanContent + '\n\n' + additionalText;
    
    // ============================================
    // 步驟 8: 更新 textarea 顯示
    // ============================================
    if (textarea.tagName.toLowerCase() === 'textarea' || textarea.tagName.toLowerCase() === 'input') {
      textarea.value = mergedContent; // 使用 value 屬性
    } else {
      textarea.innerText = mergedContent; // 使用 innerText 屬性
    }
    
    // 觸發事件,讓頁面知道內容已更新
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    
    // ============================================
    // 步驟 9: 捲動到 textarea 底部 + 聚焦
    // ============================================
    // 捲動到底部,讓使用者看到附加的提示詞
    if (textarea.scrollHeight) {
      textarea.scrollTop = textarea.scrollHeight;
    }
    
    // 聚焦 textarea,讓使用者注意到變化
    textarea.focus();
    
    console.log("Gemini AutoPaste (Source): 自動附加完成，合併後內容:", mergedContent);
  });
}

// ============================================
// 註冊自動附加的觸發時機
// ============================================

// 觸發時機 1: 頁面載入完成後 (延遲 500ms 確保頁面完全載入)
window.addEventListener('load', () => {
  setTimeout(autoAppendTextToTextarea, 500);
});

// 觸發時機 2: textarea 出現時 (使用 MutationObserver 監聽)
const textareaObserver = new MutationObserver((mutations) => {
  // 如果偵測到頁面上出現 textarea,執行自動附加
  if (document.querySelector('textarea')) {
    autoAppendTextToTextarea();
  }
});
// 開始監聽整個 body 的 DOM 變化
textareaObserver.observe(document.body, { childList: true, subtree: true });

// 注意: 原本有定期檢查的機制,但已移除以避免重複執行
// setInterval(autoAppendTextToTextarea, 3000);

// ============================================
// 功能 3: ChatGPT 按鈕注入和自動附加提示詞
// ============================================
// 目的: 在 ChatGPT 頁面注入「貼」按鈕,並自動附加提示詞到 textarea

/**
 * 注入 ChatGPT 按鈕函數
 * 功能:
 * 1. 尋找頁面上的 ChatGPT 按鈕 (class="btn btn-success")
 * 2. 在按鈕旁邊注入綠色「貼」圖示
 * 3. 點擊圖示時,讀取 textarea 內容並傳送到 ChatGPT
 */
function injectChatGPTButton() {
  // ============================================
  // 步驟 1: 尋找目標按鈕
  // ============================================
  // 尋找 class="btn btn-success" 且 onclick="generateURL()" 的按鈕
  const targetButtons = document.querySelectorAll('button.btn.btn-success[onclick*="generateURL"]');
  
  // 如果沒有找到目標按鈕,直接返回
  if (targetButtons.length === 0) {
    console.log("Gemini AutoPaste (Source): 未偵測到 ChatGPT 按鈕 (btn-success + generateURL)，將持續監聽...");
    return;
  }

  // ============================================
  // 步驟 2: 為每個目標按鈕注入「貼」圖示
  // ============================================
  targetButtons.forEach(btn => {
    // 避免重複注入 (檢查按鈕旁邊是否已經有圖示)
    if (btn.nextElementSibling && btn.nextElementSibling.classList.contains('chatgpt-paste-btn')) {
      return; // 已經注入過,跳過
    }

    console.log("Gemini AutoPaste (Source): 找到 ChatGPT 按鈕，正在注入「貼」圖示...");

    // ============================================
    // 步驟 3: 建立「貼」圖示元素
    // ============================================
    const img = document.createElement('img');
    img.src = chrome.runtime.getURL("gpticon.png"); // 取得綠色「貼」圖示 URL
    img.className = 'chatgpt-paste-btn';             // 設定 class (用於識別和避免重複注入)
    img.title = "傳送到 ChatGPT";                    // 滑鼠懸停時顯示的提示文字
    
    // 設定圖示樣式
    img.style.cssText = `
      width: 32px;
      height: 32px;
      margin-left: 10px;
      cursor: pointer;
      vertical-align: middle;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      transition: transform 0.2s;
    `;
    
    // ============================================
    // 步驟 4: 設定滑鼠移入/移出效果
    // ============================================
    img.onmouseover = () => img.style.transform = "scale(1.1)"; // 滑鼠移入時放大
    img.onmouseout = () => img.style.transform = "scale(1)";    // 滑鼠移出時恢復

    // ============================================
    // 步驟 5: 設定點擊事件
    // ============================================
    img.onclick = (e) => {
      e.stopPropagation(); // 阻止事件冒泡
      e.preventDefault();  // 阻止預設行為
      
      // ============================================
      // 步驟 5.1: 尋找 textarea
      // ============================================
      let content = "";
      let container = btn.parentElement;
      
      // 策略 1: 在按鈕的父容器中尋找 textarea
      let textarea = container.querySelector('textarea');
      
      // 策略 2: 如果沒找到,往上一層尋找
      if (!textarea) {
        if (container.parentElement) {
           textarea = container.parentElement.querySelector('textarea');
        }
      }
      
      // 策略 3: 如果還是沒找到,在整個頁面中尋找第一個 textarea
      if (!textarea) {
         textarea = document.querySelector('textarea');
      }

      // ============================================
      // 步驟 5.2: 讀取 textarea 內容並傳送到 ChatGPT
      // ============================================
      if (textarea) {
        // 讀取 textarea 當前內容 (已經包含自動附加的提示詞)
        content = textarea.value || textarea.innerText || '';
        console.log("Gemini AutoPaste (Source): 從 textarea 讀取內容 (長度:", content.length, "字元)");
        console.log("Gemini AutoPaste (Source): 完整內容:", content);
        
        if (content) {
          // 開啟 ChatGPT 並傳送內容
          console.log("Gemini AutoPaste (Source): 正在開啟 ChatGPT...");
          
          // 儲存文字到 Chrome Storage
          chrome.storage.local.set({ 
            "pendingText": content,
            "autoPasteEnabled": true
          }, () => {
            console.log("Gemini AutoPaste (Source): 文字已存入 storage，開啟 ChatGPT...");
            // 開啟 ChatGPT 頁面
            window.open('https://chatgpt.com/', '_blank');
          });
        } else {
          alert("Gemini AutoPaste: textarea 內容為空");
        }
      } else {
        alert("Gemini AutoPaste: 找不到 textarea");
      }
    };

    // ============================================
    // 步驟 6: 將圖示插入到按鈕後面
    // ============================================
    btn.parentNode.insertBefore(img, btn.nextSibling);
  });
}

// ============================================
// 註冊 ChatGPT 按鈕注入的觸發時機
// ============================================

// 觸發時機 1: 頁面載入完成後
window.addEventListener('load', injectChatGPTButton);

// 觸發時機 2: DOM 變化時 (處理動態載入的內容)
const chatgptObserver = new MutationObserver((mutations) => {
  // 如果偵測到頁面上出現 ChatGPT 按鈕,執行注入
  if (document.querySelector('button.btn.btn-success[onclick*="generateURL"]')) {
    injectChatGPTButton();
  }
});
// 開始監聽整個 body 的 DOM 變化
chatgptObserver.observe(document.body, { childList: true, subtree: true });

// 觸發時機 3: 定期檢查 (每 2 秒檢查一次,以防萬一)
setInterval(injectChatGPTButton, 2000);

// ============================================
// 注意: ChatGPT 自動附加提示詞功能已移除
// ============================================
// 原因: 在 ChatGPT 頁面自動附加提示詞會造成 RESULT_CODE_HUNG 錯誤
// 解決方案: 只保留按鈕注入功能,使用者需要在來源頁面點擊「貼」按鈕
// 這樣可以避免與 ChatGPT 頁面的 JavaScript 衝突
