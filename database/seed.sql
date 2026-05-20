USE tea_erp;
INSERT INTO estates (name, region, total_area) VALUES ('Galle Estate', 'Southern Region', 1200.00);
INSERT INTO users (estate_id, first_name, last_name, email, password_hash, role, status) VALUES (1, 'Super', 'Admin', 'admin@teaerp.com', '$2a$10$KEeBqShaY.wI0e3dxkIPbuFaHxvGqMQswx5Hn2Adr8A1CHKx./S0m', 'admin', 'active');
