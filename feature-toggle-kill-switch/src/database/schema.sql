CREATE TABLE feature_toggles (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    enabled BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
-- INSERT INTO feature_toggles (id, name, enabled, description) VALUES 
-- ('user-registration', 'User Registration', true, 'Enable user registration feature'),
-- ('payment-gateway', 'Payment Gateway', false, 'Enable payment processing'),
-- ('email-notifications', 'Email Notifications', true, 'Enable email notification system'),
-- ('beta-features', 'Beta Features', false, 'Enable beta features for testing');