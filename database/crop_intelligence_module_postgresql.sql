-- Crop Intelligence Module Extension (PostgreSQL)

-- 1. TRACKING FIELD OPERATIONS (Main, Seasonal, Minor)
CREATE TABLE crop_operations (
    id BIGSERIAL PRIMARY KEY,
    estate_id INT NOT NULL REFERENCES estates(id),
    block_id INT NOT NULL REFERENCES blocks(id),
    operation_type operation_type NOT NULL,
    scheduled_date DATE,
    actual_date DATE,
    labor_count INT DEFAULT 0,
    cost_total DECIMAL(12,2) DEFAULT 0.00,
    status operation_status DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. PLUCKING ROUNDS DETAILS
CREATE TABLE plucking_details (
    id BIGSERIAL PRIMARY KEY,
    operation_id BIGINT NOT NULL REFERENCES crop_operations(id) ON DELETE CASCADE,
    yield_kg DECIMAL(10,2) NOT NULL,
    plucking_cycle_days INT,
    plucking_method plucking_method DEFAULT 'manual',
    productivity_kg_per_labor DECIMAL(8,2)
);

-- 3. INPUT APPLICATIONS (Weeding Chemicals, Manure, Foliar, Minor Crops)
CREATE TABLE crop_input_applications (
    id BIGSERIAL PRIMARY KEY,
    operation_id BIGINT NOT NULL REFERENCES crop_operations(id) ON DELETE CASCADE,
    inventory_item_id BIGINT REFERENCES goods_inventory(id) ON DELETE SET NULL,
    item_name VARCHAR(255),
    dosage_per_hectare DECIMAL(10,2),
    total_quantity DECIMAL(10,2),
    unit VARCHAR(50),
    application_method VARCHAR(100)
);

-- 4. SOIL HEALTH & pH TRACKING
CREATE TABLE soil_health_records (
    id BIGSERIAL PRIMARY KEY,
    block_id INT NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
    test_date DATE NOT NULL,
    ph_level DECIMAL(4,2),
    nitrogen_level DECIMAL(6,2),
    phosphorus_level DECIMAL(6,2),
    potassium_level DECIMAL(6,2),
    organic_matter_percent DECIMAL(5,2),
    dolomite_recommendation_kg DECIMAL(10,2),
    tested_by VARCHAR(150)
);

-- 5. PRUNING CYCLES
CREATE TABLE pruning_records (
    id BIGSERIAL PRIMARY KEY,
    operation_id BIGINT NOT NULL REFERENCES crop_operations(id) ON DELETE CASCADE,
    pruning_type pruning_type DEFAULT 'light',
    shade_tree_pruning BOOLEAN DEFAULT false,
    recovery_status VARCHAR(50) DEFAULT 'dormant'
);

-- 6. REPLANTING PROJECTS
CREATE TABLE replanting_records (
    id BIGSERIAL PRIMARY KEY,
    operation_id BIGINT NOT NULL REFERENCES crop_operations(id) ON DELETE CASCADE,
    variety_id VARCHAR(100),
    spacing_cm VARCHAR(50),
    survival_rate_percent DECIMAL(5,2),
    plants_removed_count INT,
    plants_new_count INT
);

-- INDEXING
CREATE INDEX idx_crop_op_type ON crop_operations(operation_type);
CREATE INDEX idx_crop_op_date ON crop_operations(actual_date);
CREATE INDEX idx_soil_test_date ON soil_health_records(test_date);
