DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS audit_logs;

CREATE TABLE users (
                       id INTEGER PRIMARY KEY,
                       username TEXT,
                       role TEXT,
                       created_at TEXT
);

CREATE TABLE transactions (
                              id INTEGER PRIMARY KEY,
                              user_id INTEGER,
                              amount INTEGER,
                              type TEXT,
                              created_at TEXT
);

CREATE TABLE audit_logs (
                            id INTEGER PRIMARY KEY,
                            action TEXT,
                            user_id INTEGER,
                            performed_by TEXT,
                            created_at TEXT
);

INSERT INTO users VALUES
                      (1,'aroberts','employee','2024-01-10'),
                      (2,'sys_jenkins','service_account','2024-01-12'),
                      (3,'finance_ai','automation','2024-01-15'),
                      (4,NULL,'unknown','2024-01-17');

INSERT INTO transactions VALUES
                             (1,1,200,'payroll','2024-02-10'),
                             (2,1,99,'expenses','2024-02-11'),
                             (3,3,9000,'payroll','2024-02-12'),
                             (4,4,-15000,'data_export','2024-02-15');

INSERT INTO audit_logs VALUES
                           (1,'SYSTEM_BOOT',NULL,'system','2024-02-01'),
                           (2,'DELETE_USER',3,'aroberts','2024-02-15'),
                           (3,'PRIV_ESCALATION',4,'unknown_actor','2024-02-16'),
                           (4,'ALTER_AUDIT_LOG',3,'finance_ai','2024-02-16'),
                           (5,'FAILED_LOGIN',NULL,'finance_ai','2024-02-17');