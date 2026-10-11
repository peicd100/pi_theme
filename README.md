# Pi 中文配色編輯器

版本：`0.1.0`；套件 `pi-theme-editor`；儲存庫 `peicd100/pi_theme`。

以 `/pi-theme` 開啟中文選單，調整 Pi 的 56 個介面配色與 3 個 HTML 匯出配色。內建 Docker 風格範本：使用者訊息白底黑字、柔和紅色錯誤、柔和綠色新增差異、紫色強調。

## 安裝

需要 Node.js 22.19 以上、Git、Pi；整合驗證以 Pi 1.1.0 為基準。

```sh
pi install git:github.com/peicd100/pi_theme@v0.1.0
```

或追蹤最新分支：

```sh
pi install git:github.com/peicd100/pi_theme
```

只選一種來源，不和本機同一插件重複載入。安裝後重新啟動，或等工具與訊息佇列完成後 `/reload`。

```text
/pi-theme
```

安裝或啟動插件不會自動替換目前主題；確認保存後才套用。

## 中文選單

- **調整顏色**：中文項目旁保留技術欄位名稱；輸入 `#RGB` 或 `#RRGGBB`。
- **預覽實際配色**：暫時套用草稿並顯示帶色文字；左右方向鍵換頁，Enter／Escape 返回原主題。不保存設定。
- **載入內建範本／恢復預設**：只重設草稿，需另行保存。
- **匯入主題 JSON**：指定本機檔案；第一版支援完整 HEX 主題，不支援變數、OKHSL、OKLCH 或 ANSI 索引。可匯入提供的 Docker 風格檔案。
- **匯出草稿 JSON**：建立指定的新 `.json`，不覆寫既有檔案、不套用。匯出名稱為 `pi-theme-export`。
- **保存並套用**：確認後原子保存並選用 `pi-theme-user`。
- **取消離開**：丟棄未保存草稿。

預覽、選單與匯入均不產生模型請求；不改對話內容、ACM 或通知設定。

## 保存與安全

自訂配色存於 `<agent-dir>/themes/pi-theme-user.json`，不是套件目錄。Pi 官方主題 API 保存選擇；套件更新不覆蓋使用者配色。內建範本名稱為 `pi-theme-docker-look`，可以在 `/settings` 選擇。

保存使用獨占鎖定、暫存檔、雜湊核對與原子替換。若草稿編輯期間檔案已變更，拒絕覆寫。套用失敗只在檔案仍是本次版本時回退；若 Pi 的主題選擇已部分更新，請用 `/settings` 核對，不能保證所有外部副作用都已回退。

對話切換、結束、忙碌或訊息佇列未清空時不保存。匯入拒絕連結、特殊檔案、超過 64 KiB、無效 UTF-8／BOM 與未知欄位。若保存鎖定因程式中斷留存，先確認原作業已終止，再人工處理 `<agent-dir>/config/pi-theme/save.lock`；不以時間猜測並自動接管。

## 限制

- Pi 主題不是 Windows Terminal 配色配置；終端機整體背景與色彩能力可能影響實際顯示。
- `export.pageBg` 等欄位只控制 HTML 匯出，不是終端機整體背景。
- 「跳到最新訊息」按鈕沒有獨立配色項目；本插件不修改 Pi 本體或注入非官方補丁。
- 主題色彩在 256 色終端會近似顯示；不保證與 Docker 截圖逐像素相同。
- 主題選擇遵循 Pi 的使用者／專案設定優先順序；專案覆寫可能影響下次啟動。
- 編輯器需要互動式 TUI；SDK／列印／RPC 不自動套用或寫入。

## 更新、移除與驗證

```sh
pi update git:github.com/peicd100/pi_theme
pi remove git:github.com/peicd100/pi_theme
```

固定版本不自動跳到新標籤。移除插件不刪除使用者主題；若不再使用，先在 `/settings` 選其他主題，再自行處理配色檔案。

```sh
npm ci --ignore-scripts
npm run check:package
npm test
npm run test:install
npm run test:remote
```

測試使用隔離目錄、官方 Pi 載入器與模擬介面，不改個人 Pi 或呼叫模型。公開安裝測試需網路。發布流程見 `docs/RELEASING.md`。

目前為 `UNLICENSED`；公開儲存庫與 Git 安裝不代表授予一般開源授權。來源說明見 `NOTICE.md`。
