-- TeaERP Master Schema Definition
-- Supports Multi-Tenant Architecture, Auth, HR/Muster, Crop Intelligence, Inventory and Weather

CREATE DATABASE IF NOT EXISTS tea_erp;
USE tea_erp;

-- 1. ESTATES (Multi-Tenant Core)
CREATE TABLE IF NOT EXISTS estates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(255),
    total_area DECIMAL(10,2) COMMENT 'Total area in hectares',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. USERS & RBAC
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estate_id INT,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'field_officer', 'worker') DEFAULT 'worker',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (estate_id) REFERENCES estates(id) ON DELETE SET NULL
);

-- 3. DIVISIONS & BLOCKS (GIS / Estate Mapping)
CREATE TABLE IF NOT EXISTS divisions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estate_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    manager_id INT,
    FOREIGN KEY (estate_id) REFERENCES estates(id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS blocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    division_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    area_hectares DECIMAL(10,2),
    tea_variety VARCHAR(100),
    planting_year INT,
    status ENUM('active', 'replanting', 'plucking', 'resting') DEFAULT 'active',
    polygon_coordinates JSON COMMENT 'GeoJSON for mapping module',
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE
);

-- 4. SMART MUSTER & WORKFORCE
CREATE TABLE IF NOT EXISTS workers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    worker_id VARCHAR(50) UNIQUE NOT NULL,
    full_name_initials VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    nic VARCHAR(20) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    tel VARCHAR(20) NOT NULL,
    emergency_tel VARCHAR(20) NOT NULL,
    emergency_contact_name VARCHAR(100),
    wage_type ENUM('permanent', 'daily_cash', 'contract') DEFAULT 'permanent',
    photo LONGTEXT NOT NULL,
    nic_front LONGTEXT NOT NULL,
    nic_back LONGTEXT NOT NULL,
    status ENUM('active', 'archived', 'on_leave') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_muster (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    worker_id INT NOT NULL,
    shift_date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    auth_method ENUM('face', 'qr', 'manual') DEFAULT 'face',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (worker_id) REFERENCES workers(id)
);

-- 5. CROP INTELLIGENCE (Yield Tracking)
CREATE TABLE IF NOT EXISTS daily_yields (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    estate_id INT NOT NULL,
    division_id INT NOT NULL,
    block_id INT,
    record_date DATE NOT NULL,
    total_kg DECIMAL(10,2) NOT NULL,
    quality_grade ENUM('A', 'B', 'C') DEFAULT 'A',
    weather_condition VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (estate_id) REFERENCES estates(id),
    FOREIGN KEY (division_id) REFERENCES divisions(id),
    FOREIGN KEY (block_id) REFERENCES blocks(id)
);

-- 6. INVENTORY MODULES
CREATE TABLE IF NOT EXISTS goods_inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    estate_id INT NOT NULL,
    warehouse_name VARCHAR(150),
    sku VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    quantity DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'kg',
    unit_cost DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('available', 'reserved', 'damaged', 'consumed') DEFAULT 'available',
    last_stocked_date DATE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (estate_id) REFERENCES estates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS biological_assets_inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    estate_id INT NOT NULL,
    block_id INT,
    asset_name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(100),
    variety VARCHAR(100),
    planting_date DATE,
    status ENUM('healthy', 'stressed', 'diseased', 'harvested') DEFAULT 'healthy',
    estimated_value DECIMAL(12,2) DEFAULT 0.00,
    last_assessed_at DATE,
    notes TEXT,
    FOREIGN KEY (estate_id) REFERENCES estates(id) ON DELETE CASCADE,
    FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS physical_assets_inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    estate_id INT NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(100),
    serial_number VARCHAR(150) UNIQUE,
    location VARCHAR(255),
    purchase_date DATE,
    asset_condition ENUM('excellent', 'good', 'fair', 'poor') DEFAULT 'good',
    maintenance_status ENUM('operational', 'maintenance_due', 'under_repair', 'retired') DEFAULT 'operational',
    value DECIMAL(12,2) DEFAULT 0.00,
    last_maintenance_date DATE,
    next_service_date DATE,
    notes TEXT,
    FOREIGN KEY (estate_id) REFERENCES estates(id) ON DELETE CASCADE
);

-- 7. NOTIFICATIONS & ALERTS
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    estate_id INT,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'alert', 'notice') DEFAULT 'info',
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (estate_id) REFERENCES estates(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 8. WEATHER & CLIMATE INTELLIGENCE
CREATE TABLE IF NOT EXISTS weather_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    estate_id INT NOT NULL,
    log_time DATETIME NOT NULL,
    temperature_c DECIMAL(5,2),
    humidity_percent DECIMAL(5,2),
    rainfall_mm DECIMAL(6,2),
    wind_speed_kmh DECIMAL(5,2),
    solar_radiation DECIMAL(6,2),
    FOREIGN KEY (estate_id) REFERENCES estates(id) ON DELETE CASCADE
);

-- INDEXING FOR PERFORMANCE
CREATE INDEX idx_attendance_date ON attendance_muster(shift_date);
CREATE INDEX idx_yield_date ON daily_yields(record_date);
CREATE INDEX idx_weather_log_time ON weather_logs(log_time);
CREATE INDEX idx_goods_inventory_sku ON goods_inventory(sku);
CREATE INDEX idx_bio_asset_block ON biological_assets_inventory(block_id);
