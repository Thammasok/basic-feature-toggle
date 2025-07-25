-- Feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT false,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    rollout_strategy VARCHAR(50) DEFAULT 'percentage',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    environment VARCHAR(50) DEFAULT 'production'
);

-- User segments for targeted rollouts
CREATE TABLE IF NOT EXISTS user_segments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    criteria JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feature flag targeting rules
CREATE TABLE IF NOT EXISTS feature_targeting (
    id SERIAL PRIMARY KEY,
    feature_flag_id INTEGER REFERENCES feature_flags(id) ON DELETE CASCADE,
    segment_id INTEGER REFERENCES user_segments(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    rollout_percentage INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feature flag history for audit trail
CREATE TABLE IF NOT EXISTS feature_flag_history (
    id SERIAL PRIMARY KEY,
    feature_flag_id INTEGER REFERENCES feature_flags(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT
);

-- User feature assignments (for consistent user experience)
CREATE TABLE IF NOT EXISTS user_feature_assignments (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    feature_flag_id INTEGER REFERENCES feature_flags(id) ON DELETE CASCADE,
    assigned BOOLEAN NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assignment_reason VARCHAR(100),
    UNIQUE(user_id, feature_flag_id)
);

-- Feature analytics
CREATE TABLE IF NOT EXISTS feature_analytics (
    id SERIAL PRIMARY KEY,
    feature_flag_id INTEGER REFERENCES feature_flags(id) ON DELETE CASCADE,
    user_id VARCHAR(255),
    event_type VARCHAR(50), -- 'enabled', 'disabled', 'used'
    event_data JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX IF NOT EXISTS idx_user_assignments_user_id ON user_feature_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assignments_feature_id ON user_feature_assignments(feature_flag_id);
CREATE INDEX IF NOT EXISTS idx_feature_analytics_feature_id ON feature_analytics(feature_flag_id);
CREATE INDEX IF NOT EXISTS idx_feature_analytics_timestamp ON feature_analytics(timestamp);