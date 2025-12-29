# Financial Report to Gemini Extension

## 📊 Overview

「財報紅綠燈 to Gemini」is a browser extension that streamlines financial report analysis by seamlessly integrating with Gemini AI and ChatGPT. It automatically transfers financial data to AI platforms and provides intelligent stock number linking.

## ✨ Features

### 🎯 Core Functionality
- **One-Click Transfer**: Right-click context menu to send financial data directly to Gemini AI
- **Auto-Paste**: Automatically pastes content into Gemini/ChatGPT input fields
- **Smart Stock Links**: Automatically converts 4-digit stock numbers into clickable links to Financial Report Dashboard
- **Customizable Prompts**: Configure your own analysis prompts in the options page
- **Multi-Platform Support**: Works with both Gemini and ChatGPT

### 🔧 Settings
- Custom prompt templates for financial analysis
- Toggle stock number auto-linking
- Debug mode for troubleshooting
- Export/Import prompt configurations

## 📦 Installation

### From Microsoft Edge Add-ons Store
1. Visit the [Edge Add-ons Store](https://microsoftedge.microsoft.com/addons/)
2. Search for "財報紅綠燈 to Gemini"
3. Click "Get" or "Install"

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Edge and navigate to `edge://extensions/`
3. Enable "Developer mode" in the bottom-left corner
4. Click "Load unpacked"
5. Select the extension directory

## 🎮 Usage

### Method 1: Context Menu
1. Select financial data on any webpage
2. Right-click and choose "將內容傳送到 Gemini"
3. The extension will automatically open Gemini and paste the content

### Method 2: Direct Element Access
1. Right-click on a text input field containing financial data
2. Select "將內容傳送到 Gemini"
3. Content will be extracted and sent automatically

### Stock Number Auto-Linking
- Stock numbers (4-digit format) in Gemini responses are automatically converted to links
- Click any stock number to view detailed reports on Financial Report Dashboard
- Toggle this feature in extension settings if needed

## 🔒 Privacy & Security

- **Local Storage Only**: All settings and data are stored locally in your browser
- **No Data Collection**: We do not collect, store, or transmit any personal information
- **No External Servers**: No user data is sent to our servers
- **Open Source**: Code is transparent and available for review

For detailed privacy information, please see our [Privacy Policy](privacy_policy.html).

## 🛠️ Permissions Explained

| Permission | Purpose |
|------------|---------|
| `storage` | Save your settings and preferences locally |
| `activeTab` | Read content from the current tab when you trigger the extension |
| `contextMenus` | Add "Send to Gemini" option to right-click menu |
| `<all_urls>` | Allow content extraction from any webpage (only when you trigger it) |

## 📋 Default Analysis Prompt

The extension comes with a comprehensive financial analysis prompt that covers:
- Company business scope and major customers
- Parent/subsidiary company relationships
- Seasonal business patterns
- Cash flow analysis (Operating Cash, Operating Profit, Free Cash Flow)
- Recent stock price movement analysis

You can customize this prompt in the extension's options page.

## 🌐 Supported Platforms

- ✅ Gemini (https://gemini.google.com)
- ✅ ChatGPT (https://chatgpt.com)
- ✅ Links to Financial Report Dashboard (https://gd.myftp.org)

## 📸 Screenshots

### Context Menu Integration
Right-click to send financial data directly to AI platforms.

### Auto-Paste Functionality
Content is automatically pasted into Gemini/ChatGPT input fields.

### Stock Number Linking
Four-digit stock numbers automatically become clickable links.

### Settings Page
Customize your analysis prompts and toggle features.

## 🔧 Technical Details

### Manifest Version
This extension uses Manifest V3, the latest Chrome Extension standard.

### File Structure
```
gemini-autopaste/
├── manifest.json          # Extension configuration
├── background.js          # Background service worker
├── content.js            # Content script for Gemini/ChatGPT
├── source_content.js     # Content script for source pages
├── options.html          # Settings page
├── options.js            # Settings page logic
├── privacy_policy.html   # Privacy policy document
├── icons/                # Extension icons
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
└── 使用說明.html         # User guide (Traditional Chinese)
```

## 🐛 Troubleshooting

### Content not pasting?
1. Check that you're on Gemini or ChatGPT's website
2. Ensure the page has fully loaded
3. Try refreshing the page
4. Enable debug mode in settings to see console logs

### Stock links not appearing?
1. Ensure "Stock Number Auto-Linking" is enabled in settings
2. Stock numbers must be in 4-digit format (e.g., 2330, 2317)
3. Years and dates (e.g., 2024年) are automatically excluded

### Settings not saving?
1. Check browser's storage permissions
2. Try clearing browser cache and reloading the extension

## 📝 Changelog

### Version 1.0 (2025-12-29)
- Initial release
- Gemini and ChatGPT integration
- Stock number auto-linking
- Customizable prompts
- Debug mode
- Traditional Chinese support

## 🤝 Contributing

This is currently a closed-source project. For bug reports or feature suggestions, please use the support feature in the Edge Add-ons Store.

## 📄 License

© 2025 財報紅綠燈開發團隊. All rights reserved.

## 🔗 Links

- **Homepage**: https://gd.myftp.org
- **Support**: Via Edge Add-ons Store
- **Privacy Policy**: [privacy_policy.html](privacy_policy.html)

## 💡 Tips

1. **Customize Your Prompts**: The default prompt is comprehensive, but you can tailor it to your specific analysis needs
2. **Use with Both Platforms**: Try the extension with both Gemini and ChatGPT to see which works better for your workflow
3. **Keyboard Shortcuts**: Consider setting up keyboard shortcuts in Edge for faster access (edge://extensions/shortcuts)
4. **Export Your Configuration**: Use the download feature in settings to backup your custom prompts

---

**Made with ❤️ for financial analysis enthusiasts**
