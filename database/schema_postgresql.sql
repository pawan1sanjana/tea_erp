-- TeaERP Master Schema Definition (PostgreSQL Version)
-- Supports Multi-Tenant Architecture, Auth, HR/Muster, Crop Intelligence, Inventory and Weather

CREATE DATABASE tea_erp;
\c tea_erp;

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'field_officer', 'worker');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE wage_type AS ENUM ('permanent', 'daily_cash', 'contract');
CREATE TYPE worker_status AS ENUM ('active', 'archived', 'on_leave');
CREATE TYPE auth_method AS ENUM ('face', 'qr', 'manual');
CREATE TYPE block_status AS ENUM ('active', 'replanting', 'plucking', 'resting');
CREATE TYPE quality_grade AS ENUM ('A', 'B', 'C');
CREATE TYPE inventory_status AS ENUM ('available', 'reserved', 'damaged', 'consumed');
CREATE TYPE asset_status AS ENUM ('healthy', 'stressed', 'diseased', 'harvested');
CREATE TYPE asset_condition AS ENUM ('excellent', 'good', 'fair', 'poor');
CREATE TYPE maintenance_status AS ENUM ('operational', 'maintenance_due', 'under_repair', 'retired');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'alert', 'notice');
CREATE TYPE operation_type AS ENUM ('plucking', 'weeding', 'manure', 'foliar', 'soil_test', 'dolomite', 'pruning', 'replanting', 'minor_crop');
CREATE TYPE operation_status AS ENUM ('scheduled', 'in_progress', 'completed', 'overdue');
CREATE TYPE plucking_method AS ENUM ('manual', 'shear', 'machine');
CREATE TYPE finance_account_type AS ENUM ('asset', 'liability', 'equity', 'income', 'expense');
CREATE TYPE finance_status AS ENUM ('draft', 'posted', 'void');
CREATE TYPE pruning_type AS ENUM ('light', 'medium', 'hard');
CREATE TYPE promotion_type AS ENUM ('daily', 'monthly', 'seasonal');

-- 1. ESTATES (Multi-Tenant Core)
CREATE TABLE estates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(255),
    total_area DECIMAL(10,2) COMMENT 'Total area in hectares',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS & RBAC
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    estate_id INT REFERENCES estates(id) ON DELETE SET NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'worker',
    status user_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. DIVISIONS & BLOCKS (GIS / Estate Mapping)
CREATE TABLE divisions (
    id SERIAL PRIMARY KEY,
    estate_id INT NOT NULL REFERENCES estates(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    manager_id INT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE blocks (
    id SERIAL PRIMARY KEY,
    division_id INT NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    area_hectares DECIMAL(10,2),
    tea_variety VARCHAR(100),
    planting_year INT,
    status block_status DEFAULT 'active',
    polygon_coordinates JSONB COMMENT 'GeoJSON for mapping module'
);

-- 4. SMART MUSTER & WORKFORCE
CREATE TABLE workers (
    id SERIAL PRIMARY KEY,
    worker_id VARCHAR(50) UNIQUE NOT NULL,
    full_name_initials VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    nic VARCHAR(20) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    tel VARCHAR(20) NOT NULL,
    emergency_tel VARCHAR(20) NOT NULL,
    emergency_contact_name VARCHAR(100),
    wage_type wage_type DEFAULT 'permanent',
    photo TEXT NOT NULL,
    nic_front TEXT NOT NULL,
    nic_back TEXT NOT NULL,
    status worker_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendance_muster (
    id BIGSERIAL PRIMARY KEY,
    worker_id INT NOT NULL REFERENCES workers(id),
    shift_date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    auth_method auth_method DEFAULT 'face',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. CROP INTELLIGENCE (Yield Tracking)
CREATE TABLE daily_yields (
    id BIGSERIAL PRIMARY KEY,
    estate_id INT NOT NULL REFERENCES estates(id),
    division_id INT NOT NULL REFERENCES divisions(id),
    block_id INT REFERENCES blocks(id),
    record_date DATE NOT NULL,
    total_kg DECIMAL(10,2) NOT NULL,
    quality_grade quality_grade DEFAULT 'A',
    weather_condition VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. INVENTORY MODULES
CREATE TABLE goods_inventory (
    id BIGSERIAL PRIMARY KEY,
    estate_id INT NOT NULL REFERENCES estates(id) ON DELETE CASCADE,
    warehouse_name VARCHAR(150),
    sku VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    quantity DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'kg',
    unit_cost DECIMAL(10,2) DEFAULT 0.00,
    status inventory_status DEFAULT 'available',
    last_stocked_date DATE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE biological_assets_inventory (
    id BIGSERIAL PRIMARY KEY,
    estate_id INT NOT NULL REFERENCES estates(id) ON DELETE CASCADE,
    block_id INT REFERENCES blocks(id) ON DELETE SET NULL,
    asset_name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(100),
    variety VARCHAR(100),
    planting_date DATE,
    status asset_status DEFAULT 'healthy',
    estimated_value DECIMAL(12,2) DEFAULT 0.00,
    last_assessed_at DATE,
    notes TEXT
);

CREATE TABLE physical_assets_inventory (
    id BIGSERIAL PRIMARY KEY,
    estate_id INT NOT NULL REFERENCES estates(id) ON DELETE CASCADE,
    asset_name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(100),
    serial_number VARCHAR(150) UNIQUE,
    location VARCHAR(255),
    purchase_date DATE,
    asset_condition asset_condition DEFAULT 'good',
    maintenance_status maintenance_status DEFAULT 'operational',
    value DECIMAL(12,2) DEFAULT 0.00,
    last_maintenance_date DATE,
    next_service_date DATE,
    notes TEXT
);

-- 7. NOTIFICATIONS & ALERTS
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    estate_id INT REFERENCES estates(id) ON DELETE SET NULL,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. WEATHER & CLIMATE INTELLIGENCE
CREATE TABLE weather_logs (
    id BIGSERIAL PRIMARY KEY,
    estate_id INT NOT NULL REFERENCES estates(id) ON DELETE CASCADE,
    log_time TIMESTAMP NOT NULL,
    temperature_c DECIMAL(5,2),
    humidity_percent DECIMAL(5,2),
    rainfall_mm DECIMAL(6,2),
    wind_speed_kmh DECIMAL(5,2),
    solar_radiation DECIMAL(6,2)
);

-- INDEXING FOR PERFORMANCE
CREATE INDEX idx_attendance_date ON attendance_muster(shift_date);
CREATE INDEX idx_yield_date ON daily_yields(record_date);
CREATE INDEX idx_weather_log_time ON weather_logs(log_time);
CREATE INDEX idx_goods_inventory_sku ON goods_inventory(sku);
CREATE INDEX idx_bio_asset_block ON biological_assets_inventory(block_id);
