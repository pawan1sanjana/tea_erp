#!/usr/bin/env python3
"""
MySQL to PostgreSQL Data Migration Script for TeaERP
This script migrates all data from MySQL to PostgreSQL, handling type conversions.
"""

import mysql.connector
import psycopg2
from psycopg2 import sql
import sys
from datetime import datetime

class TeaERPMigrator:
    def __init__(self, mysql_config, postgres_config):
        self.mysql_config = mysql_config
        self.postgres_config = postgres_config
        self.mysql_conn = None
        self.postgres_conn = None
        self.tables_order = [
            'estates',
            'users',
            'divisions',
            'blocks',
            'workers',
            'attendance_muster',
            'daily_yields',
            'goods_inventory',
            'biological_assets_inventory',
            'physical_assets_inventory',
            'notifications',
            'weather_logs',
            'finance_accounts',
            'finance_journals',
            'finance_journal_lines',
            'finance_expenses',
            'crop_operations',
            'plucking_details',
            'crop_input_applications',
            'soil_health_records',
            'pruning_records',
            'replanting_records'
        ]

    def connect(self):
        """Connect to both databases"""
        try:
            self.mysql_conn = mysql.connector.connect(**self.mysql_config)
            print("✓ Connected to MySQL")
        except Exception as e:
            print(f"✗ Failed to connect to MySQL: {e}")
            sys.exit(1)

        try:
            self.postgres_conn = psycopg2.connect(**self.postgres_config)
            print("✓ Connected to PostgreSQL")
        except Exception as e:
            print(f"✗ Failed to connect to PostgreSQL: {e}")
            sys.exit(1)

    def close(self):
        """Close database connections"""
        if self.mysql_conn:
            self.mysql_conn.close()
        if self.postgres_conn:
            self.postgres_conn.close()

    def get_table_columns(self, table_name):
        """Get column information from MySQL table"""
        cursor = self.mysql_conn.cursor(dictionary=True)
        cursor.execute(f"DESC {table_name}")
        columns = cursor.fetchall()
        cursor.close()
        return columns

    def get_table_data(self, table_name):
        """Get all data from MySQL table"""
        cursor = self.mysql_conn.cursor(dictionary=True)
        cursor.execute(f"SELECT * FROM {table_name}")
        data = cursor.fetchall()
        cursor.close()
        return data

    def convert_value(self, value, column_type):
        """Convert MySQL values to PostgreSQL compatible format"""
        if value is None:
            return None
        
        if column_type in ['TINYINT', 'BOOLEAN']:
            return bool(value)
        elif column_type == 'JSON':
            return str(value) if isinstance(value, (dict, list)) else value
        elif isinstance(value, datetime):
            return value.isoformat()
        
        return value

    def migrate_table(self, table_name):
        """Migrate data for a single table"""
        print(f"\nMigrating table: {table_name}")
        
        try:
            # Get column info
            columns_info = self.get_table_columns(table_name)
            column_names = [col['Field'] for col in columns_info]
            
            # Get data
            data = self.get_table_data(table_name)
            
            if not data:
                print(f"  No data to migrate")
                return
            
            # Prepare insert statement
            postgres_cursor = self.postgres_conn.cursor()
            
            for row in data:
                values = []
                for col_name in column_names:
                    value = row[col_name]
                    # Convert the value based on column type
                    col_type = next(c['Type'].upper() for c in columns_info if c['Field'] == col_name)
                    value = self.convert_value(value, col_type)
                    values.append(value)
                
                # Build INSERT statement with placeholders
                placeholders = ', '.join(['%s'] * len(column_names))
                insert_sql = sql.SQL(
                    f"INSERT INTO {table_name} ({', '.join(column_names)}) VALUES ({placeholders})"
                )
                
                try:
                    postgres_cursor.execute(insert_sql, values)
                except Exception as e:
                    print(f"  ✗ Error inserting row in {table_name}: {e}")
                    self.postgres_conn.rollback()
                    return False
            
            self.postgres_conn.commit()
            postgres_cursor.close()
            print(f"  ✓ Migrated {len(data)} rows")
            return True
            
        except Exception as e:
            print(f"  ✗ Error migrating {table_name}: {e}")
            self.postgres_conn.rollback()
            return False

    def migrate_all(self):
        """Migrate all tables"""
        print("=" * 50)
        print("TeaERP MySQL to PostgreSQL Migration")
        print("=" * 50)
        
        self.connect()
        
        failed_tables = []
        for table_name in self.tables_order:
            try:
                # Check if table exists in MySQL
                cursor = self.mysql_conn.cursor()
                cursor.execute(f"SHOW TABLES LIKE '{table_name}'")
                exists = cursor.fetchone()
                cursor.close()
                
                if not exists:
                    print(f"\nSkipping table: {table_name} (not found in MySQL)")
                    continue
                
                if not self.migrate_table(table_name):
                    failed_tables.append(table_name)
                    
            except Exception as e:
                print(f"  ✗ Exception with {table_name}: {e}")
                failed_tables.append(table_name)
        
        # Summary
        print("\n" + "=" * 50)
        if failed_tables:
            print(f"✗ Migration completed with {len(failed_tables)} failures:")
            for table in failed_tables:
                print(f"  - {table}")
        else:
            print("✓ Migration completed successfully!")
        print("=" * 50)
        
        self.close()


def main():
    # MySQL Configuration
    mysql_config = {
        'host': 'localhost',
        'user': 'root',
        'password': '',
        'database': 'tea_erp'
    }
    
    # PostgreSQL Configuration
    postgres_config = {
        'host': 'localhost',
        'port': 5432,
        'user': 'tea_erp_user',
        'password': '',
        'database': 'tea_erp'
    }
    
    # Allow command-line overrides
    if len(sys.argv) > 1:
        mysql_config['host'] = sys.argv[1]
    if len(sys.argv) > 2:
        mysql_config['user'] = sys.argv[2]
    if len(sys.argv) > 3:
        mysql_config['password'] = sys.argv[3]
    if len(sys.argv) > 4:
        postgres_config['host'] = sys.argv[4]
    if len(sys.argv) > 5:
        postgres_config['user'] = sys.argv[5]
    if len(sys.argv) > 6:
        postgres_config['password'] = sys.argv[6]
    
    migrator = TeaERPMigrator(mysql_config, postgres_config)
    migrator.migrate_all()


if __name__ == '__main__':
    main()
