# Pi 我的模板開關

版本：`0.2.0`；套件名稱仍為 `pi-theme-editor`，儲存庫 `peicd100/pi_theme`。

`/pi-theme` 只提供兩個選項：

- **啟用我的模板**：記錄原本主題，選用內建 `pi-theme-docker-look`，保存選擇。
- **停用並還原原本主題**：只有目前仍使用模板時，才還原啟用前的選擇。

Escape 取消，不改設定。沒有配色編輯、預覽、匯入／匯出等選單；安裝、啟動與更新不會自動切換主題。

## 配色

- 使用者訊息白底黑字。
- 標題與連結：淡紫 `#C7A0E8`。
- 錯誤文字：柔和玫瑰紅 `#E07A86`；工具錯誤背景：深紅灰 `#3A2329`。
- 模型正文沿用終端機原色，程式碼保留語法配色。

Pi 1.1.0 沒有模型正文專屬主題欄位，也沒有完整模型背景容器的公開接口。簡單 Markdown 轉換包色在段落／串流重繪後無法穩定維持，因此本版採用已同意的穩定降級：只改標題與連結，不註冊文字轉換器、不修改訊息或 Pi 本體、不加模型背景。

## 安裝與使用

需要 Node.js 22.19 以上、Git、Pi；整合驗證基準 Pi 1.1.0。

```sh
pi install git:github.com/peicd100/pi_theme@v0.2.0
```

或追蹤最新分支：

```sh
pi install git:github.com/peicd100/pi_theme
```

只選一種來源，不與本機同一插件重複載入。重新啟動，或等工作與訊息佇列清空後 `/reload`，再輸入 `/pi-theme`。

## 保存、還原與安全

主題選擇由官方 `ctx.ui.setTheme(name)` 保存，因此重啟仍沿用。還原紀錄在 `<agent-dir>/config/pi-theme/toggle.json`，不在套件內。更新／移除插件不刪此紀錄，也不覆蓋舊版 `<agent-dir>/themes/pi-theme-user.json`；舊自訂配色仍可透過 `/settings` 選用。

如果你另行換了主題，停用不會覆寫新的選擇；下一次啟用會記錄當時的主題。沒有原紀錄、原主題不再可用或紀錄損壞時不猜測，請用 `/settings` 手動處理。

官方接口不能完整還原 `light/dark` 自動配對；遇到自動配對時先拒絕，不偷偷降成單一主題。請先在 `/settings` 選單一主題，例如 `system`（仍會跟隨終端機）。受信任專案固定 `theme` 時也拒絕，以免全域保存後下次啟動又被覆蓋。

開關紀錄使用獨占鎖、雜湊核對、暫存檔與原子替換；失敗只回退仍屬自己的紀錄，不覆寫外部後續修改。只在 TUI 閒置、佇列清空時允許操作。選單等待期間對話／主題變更會取消；官方 setter 已成功則視為提交，不因之後切換對話刪掉還原紀錄。設定保存仍由 Pi 管理，不能承諾跨兩份檔案的斷電原子性；異常時以實際主題選擇為準，請 `/settings` 核對。

若中斷留下 `<agent-dir>/config/pi-theme/toggle.lock`，先確認原作業已終止，再人工處理；不以時間猜測自動接管。無模型請求、不改對話、ACM 或 Webhook。

## 限制與更新

主題不控制終端機整體背景；「跳到最新訊息」按鈕沒有獨立色彩欄位。256 色終端可能近似顯示。不保證不同終端機畫面相同。

```sh
pi update git:github.com/peicd100/pi_theme
pi remove git:github.com/peicd100/pi_theme
```

固定版本不跳到新標籤；移除前先停用模板或用 `/settings` 選其他主題。移除不刪使用者配色／還原紀錄。

```sh
npm ci --ignore-scripts
npm test
npm run check:package
npm run test:install
npm run test:remote
```

驗證使用隔離目錄、真正 SDK／官方主題 controller 與模擬介面，不操作個人設定或呼叫模型。公開 Git 測試需網路。詳見 `docs/RELEASING.md`。

`UNLICENSED`：公開儲存庫與 Git 安裝不代表一般開源授權。來源說明見 `NOTICE.md`。
