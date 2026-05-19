-- ===========================================================
-- 匯洲國際工單系統 - Supabase 資料庫初始化 SQL
-- ===========================================================
-- 使用方式：
--   1. 進入 Supabase Dashboard → SQL Editor → New query
--   2. 把整份貼進去
--   3. 按 Run（右下角綠色按鈕）
--   4. 看到 "Success. No rows returned" 就完成了
--
-- 注意：執行前請先到 Storage 建立名為 task-photos 的 bucket（Public 要勾）
-- ===========================================================

-- 啟用 UUID 產生器
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ① 使用者表（員工名單）
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL CHECK (location IN ('zhongli_cs','longtan_cs','longtan_wh','admin')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, location)
);

CREATE INDEX IF NOT EXISTS idx_users_location_active ON users(location, active);

-- 預先建立實際員工（5 位）
INSERT INTO users (name, location) VALUES
  ('小瀾',     'admin'),
  ('元寶',     'zhongli_cs'),
  ('純純',     'longtan_cs'),
  ('小梁',     'longtan_wh'),
  ('倉管大哥', 'longtan_wh')
ON CONFLICT (name, location) DO NOTHING;

-- ============================================
-- ② 任務表（工單）
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT NOT NULL CHECK (source IN ('zhongli_cs','longtan_cs')),
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  created_by_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('shipment','return','inquiry','other')),
  customer_name TEXT,
  order_no TEXT,
  title TEXT NOT NULL,
  description TEXT,
  photos TEXT[] DEFAULT '{}',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal','urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done','cancelled')),
  completed_at TIMESTAMPTZ,
  completed_by_user_id UUID REFERENCES users(id),
  completed_by_name TEXT,
  completion_note TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by_user_id UUID REFERENCES users(id),
  cancelled_by_name TEXT,
  cancellation_reason TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_priority_status ON tasks(priority, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks(source);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at DESC) WHERE status = 'done';

-- updated_at 自動更新
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_set_updated_at ON tasks;
CREATE TRIGGER tasks_set_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- ③ 通知已讀狀態表（雲端同步）
-- ============================================
CREATE TABLE IF NOT EXISTS notification_reads (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('new','completed','cancelled')),
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, task_id, event_type)
);

CREATE INDEX IF NOT EXISTS idx_notif_reads_user ON notification_reads(user_id, event_type);

-- ============================================
-- ④ 啟用 Realtime（即時推送）
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE notification_reads;
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- ============================================
-- ⑤ Row Level Security（RLS）
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;

-- users：任何人可讀、可改（admin 在頁面內管理）
DROP POLICY IF EXISTS "users_read" ON users;
CREATE POLICY "users_read" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "users_insert" ON users;
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "users_update" ON users;
CREATE POLICY "users_update" ON users FOR UPDATE USING (true) WITH CHECK (true);

-- tasks：任何人可讀、可新增、可更新（不可刪除）
DROP POLICY IF EXISTS "tasks_read" ON tasks;
CREATE POLICY "tasks_read" ON tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "tasks_insert" ON tasks;
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "tasks_update" ON tasks;
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (true) WITH CHECK (true);
-- 不建立 DELETE policy 等同禁止刪除

-- notification_reads：任何人可讀、可寫、可刪
DROP POLICY IF EXISTS "notif_read" ON notification_reads;
CREATE POLICY "notif_read" ON notification_reads FOR SELECT USING (true);

DROP POLICY IF EXISTS "notif_insert" ON notification_reads;
CREATE POLICY "notif_insert" ON notification_reads FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "notif_delete" ON notification_reads;
CREATE POLICY "notif_delete" ON notification_reads FOR DELETE USING (true);

-- ============================================
-- ⑥ Storage Policy（照片上傳/讀取）
-- ============================================
-- ⚠️ 先到 Storage → New bucket，建立名為 task-photos 的 bucket（Public 勾選）後再執行下面
DROP POLICY IF EXISTS "photos_read" ON storage.objects;
CREATE POLICY "photos_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'task-photos');

DROP POLICY IF EXISTS "photos_upload" ON storage.objects;
CREATE POLICY "photos_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'task-photos');

-- ============================================
-- ⑦ 自動清理 cron（3 個月）
-- ============================================
-- ⚠️ 執行前先到 Database → Extensions 啟用 pg_cron 擴充
-- 每天凌晨 3 點清掉 3 個月前已完成或已作廢的工單
-- （ON DELETE CASCADE 會自動清理對應的 notification_reads）
SELECT cron.schedule(
  'cleanup_old_tasks',
  '0 3 * * *',
  $$DELETE FROM tasks
    WHERE status IN ('done','cancelled')
      AND COALESCE(completed_at, cancelled_at) < NOW() - INTERVAL '3 months'$$
);

-- ============================================
-- 完成！
-- ============================================
-- 確認方式：
--   1. Table Editor 應該看到 users / tasks / notification_reads 三張表
--   2. users 表應該有 5 筆資料（小瀾、元寶、純純、小梁、倉管大哥）
--   3. Database → Cron Jobs 應該看到 cleanup_old_tasks
