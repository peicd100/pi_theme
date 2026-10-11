# 0.2.0 驗證範圍

- 公開載入器只註冊 `/pi-theme`，無模型工具或 Markdown 轉換器，啟動不改主題。
- 中文選單只有兩項；取消／SDK／busy／queue／對話切換／其他主題變更不覆寫。
- 真正 AgentSession 與 Pi 1.1.0 官方 InteractiveThemeController：啟用、保存設定、重建 controller 模擬重啟、停用還原；branch 不改、模型請求為零、其他設定保留。
- 原主題選擇在套件外保存，更新／移除保留；舊 pi-theme-user.json 不改。
- 原子紀錄驗證涵蓋 CAS、foreign 修改不回退、busy lock、無效 schema／UTF-8／BOM／超限／symlink（Windows 無權限時分支不代表 OS ACL 驗證）。
- 官方 setter 已成功的提交紀錄不因後續對話切換移除。
- light/dark 配對、受信任專案 theme、缺失原紀錄／原主題先拒絕。
- 標題／連結 C7A0E8、錯誤 E07A86、工具錯誤背景 3A2329；正文與程式碼原配色保留。
- SDK 渲染 probe 顯示簡單公開 transformer 包色不能保持後續段落／串流，因此本版不註冊該 transformer、不承諾純插件完整模型背景。
- `check:package`／本機及公開 Git 安裝、列出、載入、更新、移除；含中文空白路徑，還原紀錄與舊自訂配色保留。

沒有人工實機截圖、即時模型或私人設定寫入；不代表所有終端機、Pi 版本或電力中斷狀況均驗證。選擇保存由 Pi 管理，不宣稱兩檔案交易原子性。
