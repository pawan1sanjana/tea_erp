-- ============================================================
-- TeaERP Pro — Finance Module Migration (v1)
-- Chart of Accounts + Journal + Expenses + Trial Balance view
-- ============================================================

-- 1) Chart of Accounts (COA)
CREATE TABLE IF NOT EXISTS finance_accounts (
  id              INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  estate_id        INT           NOT NULL DEFAULT 1,
  code            VARCHAR(20)   NOT NULL,
  name            VARCHAR(255)  NOT NULL,
  type            ENUM('asset','liability','equity','income','expense') NOT NULL,
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_fin_acct (estate_id, code),
  INDEX idx_fin_acct_type (estate_id, type),
  CONSTRAINT fk_fin_acct_estate FOREIGN KEY (estate_id) REFERENCES estates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Finance chart of accounts';

-- 2) Journal header
CREATE TABLE IF NOT EXISTS finance_journals (
  id              BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
  estate_id        INT           NOT NULL DEFAULT 1,
  journal_date     DATE          NOT NULL,
  reference        VARCHAR(100)  NULL,
  memo            VARCHAR(255)  NULL,
  status          ENUM('draft','posted','void') NOT NULL DEFAULT 'posted',
  created_by       INT           NULL,
  created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_fin_journal_date (estate_id, journal_date),
  INDEX idx_fin_journal_status (estate_id, status),
  CONSTRAINT fk_fin_journal_estate FOREIGN KEY (estate_id) REFERENCES estates(id) ON DELETE CASCADE,
  CONSTRAINT fk_fin_journal_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Finance journal entries header';

-- 3) Journal lines (double-entry accounting)
CREATE TABLE IF NOT EXISTS finance_journal_lines (
  id              BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
  journal_id       BIGINT        NOT NULL,
  account_id       INT           NOT NULL,
  description      VARCHAR(255)  NULL,
  debit           DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  credit          DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fin_line_journal (journal_id),
  INDEX idx_fin_line_account (account_id),
  CONSTRAINT fk_fin_line_journal FOREIGN KEY (journal_id) REFERENCES finance_journals(id) ON DELETE CASCADE,
  CONSTRAINT fk_fin_line_account FOREIGN KEY (account_id) REFERENCES finance_accounts(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Finance journal entry lines';

-- 4) Expenses (simple payable/expense capture)
CREATE TABLE IF NOT EXISTS finance_expenses (
  id              BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
  estate_id        INT           NOT NULL DEFAULT 1,
  expense_date     DATE          NOT NULL,
  vendor           VARCHAR(255)  NULL,
  category         VARCHAR(100)  NULL,
  amount           DECIMAL(12,2) NOT NULL,
  payment_method   VARCHAR(50)   NULL,
  reference        VARCHAR(100)  NULL,
  notes            VARCHAR(255)  NULL,
  expense_account_id INT         NULL,
  journal_id       BIGINT        NULL,
  created_by       INT           NULL,
  created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_fin_expense_date (estate_id, expense_date),
  CONSTRAINT fk_fin_exp_estate FOREIGN KEY (estate_id) REFERENCES estates(id) ON DELETE CASCADE,
  CONSTRAINT fk_fin_exp_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_fin_exp_account FOREIGN KEY (expense_account_id) REFERENCES finance_accounts(id) ON DELETE SET NULL,
  CONSTRAINT fk_fin_exp_journal FOREIGN KEY (journal_id) REFERENCES finance_journals(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Expense records (optionally linked to a journal)';

-- 5) Seed a minimal COA (idempotent)
INSERT INTO finance_accounts (estate_id, code, name, type, is_active)
SELECT 1, '1000', 'Cash', 'asset', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM finance_accounts WHERE estate_id = 1 AND code = '1000');

INSERT INTO finance_accounts (estate_id, code, name, type, is_active)
SELECT 1, '1100', 'Accounts Receivable', 'asset', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM finance_accounts WHERE estate_id = 1 AND code = '1100');

INSERT INTO finance_accounts (estate_id, code, name, type, is_active)
SELECT 1, '2000', 'Accounts Payable', 'liability', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM finance_accounts WHERE estate_id = 1 AND code = '2000');

INSERT INTO finance_accounts (estate_id, code, name, type, is_active)
SELECT 1, '3000', 'Owner Equity', 'equity', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM finance_accounts WHERE estate_id = 1 AND code = '3000');

INSERT INTO finance_accounts (estate_id, code, name, type, is_active)
SELECT 1, '4000', 'Sales / Revenue', 'income', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM finance_accounts WHERE estate_id = 1 AND code = '4000');

INSERT INTO finance_accounts (estate_id, code, name, type, is_active)
SELECT 1, '5000', 'General Expenses', 'expense', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM finance_accounts WHERE estate_id = 1 AND code = '5000');

