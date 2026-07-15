-- Timer workflow for video edits (applied manually via the Supabase SQL Editor;
-- this file mirrors that DDL for documentation only — the publishable key cannot run DDL).

-- New video_format enum values (each ADD VALUE must run in its own statement).
ALTER TYPE controle_edicao.video_format ADD VALUE IF NOT EXISTS 'CTAs';
ALTER TYPE controle_edicao.video_format ADD VALUE IF NOT EXISTS 'Frank';
ALTER TYPE controle_edicao.video_format ADD VALUE IF NOT EXISTS 'Hook';

-- Workflow columns (nullable / defaulted so the ~900 legacy rows are unaffected;
-- legacy rows default to status 'done').
ALTER TABLE controle_edicao.video_edits
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'done',
  ADD COLUMN IF NOT EXISTS video_name text,
  ADD COLUMN IF NOT EXISTS raw_link text,
  ADD COLUMN IF NOT EXISTS edited_link text,
  ADD COLUMN IF NOT EXISTS elapsed_seconds integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS timer_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS pauses jsonb NOT NULL DEFAULT '[]'::jsonb;
