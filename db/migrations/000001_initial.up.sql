-- ── fitvault_exercises ──────────────────────────────────────────────────────
CREATE TABLE fitvault_exercises (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name                JSONB       NOT NULL,
    description         JSONB,
    muscle_groups       TEXT[]      NOT NULL DEFAULT '{}',
    equipment           TEXT[]      NOT NULL DEFAULT '{}',
    difficulty          TEXT        NOT NULL,
    movement_pattern    TEXT,
    instructions        JSONB,
    full_video_s3_key   TEXT,
    preview_clip_s3_key TEXT,
    thumbnail_s3_key    TEXT,
    duration_seconds    INTEGER,
    contributor_id      UUID,
    status              TEXT        NOT NULL DEFAULT 'DRAFT',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at         TIMESTAMPTZ,
    reviewer_id         UUID
);

CREATE INDEX vid_exercises_status_created_idx  ON fitvault_exercises (status, created_at);
CREATE INDEX vid_exercises_difficulty_idx       ON fitvault_exercises (difficulty);
CREATE INDEX vid_exercises_muscle_groups_idx    ON fitvault_exercises USING GIN (muscle_groups);
CREATE INDEX vid_exercises_equipment_idx        ON fitvault_exercises USING GIN (equipment);

-- ── fitvault_products ─────────────────────────────────────────────────
CREATE TABLE fitvault_products (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    type                TEXT        NOT NULL CHECK (type IN ('SINGLE_VIDEO','BUNDLE','SUBSCRIPTION_MONTHLY','SUBSCRIPTION_ANNUAL')),
    title               TEXT        NOT NULL,
    exercise_ids        UUID[]      NOT NULL DEFAULT '{}',
    price_cents         INTEGER     NOT NULL CHECK (price_cents >= 0),
    currency            TEXT        NOT NULL DEFAULT 'USD',
    provider_product_id TEXT,
    provider_price_id   TEXT,
    active              BOOLEAN     NOT NULL DEFAULT true
);

CREATE INDEX vid_products_active_idx ON fitvault_products (active);

-- ── user_video_unlocks ─────────────────────────────────────────────────────
CREATE TABLE user_video_unlocks (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL,
    exercise_id  UUID        NOT NULL REFERENCES fitvault_exercises(id),
    product_id   UUID        REFERENCES fitvault_products(id),
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    payment_id   TEXT,
    UNIQUE (user_id, exercise_id)
);

CREATE INDEX vid_unlocks_user_id_idx     ON user_video_unlocks (user_id);
CREATE INDEX vid_unlocks_exercise_id_idx ON user_video_unlocks (exercise_id);

-- ── user_subscriptions ─────────────────────────────────────────────────────
CREATE TABLE user_subscriptions (
    id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID        NOT NULL,
    product_id               UUID        NOT NULL REFERENCES fitvault_products(id),
    status                   TEXT        NOT NULL CHECK (status IN ('ACTIVE','CANCELLED','EXPIRED')),
    valid_from               TIMESTAMPTZ NOT NULL,
    valid_until              TIMESTAMPTZ NOT NULL,
    provider_subscription_id TEXT        NOT NULL,
    UNIQUE (provider_subscription_id)
);

CREATE INDEX vid_subs_user_status_idx ON user_subscriptions (user_id, status);

-- ── fitvault_contributors ───────────────────────────────────────────────────────
CREATE TABLE fitvault_contributors (
    user_id           UUID         PRIMARY KEY,
    verified          BOOLEAN      NOT NULL DEFAULT false,
    revenue_share_pct NUMERIC(5,4) NOT NULL DEFAULT 0.7000,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── contributor_earnings ───────────────────────────────────────────────────
CREATE TABLE contributor_earnings (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    contributor_id     UUID         NOT NULL REFERENCES fitvault_contributors(user_id),
    exercise_id        UUID         NOT NULL REFERENCES fitvault_exercises(id),
    unlock_id          UUID         NOT NULL REFERENCES user_video_unlocks(id),
    gross_amount_cents INTEGER      NOT NULL,
    revenue_share_pct  NUMERIC(5,4) NOT NULL,
    earnings_cents     INTEGER      NOT NULL,
    period_month       TEXT         NOT NULL,
    payout_status      TEXT         NOT NULL DEFAULT 'PENDING' CHECK (payout_status IN ('PENDING','PAID','WITHHELD')),
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX vid_earnings_contributor_idx  ON contributor_earnings (contributor_id);
CREATE INDEX vid_earnings_period_month_idx ON contributor_earnings (period_month);

-- ── content_review_notes ───────────────────────────────────────────────────
CREATE TABLE content_review_notes (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID        NOT NULL REFERENCES fitvault_exercises(id),
    reviewer_id UUID        NOT NULL,
    action      TEXT        NOT NULL CHECK (action IN ('APPROVED','REJECTED','CHANGES_REQUESTED')),
    note        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX vid_review_notes_exercise_idx ON content_review_notes (exercise_id);
