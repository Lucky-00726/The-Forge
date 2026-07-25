-- ================================================================
-- FORGE V2 DATABASE SCHEMA - DAY 1 AUTH ONLY
-- UUIDs generated in application (Node.js), not MySQL
-- ================================================================

DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;

-- ================================================================
-- TABLE: users
-- ================================================================
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  total_xp INT UNSIGNED DEFAULT 0,
  current_rank ENUM('Cadet', 'Officer', 'Commander') DEFAULT 'Cadet',
  current_streak INT UNSIGNED DEFAULT 0,
  last_active_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABLE: refresh_tokens
-- ================================================================
CREATE TABLE refresh_tokens (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_expires (expires_at),
  INDEX idx_token_hash (token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
