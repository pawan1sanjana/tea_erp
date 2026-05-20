-- ============================================================
-- TeaERP Pro — Finance Module Migration (PostgreSQL v1)
-- Chart of Accounts + Journal + Expenses + Trial Balance view
-- ============================================================

-- 1) Chart of Accounts (COA)
CREATE TABLE finance_accounts (
  id              SERIAL PRIMARY KEY,
  estate_id       INT NOT NULL DEFAULT 1,
  code            VARCHAR(20) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  type            finance_account_type NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (estate_id, code),
  FOREIGN KEY (estate_id) REFERENCES estates(id) ON DELETE CASCADE
);

CREATE INDEX idx_fin_acct_type ON finance_accounts(estate_id, type);

-- 2) Journal header
CREATE TABLE finance_journals (
  id              BIGSERIAL PRIMARY KEY,
  estate_id       INT NOT NULL DEFAULT 1,
  journal_date    DATE NOT NULL,
  reference       VARCHAR(100),
  memo            VARCHAR(255),
  status          finance_status NOT NULL DEFAULT 'posted',
  created_by      INT,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estate_id) REFERENCES estates(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_fin_journal_date ON finance_journals(estate_id, journal_date);
CREATE INDEX idx_fin_journal_status ON finance_journals(estate_id, status);

-- 3) Journal lines (double-entry accounting)
CREATE TABLE finance_journal_lines (
  id              BIGSERIAL PRIMARY KEY,
  journal_id      BIGINT NOT NULL,
  account_id      INT NOT NULL,
  description     VARCHAR(255),
  debit           DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  credit          DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journal_id) REFERENCES finance_journals(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES finance_accounts(id) ON DELETE RESTRICT
);

CREATE INDEX idx_fin_line_journal ON finance_journal_lines(journal_id);
CREATE INDEX idx_fin_line_account ON finance_journal_lines(account_id);

-- 4) Expenses (simple payable/expense capture)
CREATE TABLE finance_expenses (
  id              BIGSERIAL PRIMARY KEY,
  estate_id       INT NOT NULL DEFAULT 1,
  expense_date    DATE NOT NULL,
  vendor          VARCHAR(255),
  category        VARCHAR(100),
  amount          DECIMAL(12,2) NOT NULL,
  payment_method  VARCHAR(50),
  reference       VARCHAR(100),
  notes           VARCHAR(255),
  expense_account_id INT,
  journal_id      BIGINT,
  created_by      INT,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estate_id) REFERENCES estates(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (expense_account_id) REFERENCES finance_accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (journal_id) REFERENCES finance_journals(id) ON DELETE SET NULL
);

CREATE INDEX idx_fin_expense_date ON finance_expenses(estate_id, expense_date);

-- 5) Seed a minimal COA (idempotent)
INSERT INTO finance_accounts (estate_id, code, name, type, is_active)
VALUES (1, '1000', 'Cash', 'asset', true)
ON CONFLICT (estate_id, code) DO NOTHING;

INSERT INTO finance_accounts (estate_id, code, name, type, is_active)
VALUES (1, '1100', 'Accounts Receivable', 'asset', true)
ON CONFLICT (estate_id, code) DO NOTHING;

INSERT INTO finance_accounts (estate_id, code, name, type, is_active)
VALUES (1, '2000', 'Accounts Payable', 'liability', true)
ON CONFLICT (estate_id, code) DO NOTHING;

INSERT INTO finance_accounts (estate_id, code, name, type, is_active)
VALUES (1, '3000', 'Owner Equity', 'equity', true)
ON CONFLICT (estate_id, code) DO NOTHING;

INSERT INTO finance_accounts (estate_id, code, name, type, is_active)
VALUES (1, '4000', 'Sales / Revenue', 'income', true)
ON CONFLICT (estate_id, code) DO NOTHING;

INSERT INTO finance_accounts (estate_id, code, name, type, is_active)
VALUES (1, '5000', 'General Expenses', 'expense', true)
ON CONFLICT (estate_id, code) DO NOTHING;
