-- Migration: Transition Biological Assets to Forestry/Timber Biometrics
-- Removes old livestock dummy data and creates specialized tree inventory schema

USE tea_erp;

-- 1. DROP EXISTING DUMMY TABLE
DROP TABLE IF EXISTS biological_assets_inventory;

-- 2. CREATE NEW FORESTRY-SPECIFIC TABLE
CREATE TABLE biological_assets_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estate_id INT NOT NULL DEFAULT 1,
    block_id INT, -- Optional reference to estates blocks
    block_name VARCHAR(100), -- Direct entry for sectors/blocks
    tree_species VARCHAR(255) NOT NULL,
    height_ft DECIMAL(10,2),
    girth_in DECIMAL(10,2),
    height_category VARCHAR(100),
    girth_category VARCHAR(100),
    census_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (estate_id) REFERENCES estates(id) ON DELETE CASCADE,
    FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE SET NULL
);

-- 3. INSERT REAL SEED DATA (Removing dummy records)
INSERT INTO biological_assets_inventory (block_name, tree_species, height_ft, girth_in, height_category, girth_category, census_date)
VALUES 
('Sector 04', 'Teak (Tectona grandis)', 45.00, 38.00, 'Mature', 'Grade A', '2026-04-12'),
('Sector 04', 'Mahogany', 42.00, 34.00, 'Mature', 'Grade B', '2026-04-12'),
('Sector 12', 'Eucalyptus', 50.00, 28.00, 'Tall', 'Grade C', '2026-04-10'),
('Sector 09', 'Teak', 15.00, 12.00, 'Young', 'Sapling', '2026-04-08'),
('Sector 02', 'Rosewood', 38.00, 42.00, 'Mature', 'Prime', '2026-04-05'),
('Sector 04', 'Teak', 48.00, 40.00, 'Mature', 'Grade A', '2026-04-02'),
('Sector 12', 'Mahogany', 22.00, 18.00, 'Intermediate', 'Grade D', '2026-03-28'),
('Sector 09', 'Eucalyptus', 55.00, 32.00, 'Tall', 'Grade B', '2026-03-25');

-- 4. UPDATE INDEXING FOR PERFORMANCE
CREATE INDEX idx_forestry_species ON biological_assets_inventory(tree_species);
CREATE INDEX idx_forestry_block ON biological_assets_inventory(block_name);
