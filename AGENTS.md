# MIRA｜覓然 專案協作規範

## 必讀

- 開始 UI 或產品工作前先閱讀 [`DESIGN.md`](./DESIGN.md)。
- 不可任意更改品牌色；使用 `packages/design-tokens` 的 tokens。
- 共享介面放在 `packages/ui`，並以 React Native primitives 實作，保持 Expo 與 Next.js（React Native Web）行為一致。

## 產品範圍

- MIRA 是面向成年人的交友與社交平台；不可設計或宣稱服務未成年人。
- 三階探索配對是核心產品方向，但未實作的配對、帳號、訊息、Supabase 資料或互動不可用假功能冒充；若需求明確要求本機示範，必須清楚標示非正式服務與資料保存範圍。
- 每階段聚焦設計系統與明確指定功能，不一次擴大到完整產品。

## 工程規範

- 使用 TypeScript、pnpm workspace、Expo 與 Next.js 的既有架構。
- 跨平台共用元件須有明確 props、語意化角色、可讀標籤、禁用／錯誤狀態及鍵盤或輔助科技支援。
- 保持手機、平板、桌面可用；字體、色彩、間距、圓角沿用設計 tokens。
- 不加入未使用套件、假資料或隱藏錯誤的 fallback；設計系統變更須同步更新文件與測試。
- 每次完成工作都執行相關測試與型別檢查；回報未執行或失敗項目，不可宣稱通過。
