CREATE DATABASE IF NOT EXISTS garageflow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE garageflow;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS reminders;
DROP TABLE IF EXISTS workshop_settings;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS parts_used;
DROP TABLE IF EXISTS labor_entries;
DROP TABLE IF EXISTS work_items;
DROP TABLE IF EXISTS repair_jobs;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(191) NOT NULL,
  role ENUM('ADMIN','MECHANIC') NOT NULL DEFAULT 'MECHANIC',
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 35.00,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(191) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  email VARCHAR(191) NULL,
  address VARCHAR(255) NULL,
  vat_number VARCHAR(64) NULL,
  notes TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_customers_full_name (full_name),
  INDEX idx_customers_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  license_plate VARCHAR(32) NOT NULL UNIQUE,
  vin_number VARCHAR(64) NULL UNIQUE,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NULL,
  engine_type VARCHAR(100) NULL,
  fuel_type ENUM('PETROL','DIESEL','HYBRID','ELECTRIC','LPG','OTHER') NOT NULL DEFAULT 'PETROL',
  mileage INT NOT NULL DEFAULT 0,
  color VARCHAR(64) NULL,
  notes TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_vehicles_make_model (make, model),
  CONSTRAINT fk_vehicles_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE repair_jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_number VARCHAR(32) NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  assigned_mechanic_id INT NULL,
  date_opened DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  date_completed DATETIME(3) NULL,
  estimated_completion_at DATETIME(3) NULL,
  vehicle_received_at DATETIME(3) NULL,
  job_card_issued_at DATETIME(3) NULL,
  service_mileage INT NULL,
  oil_change_due_mileage INT NULL,
  next_service_due_mileage INT NULL,
  problem_description TEXT NOT NULL,
  diagnosis TEXT NULL,
  mechanic_notes TEXT NULL,
  internal_notes TEXT NULL,
  status ENUM('PENDING','WAITING_FOR_PARTS','IN_PROGRESS','COMPLETED','DELIVERED') NOT NULL DEFAULT 'PENDING',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_repair_jobs_status (status),
  INDEX idx_repair_jobs_date_opened (date_opened),
  CONSTRAINT fk_jobs_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_jobs_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  CONSTRAINT fk_jobs_mechanic FOREIGN KEY (assigned_mechanic_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE job_service_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  item_key VARCHAR(100) NOT NULL,
  label VARCHAR(191) NOT NULL,
  category VARCHAR(32) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uniq_job_service_items_job_item (job_id, item_key),
  INDEX idx_job_service_items_job_category (job_id, category),
  CONSTRAINT fk_job_service_items_job FOREIGN KEY (job_id) REFERENCES repair_jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE labor_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  mechanic_id INT NOT NULL,
  description VARCHAR(191) NOT NULL,
  hours_worked DECIMAL(8,2) NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  entry_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_labor_entries_entry_date (entry_date),
  CONSTRAINT fk_labor_job FOREIGN KEY (job_id) REFERENCES repair_jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_labor_mechanic FOREIGN KEY (mechanic_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE parts_used (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  part_name VARCHAR(191) NOT NULL,
  part_number VARCHAR(100) NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  supplier VARCHAR(191) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_parts_used_part_number (part_number),
  CONSTRAINT fk_parts_job FOREIGN KEY (job_id) REFERENCES repair_jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(32) NOT NULL UNIQUE,
  job_id INT NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  issue_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  due_date DATETIME(3) NULL,
  labor_total DECIMAL(10,2) NOT NULL,
  parts_total DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,2) NOT NULL DEFAULT 19.00,
  vat_amount DECIMAL(10,2) NOT NULL,
  grand_total DECIMAL(10,2) NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_invoices_issue_date (issue_date),
  CONSTRAINT fk_invoices_job FOREIGN KEY (job_id) REFERENCES repair_jobs(id),
  CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE work_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(191) NOT NULL,
  description TEXT NULL,
  customer_name VARCHAR(191) NULL,
  vehicle_plate VARCHAR(32) NULL,
  assigned_mechanic_id INT NULL,
  due_date DATETIME(3) NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_work_items_completed_due_date (completed, due_date),
  INDEX idx_work_items_assigned_mechanic_id (assigned_mechanic_id),
  CONSTRAINT fk_work_items_mechanic FOREIGN KEY (assigned_mechanic_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE workshop_settings (
  id INT PRIMARY KEY DEFAULT 1,
  company_name VARCHAR(191) NOT NULL,
  address VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  email VARCHAR(191) NOT NULL,
  vat_number VARCHAR(64) NOT NULL,
  registration_number VARCHAR(64) NOT NULL,
  default_vat_rate DECIMAL(5,2) NOT NULL DEFAULT 19.00,
  logo_url VARCHAR(255) NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  title VARCHAR(191) NOT NULL,
  due_date DATETIME(3) NOT NULL,
  channel VARCHAR(32) NOT NULL DEFAULT 'email',
  status ENUM('PENDING','SENT','DISMISSED') NOT NULL DEFAULT 'PENDING',
  notes TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_reminders_due_status (due_date, status),
  CONSTRAINT fk_reminders_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
