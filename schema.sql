-- Video Nurture Pages - Database Schema
-- Target: Neon Postgres

CREATE TABLE IF NOT EXISTS visits (
    id SERIAL PRIMARY KEY,
    page VARCHAR(255) NOT NULL,
    visitor_id VARCHAR(64) NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    country VARCHAR(2),
    screen_width INT,
    screen_height INT,
    time_on_page_seconds INT DEFAULT 0,
    clicked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clicks (
    id SERIAL PRIMARY KEY,
    page VARCHAR(255) NOT NULL,
    visitor_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_visits_page_created ON visits (page, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_visitor_id ON visits (visitor_id);
CREATE INDEX IF NOT EXISTS idx_clicks_page_created ON clicks (page, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_visitor_id ON clicks (visitor_id);
