// ===========================================================
// 匯洲工單系統 - Supabase 連線設定
// ===========================================================
// 請把下面兩個值換成你的 Supabase 專案資料：
//   Supabase Dashboard → Settings → API
//   - Project URL  → SUPABASE_URL
//   - anon public  → SUPABASE_ANON_KEY
// ===========================================================

const SUPABASE_URL = 'https://uicorkexsxembhexpedh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpY29ya2V4c3hlbWJoZXhwZWRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTMwMDgsImV4cCI6MjA5NDc2OTAwOH0.XRp6LhZ4kPOJRks8x4L1cF3-wfiyYKTkZSZDkxOTZ5Y';

// 初始化 Supabase Client（給所有頁面共用）
// 用 window.supabase 覆蓋 CDN 命名空間（新版 SDK 會在全域宣告 supabase，
// 用 const 會撞名）
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: { eventsPerSecond: 10 }
  }
});
