-- Add new columns to ai_guide_sessions
ALTER TABLE ai_guide_sessions
  ADD COLUMN IF NOT EXISTS title               TEXT    NOT NULL DEFAULT 'Untitled Session',
  ADD COLUMN IF NOT EXISTS session_type        TEXT    NOT NULL DEFAULT 'free_study',
  ADD COLUMN IF NOT EXISTS exam_context_id     UUID,
  ADD COLUMN IF NOT EXISTS error_focus         TEXT,
  ADD COLUMN IF NOT EXISTS generated_outputs   JSONB,
  ADD COLUMN IF NOT EXISTS mastery_checkpoints JSONB,
  ADD COLUMN IF NOT EXISTS last_active_at      TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- flashcards
CREATE TABLE IF NOT EXISTS flashcards (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  front             TEXT        NOT NULL,
  back              TEXT        NOT NULL,
  subject           TEXT,
  source_exam_id    UUID,
  source_session_id UUID,
  error_type        TEXT,
  level             INT         NOT NULL DEFAULT 0,
  next_review_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- xp_logs
CREATE TABLE IF NOT EXISTS xp_logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount     INT         NOT NULL,
  reason     TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- self_assessments
CREATE TABLE IF NOT EXISTS self_assessments (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exam_id          UUID        NOT NULL,
  topics           JSONB       NOT NULL,
  actual_result    JSONB,
  prediction_delta FLOAT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- topic_recovery
CREATE TABLE IF NOT EXISTS topic_recovery (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id            UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject               TEXT        NOT NULL,
  topic                 TEXT        NOT NULL,
  error_count           INT         NOT NULL DEFAULT 0,
  session_count         INT         NOT NULL DEFAULT 0,
  flashcard_completions INT         NOT NULL DEFAULT 0,
  recovery_score        FLOAT       NOT NULL DEFAULT 0,
  last_updated          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
