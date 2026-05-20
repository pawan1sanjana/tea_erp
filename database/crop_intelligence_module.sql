-- Crop Intelligence Module Extension
USE tea_erp;

-- 1. TRACKING FIELD OPERATIONS (Main, Seasonal, Minor)
CREATE TABLE IF NOT EXISTS crop_operations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    estate_id INT NOT NULL,
    block_id INT NOT NULL,
    operation_type ENUM('plucking', 'weeding', 'manure', 'foliar', 'soil_test', 'dolomite', 'pruning', 'replanting', 'minor_crop') NOT NULL,
    scheduled_date DATE,
    actual_date DATE,
    labor_count INT DEFAULT 0,
    cost_total DECIMAL(12,2) DEFAULT 0.00,
    status ENUM('scheduled', 'in_progress', 'completed', 'overdue') DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (estate_id) REFERENCES estates(id),
    FOREIGN KEY (block_id) REFERENCES blocks(id)
);

-- 2. PLUCKING ROUNDS DETAILS
CREATE TABLE IF NOT EXISTS plucking_details (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    operation_id BIGINT NOT NULL,
    yield_kg DECIMAL(10,2) NOT NULL,
    plucking_cycle_days INT,
    plucking_method ENUM('manual', 'shear', 'machine') DEFAULT 'manual',
    productivity_kg_per_labor DECIMAL(8,2),
    FOREIGN KEY (operation_id) REFERENCES crop_operations(id) ON DELETE CASCADE
);

-- 3. INPUT APPLICATIONS (Weeding Chemicals, Manure, Foliar, Minor Crops)
CREATE TABLE IF NOT EXISTS crop_input_applications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    operation_id BIGINT NOT NULL,
    inventory_item_id BIGINT,
    item_name VARCHAR(255), -- Fallback if not linked to inventory
    dosage_per_hectare DECIMAL(10,2),
    total_quantity DECIMAL(10,2),
    unit VARCHAR(50),
    application_method VARCHAR(100),
    FOREIGN KEY (operation_id) REFERENCES crop_operations(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_item_id) REFERENCES goods_inventory(id) ON DELETE SET NULL
);

-- 4. SOIL HEALTH & pH TRACKING
CREATE TABLE IF NOT EXISTS soil_health_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    block_id INT NOT NULL,
    test_date DATE NOT NULL,
    ph_level DECIMAL(4,2),
    nitrogen_level DECIMAL(6,2),
    phosphorus_level DECIMAL(6,2),
    potassium_level DECIMAL(6,2),
    organic_matter_percent DECIMAL(5,2),
    dolomite_recommendation_kg DECIMAL(10,2),
    tested_by VARCHAR(150),
    FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE
);

-- 5. PRUNING CYCLES
CREATE TABLE IF NOT EXISTS pruning_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    operation_id BIGINT NOT NULL,
    pruning_type ENUM('light', 'medium', 'heavy', 'skiffing') DEFAULT 'light',
    shade_tree_pruning TINYINT(1) DEFAULT 0,
    recovery_status ENUM('dormant', 'budding', 'leafing', 'recovered') DEFAULT 'dormant',
    FOREIGN KEY (operation_id) REFERENCES crop_operations(id) ON DELETE CASCADE
);

-- 6. REPLANTING PROJECTS
CREATE TABLE IF NOT EXISTS replanting_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    operation_id BIGINT NOT NULL,
    variety_id VARCHAR(100), -- Clone type
    spacing_cm VARCHAR(50),
    survival_rate_percent DECIMAL(5,2),
    plants_removed_count INT,
    plants_new_count INT,
    FOREIGN KEY (operation_id) REFERENCES crop_operations(id) ON DELETE CASCADE
);

-- INDEXING
CREATE INDEX idx_crop_op_type ON crop_operations(operation_type);
CREATE INDEX idx_crop_op_date ON crop_operations(actual_date);
CREATE INDEX idx_soil_test_date ON soil_health_records(test_date);
