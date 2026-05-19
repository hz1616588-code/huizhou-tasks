# 匯洲工單系統 - 安裝設定步驟（給小瀾）

> 這份文件帶你從零到上線。**沒有任何技術背景也能照著做。**
> 全程不用裝軟體、不用付錢，大概 15 分鐘可以全部完成。

---

## ⚠️ 若系統已上線後又升級了，請重跑 setup.sql

setup.sql 是**可重複執行**的，新增功能後（例如加上對話功能）你只要：

1. Supabase Dashboard → SQL Editor → New query
2. 把最新的 `setup.sql` 整份貼進去 → Run
3. 看到 Success 就完成升級
4. 三邊員工分別在瀏覽器**強制重整**（Ctrl + Shift + R）載入新版前端

**現有資料不會被清掉**，只會補上缺的表 / 欄位 / 索引。

---

## 階段一：開 Supabase 雲端資料庫

### 1. 註冊 Supabase

1. 打開 [https://supabase.com](https://supabase.com)
2. 右上角點 **Start your project**
3. 用匯洲的 Gmail 或 GitHub 帳號註冊（建議用公司信箱）

### 2. 建立專案

1. 進入後點 **New Project**
2. 填寫：
   - **Name**：`huizhou-tasks`
   - **Database Password**：隨便設一個（記下來，雖然之後幾乎不用）
   - **Region**：`Northeast Asia (Tokyo)` ← 一定要選這個，離台灣最近
   - **Pricing Plan**：`Free`（免費方案夠用）
3. 點 **Create new project**
4. 等大概 2 分鐘讓專案建立完成

### 3. 啟用 pg_cron（先做這步比較順）

1. 左側選單點 **Database** → **Extensions**
2. 搜尋 `pg_cron`
3. 點旁邊的開關啟用
4. （若不啟用也沒關係，setup.sql 會自動略過 cron，但舊資料就不會自動清理）

### 4. 跑 SQL 建立資料表

1. 左側選單點 **SQL Editor**
2. 點右上 **+ New query**
3. 用文字編輯器打開 `setup.sql`，**複製全部內容**
4. 貼到 Supabase 的 SQL Editor
5. 點右下 **Run**（綠色按鈕）
6. 看到 "Success" 就完成了。本 SQL 可重複執行，**之後若有改 schema 需要重跑也不會壞**

### 5. 建立照片儲存空間

1. 左側選單點 **Storage**
2. 點 **New bucket**
3. **Name**：`task-photos`
4. **Public bucket**：✅ 勾選
5. 點 **Create bucket**

### 6. 取得連線網址跟金鑰

1. 左側選單最下面點 ⚙️ **Settings**（小齒輪）
2. 點 **API**
3. 你會看到兩個關鍵資訊（**複製下來**）：
   - **Project URL**：類似 `https://abcdefgh.supabase.co`
   - **Project API keys** 下方的 **anon public**：類似 `eyJhbGc...` 一長串

---

## 階段二：把金鑰填進系統

1. 用記事本（或 VS Code）打開 `config.js`
2. 找到這兩行：

```js
const SUPABASE_URL = 'https://請填入你的Supabase網址.supabase.co';
const SUPABASE_ANON_KEY = '請填入你的anon-public-key';
```

3. 把單引號 `'` 之間的內容替換成你剛剛複製的兩個值
4. 存檔

---

## 階段三：上 GitHub Pages（讓三邊都能用）

> 如果你還不確定要不要公開上線，可以先在本機開 `cs.html` 自己玩。
> 但要讓中壢／龍潭兩邊用，就必須放到網路上。

### 1. 建 GitHub repo

1. 用瀏覽器登入 [github.com](https://github.com)（沒帳號就先註冊匯洲帳號）
2. 右上 + → **New repository**
3. **Repository name**：`huizhou-tasks`
4. **Private**：✅ 勾選（建議私人）
5. 點 **Create repository**

### 2. 上傳檔案

最簡單的方法：

1. 在 GitHub 新建好的 repo 頁面，點 **uploading an existing file**
2. 把 `huizhou-tasks` 資料夾裡的 7 個檔案**全部拖進去**：
   - cs.html
   - warehouse.html
   - admin.html
   - config.js
   - common.css
   - common.js
   - README.md
   - （setup.sql 和 SETUP.md 是給你自己用的，可不上傳）
3. 下方填 commit message（例：「上線」）
4. 點 **Commit changes**

### 3. 啟用 GitHub Pages

1. repo 頁面點 **Settings**
2. 左側選 **Pages**
3. **Source**：`Deploy from a branch`
4. **Branch**：`main` / `/ (root)` → **Save**
5. 等 1-2 分鐘，最上面會出現綠色框：「Your site is live at https://你帳號.github.io/huizhou-tasks/」
6. 你的網址就是：
   - **客服**：`https://你帳號.github.io/huizhou-tasks/cs.html`
   - **倉管**：`https://你帳號.github.io/huizhou-tasks/warehouse.html`
   - **管理員（你）**：`https://你帳號.github.io/huizhou-tasks/admin.html`

---

## 階段四：三邊設定

### 中壢客服（元寶）

1. 用 Chrome / Edge 打開 `cs.html` 網址
2. 第一次進入會跳「請選擇您的身份」→ 選 **🔵 中壢客服 元寶**
3. 瀏覽器跳出「要允許桌面通知嗎」→ 點 **允許**
4. 把這個分頁「釘選」（右鍵分頁 → 釘選）
5. 完成

### 龍潭客服（純純）

1. 同上，網址是 `cs.html`
2. 身份選 **🟢 龍潭客服 純純**

### 龍潭倉管（小梁、倉管大哥）

1. 打開 `warehouse.html` 網址
2. 第一次進入選自己的身份
3. 允許桌面通知 + 釘選分頁

### 管理員（小瀾）

1. 打開 `admin.html` 網址
2. 身份選 **🟣 管理員 小瀾**

---

## 之後新人來怎麼辦？

員工管理（新增、停用、改名）統一在 **Supabase Table Editor** 操作。為什麼不在 admin.html 做？因為本系統 anon key 沒有密碼保護，若把員工管理放網頁上，任何拿到網址的人都能透過瀏覽器 console 把自己改成管理員。改在 Supabase Dashboard 用 service_role 操作較安全。

### 操作步驟

1. 進入 [supabase.com/dashboard](https://supabase.com/dashboard) 登入
2. 選 `huizhou-tasks` 專案
3. 左側 **Table Editor** → 點 `users` 表
4. **新增**：右上 **Insert** → **Insert row**
   - `name`：員工姓名
   - `location`：四選一
     - `zhongli_cs` = 中壢客服
     - `longtan_cs` = 龍潭客服
     - `longtan_wh` = 龍潭倉管
     - `admin` = 管理員
   - `active`：預設 true（在職）
   - 其他欄位留空，按 Save
5. **停用**（離職）：點該列任一格 → 把 `active` 改成 `false` → Enter 存檔
   - ⚠️ 為了保留歷史紀錄，不要直接刪除員工
6. **改名**：直接點 `name` 欄改字 → Enter
7. 員工立刻可以用新身份打開頁面，不需重整網站

admin.html 的「員工清單」分頁可以即時看到目前所有員工狀態（唯讀）。

---

## 安全模型聲明（重要，請小瀾務必看完）

本系統採「**內網信任 + 網址不外流**」模型，**不是真正的權限控制**：

| 項目 | 真實狀況 |
|---|---|
| 客服 / 倉管 / 管理員 | 只是 UI 上的分流，**不是密碼權限** |
| 任何人取得網址 | 都能進入對應頁面、選任一身份 |
| 任何人取得網址 | 都能透過瀏覽器 console 用 anon key 讀寫 tasks、notification_reads |
| 唯一鎖死的 | `users` 表（anon 只能讀不能寫）— 所以員工管理必須走 Supabase Dashboard |

### 這代表什麼

- ✅ 適合：5 人內部團隊、網址只給自己人、信任所有員工
- ❌ 不適合：對外開放、有離職員工要立刻封鎖存取、合規要求稽核軌跡
- 🔒 加強建議（未來可做）：
  - 加 Cloudflare Access 或 Vercel Password Protect（最簡單）
  - 改用 Supabase Auth 真正登入（需重寫頁面，工程量大）

### 員工離職時要做的事

1. 進 Supabase Table Editor → `users` 表 → 把該員工 `active` 改 false
2. **網址沒換 → 該員工仍可以打開頁面**，但選不到自己的身份（active=false 不會出現）
3. 若想要更嚴格：把該員工的舊 `huizhou_user_id` 從他電腦的 localStorage 清掉，但他若記得網址仍可重新選別人
4. 真的擔心 → 換掉網址（建新的 GitHub Pages repo）或開啟 Cloudflare Access

---

## 常見問題

### Q1：頁面開不起來，跳出「無法連線到資料庫」

→ 檢查 `config.js` 裡的 URL 跟 KEY 是否正確（記得**不要把單引號弄掉**）。

### Q2：照片上傳失敗

→ 檢查 Storage 的 `task-photos` bucket 是否設定為 **Public**。

### Q3：收不到即時通知

→ 檢查瀏覽器右上是否允許了通知權限。Chrome 網址列左邊有個 🔒 圖示，點下去可看權限。

### Q4：要怎麼備份資料？

→ Supabase Dashboard → Database → Backups 可以下載備份。免費方案有自動每日備份保留 7 天。

### Q5：3 個月之後的舊工單跑去哪？

→ 系統每天凌晨 3 點會自動清掉 3 個月前已完成/已作廢的工單。處理中（pending）的工單**永不清理**。

---

## 安全性提醒

- **網址不要對外公開**：雖然不用密碼，但網址洩漏的話任何人都能看
- **如果要更安全**：未來可加 Cloudflare Access 或 Vercel Password Protect（規格外，需另外協助）
- **anon key 不是密碼**：它是「能連到你的 Supabase 但只能做 RLS 允許的事」的金鑰，RLS 已限制只能讀寫工單，無法亂搞其他東西
