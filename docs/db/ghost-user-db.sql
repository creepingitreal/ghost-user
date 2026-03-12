-- USERS
DROP TABLE IF EXISTS users;
CREATE TABLE users (
                       id INTEGER PRIMARY KEY,
                       username TEXT,
                       role TEXT,
                       created_at TEXT
);

INSERT INTO users VALUES
                      (1,'aroberts','employee','2024-01-10'),
                      (2,'sys_jenkins','service_account','2024-01-12'),
                      (3,'finance_ai','automation','2024-01-15'),
                      (4,NULL,'unknown','2024-01-17'),
                      (5,'ops_noc','employee','2024-02-01'),
                      (6,'analyst01','employee','2024-02-02'),
                      (7,'backup_daemon','service_account','2024-02-03'),
                      (8,'qa_user','employee','2024-02-05'),
                      (9,'admin_temp','temporary','2024-02-08'),
                      (10,'ghost_shadow','alias','2024-02-09'); -- red herring

-- TRANSACTIONS
DROP TABLE IF EXISTS transactions;
CREATE TABLE transactions (
                              id INTEGER PRIMARY KEY,
                              user_id INTEGER,
                              amount INTEGER,
                              type TEXT,
                              created_at TEXT
);

INSERT INTO transactions VALUES
                             (1,1,200,'payroll','2024-02-10'),
                             (2,1,99,'expenses','2024-02-11'),
                             (3,3,9000,'payroll','2024-02-12'),
                             (4,4,-15000,'data_export','2024-02-15'),
                             (5,5,120,'expenses','2024-02-16'),
                             (6,6,180,'expenses','2024-02-16'),
                             (7,7,0,'backup_run','2024-02-16'),
                             (8,8,300,'payroll','2024-02-16'),
                             (9,9,0,'role_change','2024-02-16'),
                             (10,10,-50,'data_test','2024-02-16'); -- noise

-- AUDIT LOGS
DROP TABLE IF EXISTS audit_logs;
CREATE TABLE audit_logs (
                            id INTEGER PRIMARY KEY,
                            action TEXT,
                            user_id INTEGER,
                            performed_by TEXT,
                            created_at TEXT
);

INSERT INTO audit_logs VALUES
                           (1,'SYSTEM_BOOT',NULL,'system','2024-02-01'),
                           (2,'DELETE_USER',3,'aroberts','2024-02-15'),
                           (3,'PRIV_ESCALATION',4,'unknown_actor','2024-02-16'),
                           (4,'ALTER_AUDIT_LOG',3,'finance_ai','2024-02-16'),
                           (5,'FAILED_LOGIN',NULL,'finance_ai','2024-02-17'),
                           (6,'VAULT_ACCESS',4,'unknown_actor','2024-02-16T01:05:00'),
                           (7,'LOGIN',5,'ops_noc','2024-02-16T01:10:00'),
                           (8,'FAILED_LOGIN',NULL,'qa_user','2024-02-16T01:15:00'),
                           (9,'DELETE_USER',10,'admin_temp','2024-02-16T01:20:00'),
                           (10,'ROLE_GRANT',9,'admin_temp','2024-02-16T01:25:00');