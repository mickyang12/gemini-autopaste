// ============================================
// 偵錯Log控制機制 (改良版)
// ============================================
// 使用包裝函數確保在讀取設定後才執行主要邏輯
(function() {
  const originalLog = console.log;
  let debugEnabled = true; // 預設為 true
  
  // 建立一個包裝的 log 函數
  const wrappedLog = function(...args) {
    if (debugEnabled) {
      originalLog.apply(console, args);
    }
  };
  
  // 立即替換 console.log
  console.log = wrappedLog;
  
  // 讀取設定
  chrome.storage.local.get(['debugEnabled'], (result) => {
    // 更新 debugEnabled 狀態
    debugEnabled = result.debugEnabled !== false;
    
    // 如果啟用除錯,輸出一條確認訊息
    if (debugEnabled) {
      originalLog("Gemini AutoPaste: Debug logging enabled");
    }
  });
})();

console.log("Gemini AutoPaste: Content script loaded");

// ============================================
// 全域變數: 防止重複執行標記
// ============================================
// 由於 content script 可能被多次注入,使用此標記防止重複執行
let hasExecuted = false;

// ============================================
// 主函數: 自動貼上功能
// ============================================
// 功能說明:
// 1. 檢查是否有待貼上的文字 (從 Chrome Storage 讀取)
// 2. 驗證是否為按鈕觸發 (autoPasteEnabled 標記)
// 3. 檢查內容是否只有提示詞 (避免貼上空內容)
// 4. 尋找 Gemini 輸入框並貼上文字
// 5. 自動點擊送出按鈕
function autoPaste() {
  // ============================================
  // 步驟 0: 檢查網域並決定貼上策略
  // ============================================
  const currentUrl = window.location.href;
  const isGemini = currentUrl.includes('gemini.google.com');
  const isChatGPT = currentUrl.includes('chatgpt.com');
  
  // 如果不是 Gemini 或 ChatGPT,直接返回
  if (!isGemini && !isChatGPT) {
    console.log("Gemini AutoPaste: Not on Gemini or ChatGPT domain, skipping...");
    console.log("Gemini AutoPaste: Current URL:", currentUrl);
    return;
  }
  
  console.log("Gemini AutoPaste: Detected domain -", isGemini ? "Gemini" : "ChatGPT");
  
  // ============================================
  // 步驟 1: 檢查是否已經執行過
  // ============================================
  if (hasExecuted) {
    console.log("Gemini AutoPaste: Already executed, skipping...");
    return; // 已執行過,直接返回
  }
  hasExecuted = true; // 標記為已執行
  
  console.log("Gemini AutoPaste: Content script loaded, checking storage...");
  
  // ============================================
  // 步驟 2: 從 Chrome Storage 讀取待貼上的文字和標記
  // ============================================
  chrome.storage.local.get(["pendingText", "autoPasteEnabled"], (result) => {
    // 檢查是否有待貼上的文字
    if (!result.pendingText) {
      console.log("Gemini AutoPaste: No pending text found in storage.");
      return; // 沒有待貼上的文字,直接返回
    }
    
    // 檢查是否為按鈕觸發 (避免手動開啟 Gemini 時自動貼上)
    if (!result.autoPasteEnabled) {
      console.log("Gemini AutoPaste: Manual open detected, skipping auto-paste.");
      console.log("Gemini AutoPaste: (autoPasteEnabled is not set or false)");
      return; // 不是按鈕觸發,直接返回
    }
    
    // 有文字且允許自動貼上
    const textToPaste = result.pendingText;
    console.log("Gemini AutoPaste: Found text to paste:", textToPaste);
    console.log("Gemini AutoPaste: autoPasteEnabled is true, proceeding...");
    console.log("Gemini AutoPaste: Current domain check - isGemini:", isGemini, "isChatGPT:", isChatGPT);
    
    // ============================================
    // 步驟 3: 讀取附加提示詞,檢查是否只有提示詞沒有原始內容
    // ============================================
    chrome.storage.local.get(['additionalPrompt'], (promptResult) => {
      // 取得附加提示詞 (如果沒有則使用舊的預設值,保持向下相容)
      const additionalPrompt = promptResult.additionalPrompt || `比較最近兩季營運現金、營業利益、自由現金 三項 🟢正數 與 🔴負數 的狀態關係(意涵)，做成表格，欄位為 "項目"、"Qx"、"Qx-1""意涵"，最後在表格外用文字簡述這個表格結論.

說明近10天股價漲跌的原因。`;
      
      // 詳細記錄比對過程 (用於除錯)
      console.log("=== 開始比對內容 ===");
      console.log("textToPaste 原始長度:", textToPaste.length);
      console.log("textToPaste trim 後長度:", textToPaste.trim().length);
      console.log("additionalPrompt 原始長度:", additionalPrompt.length);
      console.log("additionalPrompt trim 後長度:", additionalPrompt.trim().length);
      console.log("textToPaste 前 50 字元:", textToPaste.substring(0, 50));
      console.log("additionalPrompt 前 50 字元:", additionalPrompt.substring(0, 50));
      console.log("長度是否相等:", textToPaste.trim().length === additionalPrompt.trim().length);
      console.log("內容是否相等:", textToPaste.trim() === additionalPrompt.trim());
      console.log("=== 比對結束 ===");
      
      // 如果貼上內容長度等於附加提示詞長度,或內容完全相同
      // 表示沒有原始內容,只有提示詞,不要貼上
      if (textToPaste.trim().length === additionalPrompt.trim().length || 
          textToPaste.trim() === additionalPrompt.trim()) {
        console.log("❌ Gemini AutoPaste: Content is only the prompt (no original content), skipping paste.");
        
        // 清除 storage,避免下次開啟時重複檢查
        chrome.storage.local.remove(["pendingText", "autoPasteEnabled"]);
        return; // 不貼上,直接返回
      }
      
      console.log("✅ Gemini AutoPaste: Content has original text, proceeding with paste...");
      
      // ============================================
      // 步驟 4: 根據網域選擇不同的貼上策略
      // ============================================
      
      if (isChatGPT) {
        // ============================================
        // ChatGPT 貼上策略 (改良版 - 尋找可見編輯器)
        // ============================================
        console.log("✅ Gemini AutoPaste: Using ChatGPT paste strategy...");
        console.log("Gemini AutoPaste: Will attempt to paste after 1.5 second delay...");
        
        // 延遲執行,確保頁面已完全載入
        setTimeout(() => {
          console.log("Gemini AutoPaste: ChatGPT - Delay complete, searching for editor...");
          
          // 策略 1: 尋找可見的 contenteditable 元素 (ChatGPT 的實際編輯器)
          let editor = document.querySelector('[contenteditable="true"]');
          
          // 策略 2: 如果沒找到,嘗試尋找特定的編輯器元素
          if (!editor) {
            editor = document.querySelector('#prompt-textarea');
          }
          
          // 策略 3: 尋找任何可見的 textarea
          if (!editor) {
            const textareas = document.querySelectorAll('textarea');
            for (let ta of textareas) {
              // 檢查是否可見 (不是 display: none)
              const style = window.getComputedStyle(ta);
              if (style.display !== 'none' && style.visibility !== 'hidden') {
                editor = ta;
                break;
              }
            }
          }
          
          console.log("Gemini AutoPaste: ChatGPT - editor element:", editor);
          console.log("Gemini AutoPaste: ChatGPT - editor found:", !!editor);
          
          if (editor) {
            console.log("✅ Gemini AutoPaste: ChatGPT editor found!");
            console.log("Gemini AutoPaste: ChatGPT - Editor tag:", editor.tagName);
            console.log("Gemini AutoPaste: ChatGPT - Editor contentEditable:", editor.contentEditable);
            console.log("Gemini AutoPaste: ChatGPT - Text to paste length:", textToPaste.length);
            
            try {
              // 聚焦編輯器
              editor.focus();
              console.log("Gemini AutoPaste: ChatGPT - Editor focused");
              
              // 根據編輯器類型使用不同的貼上方法
              if (editor.contentEditable === 'true') {
                // ContentEditable 元素 - 使用 innerText 或 textContent
                console.log("Gemini AutoPaste: ChatGPT - Using contentEditable paste method");
                
                // 清空現有內容
                editor.innerText = '';
                
                // 設定新內容
                editor.innerText = textToPaste;
                
                console.log("Gemini AutoPaste: ChatGPT - Content set via innerText");
              } else {
                // Textarea 元素 - 使用 value
                console.log("Gemini AutoPaste: ChatGPT - Using textarea paste method");
                editor.value = textToPaste;
                console.log("Gemini AutoPaste: ChatGPT - Content set via value");
              }
              
              // 觸發多種事件,確保 ChatGPT 偵測到內容變化
              const events = ['input', 'change', 'keyup', 'keydown'];
              events.forEach(eventType => {
                editor.dispatchEvent(new Event(eventType, { bubbles: true }));
              });
              console.log("Gemini AutoPaste: ChatGPT - Events dispatched");
              
              // 再次聚焦
              editor.focus();
              
              console.log("✅ Gemini AutoPaste: Text pasted to ChatGPT successfully!");
              
              // 清除 storage
              chrome.storage.local.remove(["pendingText", "autoPasteEnabled"], () => {
                console.log("Gemini AutoPaste: Storage cleared.");
              });
              
              // ChatGPT 不自動送出,讓使用者檢查後手動送出
              console.log("💡 Gemini AutoPaste: ChatGPT paste complete. User can review and submit manually.");
            } catch (error) {
              console.error("❌ Gemini AutoPaste: Error during ChatGPT paste:", error);
            }
          } else {
            console.error("❌ Gemini AutoPaste: ChatGPT editor not found!");
            console.log("Gemini AutoPaste: Available contenteditable elements:", document.querySelectorAll('[contenteditable]').length);
            console.log("Gemini AutoPaste: Available textareas:", document.querySelectorAll('textarea').length);
            console.log("Gemini AutoPaste: Page URL:", window.location.href);
          }
        }, 1500); // 延遲 1.5 秒
        
      } else {
        // ============================================
        // Gemini 貼上策略 (原有邏輯)
        // ============================================
        console.log("Gemini AutoPaste: Using Gemini paste strategy...");
        
        let attempts = 0; // 嘗試次數計數器
        
        // 使用 setInterval 定期檢查輸入框是否出現
        // (因為 Gemini 頁面是動態載入的,需要等待 DOM 元素出現)
        const checkExist = setInterval(() => {
          attempts++;
          
          // 嘗試尋找 Gemini 輸入框 (支援多種可能的選擇器)
          const editor = document.querySelector('.rich-textarea p, [contenteditable="true"], .input-area textarea');
          
          // 如果找到輸入框
          if (editor) {
            clearInterval(checkExist); // 停止定期檢查
            console.log("Gemini AutoPaste: Editor found!", editor);
            
            // 聚焦到輸入框
            editor.focus();
            
            // ============================================
            // 貼上文字 (嘗試兩種方法)
            // ============================================
          try {
            console.log("Gemini AutoPaste: Pasting text...");
            
            // 方法 1: 使用 execCommand (較舊的 API,但相容性較好)
            const success = document.execCommand('insertText', false, textToPaste);
            console.log("Gemini AutoPaste: execCommand success:", success);
            
            // 如果 execCommand 失敗,使用備用方法
            if (!success) {
              console.log("Gemini AutoPaste: execCommand returned false, falling back to innerText");
              editor.innerText = textToPaste; // 方法 2: 直接設定 innerText
            }
          } catch (e) {
            // 如果 execCommand 拋出錯誤,使用備用方法
            console.error("Gemini AutoPaste: execCommand error:", e);
            editor.innerText = textToPaste;
          }
          
          // 觸發 input 和 change 事件,讓 Gemini 知道內容已更新
          editor.dispatchEvent(new Event('input', { bubbles: true }));
          editor.dispatchEvent(new Event('change', { bubbles: true }));

          // ============================================
          // 清除 storage 避免重複貼上
          // ============================================
          chrome.storage.local.remove(["pendingText", "autoPasteEnabled"], () => {
            console.log("Gemini AutoPaste: pendingText and autoPasteEnabled removed from storage");
            
            // 驗證是否真的清除成功
            chrome.storage.local.get(["pendingText", "autoPasteEnabled"], (result) => {
              if (result.pendingText || result.autoPasteEnabled) {
                console.error("Gemini AutoPaste: Failed to clear storage!");
              } else {
                console.log("Gemini AutoPaste: Verified - storage cleared successfully");
              }
            });
          });

          // ============================================
          // 步驟 5: 自動點擊送出按鈕
          // ============================================
          // 延遲 800ms 後點擊送出按鈕 (等待 Gemini 處理輸入)
          setTimeout(() => {
            // 尋找送出按鈕 (支援多種語言的 aria-label)
            const sendBtn = document.querySelector('button[aria-label*="發送"], button[aria-label*="Send"], button[aria-label*="Submit"], .send-button');
            
            if (sendBtn) {
              console.log("Gemini AutoPaste: Send button found, disabled state:", sendBtn.disabled);
              
              // 如果按鈕未被停用,點擊送出
              if (!sendBtn.disabled) {
                console.log("Gemini AutoPaste: Clicking send button");
                sendBtn.click();
              }
            } else {
              console.error("Gemini AutoPaste: Could not find send button");
            }
          }, 800);
        } else {
          // 如果還沒找到輸入框,每 10 次嘗試記錄一次
          if (attempts % 10 === 0) {
            console.log(`Gemini AutoPaste: Searching for editor (Attempt ${attempts})...`);
          }
        }

        // 如果嘗試超過 60 次 (30 秒),停止檢查
        if (attempts > 60) {
          clearInterval(checkExist);
          console.error("Gemini AutoPaste: Timeout - Editor not found after 30 seconds.");
        }
      }, 500); // 每 500ms 檢查一次
    } // 結束 Gemini 貼上策略的 else 區塊
    }); // 關閉 additionalPrompt callback
  }); // 關閉 pendingText callback
}

// ============================================
// 執行主函數
// ============================================
// 當 content script 載入時立即執行
autoPaste();

// ============================================
// 功能: 股票代號自動轉換為超連結
// ============================================
// 目的: 在 Gemini 回應中偵測四位數字,並轉換為財報紅綠燈連結
// 觸發時機: Gemini 回應內容變化時

// ============================================
// 全域變數: 記錄已處理的元素
// ============================================
// 使用 WeakSet 避免記憶體洩漏,記錄已轉換過的元素
let processedElements = new WeakSet();

/**
 * 股票代號轉換主函數
 * 功能:
 * 1. 檢查是否啟用股票代號連結功能
 * 2. 尋找 Gemini 回應區域
 * 3. 將四位數字轉換為超連結
 */
function initStockLinkConverter() {
  // ============================================
  // 步驟 1: 讀取開關狀態
  // ============================================
  chrome.storage.local.get(['stockLinkEnabled'], (result) => {
    // 預設為 true (啟用股票代號連結)
    const stockLinkEnabled = result.stockLinkEnabled !== false;
    
    console.log('Stock link converter enabled:', stockLinkEnabled);
    
    // 如果功能未啟用,直接返回
    if (!stockLinkEnabled) {
      console.log('Stock link converter is disabled, skipping...');
      return;
    }
    
    // ============================================
    // 步驟 2: 啟動 MutationObserver 監聽 Gemini 回應
    // ============================================
    console.log('Stock link converter is enabled, starting observer...');
    
    // 建立 MutationObserver 監聽 DOM 變化
    const observer = new MutationObserver((mutations) => {
      // 對每個變化進行處理
      mutations.forEach((mutation) => {
        // 只處理新增的節點
        mutation.addedNodes.forEach((node) => {
          // 只處理元素節點 (忽略文字節點等)
          if (node.nodeType === Node.ELEMENT_NODE) {
            // 對新增的元素執行股票代號轉換
            convertStockNumbers(node);
          }
        });
      });
    });
    
    // 開始監聽整個 body 的 DOM 變化
    observer.observe(document.body, {
      childList: true,  // 監聽子節點的新增/移除
      subtree: true     // 監聽所有後代節點
    });
    
    // ============================================
    // 步驟 3: 對現有內容執行一次轉換
    // ============================================
    // 處理頁面載入時已存在的 Gemini 回應
    setTimeout(() => {
      convertStockNumbers(document.body);
    }, 1000); // 延遲 1 秒確保頁面已載入
  });
}

/**
 * 股票代號轉換函數
 * 功能: 將元素中的四位數字轉換為超連結
 * 參數: element - 要處理的 DOM 元素
 */
function convertStockNumbers(element) {
  // ============================================
  // 步驟 1: 防止重複處理
  // ============================================
  // 檢查元素是否已處理過
  if (processedElements.has(element)) {
    return; // 已處理,跳過
  }
  
  // 標記為已處理
  processedElements.add(element);
  
  // ============================================
  // 步驟 2: 尋找所有文字節點
  // ============================================
  // 使用 TreeWalker 遍歷所有文字節點
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT, // 只顯示文字節點
    {
      acceptNode: function(node) {
        // 過濾條件:
        // 1. 父節點不是 <a> 標籤 (避免重複處理已經是連結的文字)
        // 2. 父節點不是 <script> 或 <style> 標籤
        const parentTag = node.parentNode.tagName;
        if (parentTag === 'A' || parentTag === 'SCRIPT' || parentTag === 'STYLE') {
          return NodeFilter.FILTER_REJECT;
        }
        // 檢查文字內容是否包含四位數字
        if (/\b\d{4}\b/.test(node.textContent)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  // ============================================
  // 步驟 3: 收集需要處理的文字節點
  // ============================================
  const textNodes = [];
  let currentNode;
  while (currentNode = walker.nextNode()) {
    textNodes.push(currentNode);
  }
  
  // ============================================
  // 步驟 4: 轉換四位數字為超連結
  // ============================================
  textNodes.forEach((textNode) => {
    const text = textNode.textContent;
    
    // ============================================
    // 正則表達式: 匹配四位數字 (排除年份格式)
    // ============================================
    // 排除以下格式 (可能是西元年):
    // - xxxx. (例如: 2024.)
    // - xxxx- (例如: 2024-)
    // - xxxx/ (例如: 2024/)
    // - xxxx, (例如: 2024,)
    // - xxxx 年 (例如: 2024 年)
    // 
    // 使用負向後顧斷言 (?<!...) 和負向前瞻斷言 (?!...)
    // 確保四位數字前後不是特定字元
    const stockPattern = /(?<![.\-/,])\b(\d{4})\b(?![.\-/,年])/g;
    
    // 檢查是否有匹配
    if (!stockPattern.test(text)) {
      return; // 沒有四位數字,跳過
    }
    
    // 重置正則表達式的 lastIndex (因為上面的 test 會改變 lastIndex)
    stockPattern.lastIndex = 0;
    
    // ============================================
    // 步驟 5: 建立新的 HTML 內容
    // ============================================
    // 將文字分割並替換為超連結
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match;
    
    // 遍歷所有匹配的四位數字
    while ((match = stockPattern.exec(text)) !== null) {
      const stockNumber = match[1]; // 取得四位數字
      const matchIndex = match.index; // 取得匹配位置
      
      // 添加匹配之前的文字
      if (matchIndex > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.substring(lastIndex, matchIndex))
        );
      }
      
      // 建立超連結
      const link = document.createElement('a');
      link.href = `https://gd.myftp.org/lb/lh.asp?stockno=${stockNumber}`;
      link.target = '_blank'; // 在新分頁開啟
      link.textContent = stockNumber;
      link.style.color = '#A8C7FA'; // 淡藍色
      link.style.textDecoration = 'none'; // 移除底線
      link.style.cursor = 'pointer'; // 滑鼠指標
      
      // 滑鼠懸停時顯示底線
      link.addEventListener('mouseenter', () => {
        link.style.textDecoration = 'underline';
      });
      link.addEventListener('mouseleave', () => {
        link.style.textDecoration = 'none';
      });
      
      fragment.appendChild(link);
      
      lastIndex = matchIndex + stockNumber.length;
    }
    
    // 添加剩餘的文字
    if (lastIndex < text.length) {
      fragment.appendChild(
        document.createTextNode(text.substring(lastIndex))
      );
    }
    
    // ============================================
    // 步驟 6: 替換原始文字節點
    // ============================================
    textNode.parentNode.replaceChild(fragment, textNode);
    
    console.log('Stock numbers converted in text:', text);
  });
}

// ============================================
// 啟動股票代號轉換功能
// ============================================
// 延遲啟動,確保頁面已完全載入
setTimeout(() => {
  initStockLinkConverter();
}, 2000); // 延遲 2 秒
