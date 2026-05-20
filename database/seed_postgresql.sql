-- Seed Data for TeaERP PostgreSQL Database

-- 1. Create a Default Estate
-- Users require an estate_id, so we must insert an estate first.
INSERT INTO estates (name, region, total_area) 
VALUES ('Ruhuna Tea Estate', 'Southern Province', 150.50);

-- 2. Insert Users
-- Note: The password for all these accounts is 'admin123'
INSERT INTO users (estate_id, first_name, last_name, email, password_hash, role, status)
VALUES 
-- System Admin
(1, 'System', 'Admin', 'admin@teaerp.com', '$2a$10$Bsf3NJ8uBWOkBK0.T3gdhedEAyL3wjA9VQ/PZtyGVLvnrdwciu2VO', 'admin', 'active'),

-- Estate Manager
(1, 'John', 'Doe', 'manager@teaerp.com', '$2a$10$Bsf3NJ8uBWOkBK0.T3gdhedEAyL3wjA9VQ/PZtyGVLvnrdwciu2VO', 'manager', 'active'),

-- Field Officer
(1, 'Jane', 'Smith', 'field@teaerp.com', '$2a$10$Bsf3NJ8uBWOkBK0.T3gdhedEAyL3wjA9VQ/PZtyGVLvnrdwciu2VO', 'field_officer', 'active');
