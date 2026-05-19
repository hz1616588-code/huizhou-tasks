// ===========================================================
// 匯洲工單系統 - Supabase 連線設定
// ===========================================================
// 請把下面兩個值換成你的 Supabase 專案資料：
//   Supabase Dashboard → Settings → API
//   - Project URL  → SUPABASE_URL
//   - anon public  → SUPABASE_ANON_KEY
// ===========================================================

const SUPABASE_URL = 'https://請填入你的Supabase網址.supabase.co';
const SUPABASE_ANON_KEY = '請填入你的anon-public-key';

// 初始化 Supabase Client（給所有頁面共用）
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: { eventsPerSecond: 10 }
  }
});
