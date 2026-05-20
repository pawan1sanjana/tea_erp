-- ============================================================
-- TeaERP Pro — Face Recognition Migration
-- Run this SQL against your existing database
-- ============================================================

-- 1. Stores computed face-api.js descriptors per worker (128-float arrays)
CREATE TABLE IF NOT EXISTS face_descriptors (
  id          INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  worker_id   VARCHAR(50)   NOT NULL,
  descriptors LONGTEXT      NOT NULL COMMENT 'JSON array of Float32Array descriptor arrays',
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_worker_descriptor (worker_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='face-api.js face descriptor storage';

-- 2. Detailed biometric attendance log (separate from generic attendance_muster)
CREATE TABLE IF NOT EXISTS biometric_attendance (
  id          INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  worker_id   INT           NOT NULL,
  confidence  DECIMAL(5,2)  NOT NULL DEFAULT 0.00 COMMENT 'Match confidence 0-100',
  method      VARCHAR(50)   NOT NULL DEFAULT 'face-api',
  scanned_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_worker   (worker_id),
  INDEX idx_date     (scanned_at),
  CONSTRAINT fk_bio_worker FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Biometric check-in events';
