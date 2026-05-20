-- 1. Create Divisions Table
CREATE TABLE IF NOT EXISTS divisions (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  estate_id  INT NOT NULL,
  name       VARCHAR(100) NOT NULL,
  manager_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Blocks Table
CREATE TABLE IF NOT EXISTS blocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    division_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    cropType VARCHAR(100) DEFAULT 'Tea',
    tea_variety VARCHAR(255),
    planting_year INT,
    area_hectares DECIMAL(10, 4) DEFAULT 0.0000,
    status ENUM('Active', 'Pruned', 'Rested', 'Fallow', 'Inactive') DEFAULT 'Active',
    polygon_coordinates LONGTEXT,
    last_yield DECIMAL(10, 2) DEFAULT 0.00,
    quality_grade VARCHAR(10) DEFAULT 'N/A',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_division FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Unified Field Records Table (Activity Journal)
CREATE TABLE IF NOT EXISTS field_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    block_id INT NOT NULL,
    record_type ENUM('METRIC', 'TASK', 'INSPECTION') NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_by VARCHAR(100),
    instructor_name VARCHAR(100),

    -- Metrics Data
    soil_moisture DECIMAL(5,2), soil_ph DECIMAL(4,2), leaf_health DECIMAL(4,2), 
    pest_pressure INT, plant_height DECIMAL(8,2), tea_yield DECIMAL(10,2),
    leaf_quality_score DECIMAL(4,2), leaf_wetness INT, soil_temp DECIMAL(4,1),
    nitrogen_level DECIMAL(5,2), phosphorus_level DECIMAL(5,2), potassium_level DECIMAL(5,2),
    plucking_cycle_days INT,

    -- Task Data
    task_title VARCHAR(255), task_description TEXT, task_due_date DATE, 
    task_priority VARCHAR(20), task_status VARCHAR(20),

    -- Inspection Data
    health_status VARCHAR(20), observations TEXT, recommendations TEXT, feedback_notes TEXT,

    CONSTRAINT fk_record_block FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE,
    INDEX idx_block_type (block_id, record_type),
    INDEX idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
