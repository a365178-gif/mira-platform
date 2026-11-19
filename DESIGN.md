# MIRA｜覓然 設計系統

## 品牌

- **英文名稱：** MIRA
- **中文名稱：** 覓然
- **標語：** 在茫茫人海，遇見剛好的你。
- **定位：** 成年異性交友與社交平台，核心特色為原創三階探索配對機制。
- **平台：** iOS、Android、Web。
- **視覺方向：** 深色、高級、浪漫、帶有克制的科技感。

Web 提供本機示範的 18+ 門檻與探索大廳導覽，也包含 Supabase Auth 會員頁面基礎。會員頁面只有在 Supabase 專案設定完成後才會啟用；可信任的成年驗證仍須另外接通，否則帳號不能啟用正式探索服務。

## Web 本機示範流程

- 首頁「開始探索」會進入基本資料與 18+ 門檻表單；出生年月日只在當下用於年齡計算，不會保存。
- 若未設定完整的 `NEXT_PUBLIC_SUPABASE_URL` 與 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`（或舊版 `NEXT_PUBLIC_SUPABASE_ANON_KEY`），表單以本機示範模式運作，資料只存於當前分頁的 `sessionStorage`。
- 三階探索大廳提供四位虛構示意對象與本機互動：第一階以氣場卡及三題價值觀計算示意契合度；第二階展示興趣、生活文字及無真實音訊的播放器，並接受本機破冰回覆；第三階展示插畫頭像與示意聊天室。這些操作不連接真實對象或服務，聊天室訊息只存在頁面記憶體。
- 各頁均明確標示「非正式驗證／非真實配對」，不宣稱產生真實候選人、推薦或互動。若已偵測 Supabase 設定但尚未實作正式整合，註冊表單會停用，不收集真實資料。

## 會員系統基礎

- `/sign-up` 與 `/login` 使用 Supabase Auth 電子郵件／密碼流程；未設定專案 URL 與公開金鑰時，表單會停用且不送出資料。
- `/members/me` 以登入者身分讀取本人資料。電子郵件保留在 Supabase Auth，不複製到公開資料表。
- 註冊頁只在瀏覽器當下檢查生日是否滿 18 歲，不傳送或保存生日。這不是可信任的成年驗證；新 profile 維持 `draft`，直到授權驗證流程確認成年並啟用。
- 性別與交友偏好存於僅本人可讀寫的 `member_private_details`。頭像放在 private `member-avatars` bucket，採擁有者 RLS 與 5 MB 圖片限制。
- 正式上線前仍須設定 Supabase Auth email confirmation，並實作可信任成年驗證的 provider callback 或人工審核流程。不可把 service-role key 放入瀏覽器。

## 品牌色彩

| Token | 色碼 | 建議用途 |
| --- | --- | --- |
| `MIDNIGHT_BLACK` | `#0B0B12` | 品牌主背景 |
| `DEEP_PURPLE` | `#6A3CCF` | 主要品牌識別與主要行動 |
| `DREAM_PINK` | `#FF6FB3` | 浪漫強調、次要行動 |
| `STAR_PURPLE` | `#B89BFF` | 亮點、焦點與互動提示 |
| `CARD_BACKGROUND` | `#191824` | 卡片與次層表面 |
| `TEXT_PRIMARY` | `#F5F2FA` | 主要文字 |
| `TEXT_SECONDARY` | `#A5A0B2` | 說明與輔助文字 |

唯一色彩來源為 `packages/design-tokens`。不可在畫面中另造或任意調整品牌色；跨平台元件優先使用 TypeScript token，Web 全域樣式使用 `colors.css` 變數。

## 基礎視覺尺度

- 間距使用 `spacing` 階梯（4、8、16、24、32、48）。
- 圓角使用 `radii` 階梯；按鈕、輸入框與卡片各自沿用共用尺度。
- 字級與字體族由 `typography` 集中管理；使用系統字體，繁體中文優先採作業系統合適的中文字型。
- 深色品牌主題是預設主題。表面層次以背景、細緻邊線與留白區分，不以大量陰影或螢光效果堆疊。

## 共用元件

`packages/ui` 使用 React Native primitives，供 Expo 原生 App 與 Next.js（React Native Web）共用。

- **Button：** `primary`、`secondary`、`ghost` 三種層級與 `small`、`medium`、`large` 尺寸。須保留原生鍵盤／觸控行為、禁用狀態及可見文字。
- **Card：** 用來組織相關內容，採用卡片背景、共用圓角與舒適內距。
- **Input：** 必須提供可理解的標籤；錯誤訊息須有文字內容，不可只用顏色表示。
- 共用元件不可將尚未串接的按鈕或輸入框偽裝成可用產品功能。

## Logo 規範

Logo 核心由兩道斜向幾何環交錯而成，象徵兩個不同的人。紫粉漸層由左上延伸至右下，青藍漸層由右上延伸至左下；四個交叉處以遮罩交替呈現穿插層次，中央為純白內凹四角星芒。青藍色 `LOGO_CYAN`、`LOGO_BLUE` 僅供此 Logo 漸層使用，不改變其他品牌色用途。`packages/ui/src/Logo.tsx` 管理 Logo 形式，圖形由 `LogoMark.native.tsx` 與 `LogoMark.web.tsx` 跨平台繪製；App Icon 的向量母版位於 `apps/mobile/assets/mira-app-icon.svg`，輸出的 PNG 由 Expo 設定載入。

支援以下使用形式：

1. **主 Logo（`primary`）：** 圖形置上，搭配 MIRA｜覓然與品牌標語。
2. **圖形 Logo（`mark`）：** 僅雙軌交錯環與中央四角星芒，用於狹小空間。
3. **橫式 Logo（`horizontal`）：** 圖形在左、品牌名稱與標語在右。
4. **單色 Logo（`monochrome`）：** 單一 `TEXT_PRIMARY` 色，使用於深色背景或單色輸出。
5. **App Icon（`app-icon`）：** 深色滿版底、置中的雙軌交錯環與四角星芒，不放文字或標語。

保持圖形比例，不可拆開或重排雙軌交錯順序；中央星芒保持置中。Logo 四周至少保留圖形寬度 1/5 的淨空；小尺寸優先使用圖形 Logo。避免將 Logo 放在低對比或複雜照片上。

## App Icon 規格

- 向量來源：`apps/mobile/assets/mira-app-icon.svg`。
- 商店交付：由向量來源輸出 **1024 × 1024 px、sRGB、完全不透明 PNG** 至 `apps/mobile/assets/mira-app-icon.png`，並由 Expo `app.json` 的 `icon` 欄位載入；背景使用 `MIDNIGHT_BLACK`，圖形置中並保留安全邊界。
- 不放文字、標語、外框或透明背景；不要在來源圖預先裁切圓角，由平台套用圖示遮罩。
- iOS、Android 各平台所需的 adaptive icon／商店尺寸，應由同一向量母版輸出，不可各自改色或重畫。
- Android adaptive icon 與商店所需的其他尺寸仍須由同一向量母版輸出，不可各自改色或重畫。

## 跨裝置版面與無障礙

- 手機、平板與桌面共用同一套元件；內容可自然換行，主要欄位保留可讀最大寬度，不以固定手機畫布限制 Web。
- 互動目標須有清楚文字、足夠觸控尺寸與鍵盤焦點提示；使用語意角色、可辨識標籤與有意義的錯誤訊息。
- 文字與背景需具良好對比；狀態不可只靠色彩表達。尊重平台字體縮放與減少動態效果的設定。

## 專案分層

- `apps/mobile`：Expo iOS／Android App 入口。
- `apps/web`：Next.js Web 入口，以 React Native Web 呈現共享 UI；Next.js 使用 Webpack 與 `.web.*` 平台副檔名解析共享元件。
- `packages/design-tokens`：品牌色彩、間距、圓角與字體尺度。
- `packages/ui`：跨平台 Logo、Button、Card、Input 與設計系統預覽首頁。
- `tests`：共用 tokens 與 UI 元件測試。
- Supabase 核心 Schema 已建立；Web 尚未接通帳號建立、可信任成年驗證、候選探索、推薦或配對服務。本機示範不可冒充正式功能。
