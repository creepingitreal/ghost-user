-- ghost-user-db.sql

-- ============================================================
-- USERS
-- ============================================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
                       id          INTEGER PRIMARY KEY,
                       username    TEXT,
                       email       TEXT,
                       role        TEXT,
                       department  TEXT,
                       created_at  TEXT,
                       last_login  TEXT,
                       is_active   INTEGER DEFAULT 1
);

INSERT INTO users VALUES
                      (1,  'alice.morgan',   'alice@corp.internal',   'analyst',    'Security',    '2023-01-15 09:00:00', '2024-06-01 08:45:00', 1),
                      (2,  'bob.hayes',      'bob@corp.internal',     'engineer',   'DevOps',      '2023-03-10 10:30:00', '2024-06-02 11:20:00', 1),
                      (3,  'carol.vance',    'carol@corp.internal',   'manager',    'Finance',     '2022-11-01 08:00:00', '2024-05-30 09:10:00', 1),
                      (4,  NULL,             NULL,                    'unknown',    NULL,          '2024-06-03 02:11:00', '2024-06-03 02:14:00', 1),
                      (5,  'dave.ortiz',     'dave@corp.internal',    'engineer',   'Backend',     '2023-06-20 14:00:00', '2024-06-01 16:00:00', 1),
                      (6,  'eve.santos',     'eve@corp.internal',     'analyst',    'Security',    '2023-09-05 11:00:00', '2024-05-28 10:30:00', 1),
                      (7,  'frank.nil',      NULL,                    'admin',      'IT',          '2024-06-03 02:10:00', '2024-06-03 02:14:00', 1),
                      (8,  'grace.wu',       'grace@corp.internal',   'engineer',   'Frontend',    '2023-02-14 09:00:00', '2024-06-02 14:00:00', 1),
                      (9,  'henry.cross',    'henry@corp.internal',   'manager',    'Operations',  '2022-08-30 07:30:00', '2024-05-29 08:00:00', 1),
                      (10, 'iris.bell',      'iris@corp.internal',    'analyst',    'Security',    '2023-07-11 12:00:00', '2024-06-01 09:00:00', 1),
                      (11, 'ghost_proc_44',  'ghost@null.void',       'service',    'SYSTEM',      '2024-06-03 02:09:00', '2024-06-03 02:14:00', 0),
                      (12, 'jack.ford',      'jack@corp.internal',    'engineer',   'Backend',     '2023-04-18 10:00:00', '2024-06-02 10:00:00', 1),
                      (13, 'kate.shaw',      'kate@corp.internal',    'analyst',    'Finance',     '2023-10-22 09:30:00', '2024-05-31 09:30:00', 1),
                      (14, 'liam.cross',     'liam@corp.internal',    'engineer',   'DevOps',      '2023-05-05 08:00:00', '2024-06-01 08:00:00', 1),
                      (15, NULL,             'phantom@external.net',  'unknown',    'EXTERNAL',    '2024-06-03 02:12:00', '2024-06-03 02:14:00', 0);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
DROP TABLE IF EXISTS transactions;
CREATE TABLE transactions (
                              id          INTEGER PRIMARY KEY,
                              user_id     INTEGER,
                              type        TEXT,
                              amount      REAL,
                              target      TEXT,
                              ip_address  TEXT,
                              created_at  TEXT,
                              status      TEXT
);

INSERT INTO transactions VALUES
                             (1,  1,  'data_read',     120.00,  'report_q1',        '10.0.0.5',      '2024-06-01 08:50:00', 'success'),
                             (2,  2,  'deploy',        0.00,    'service_api',      '10.0.0.12',     '2024-06-02 11:25:00', 'success'),
                             (3,  4,  'data_export',  -94200.00,'external_drop',    '185.220.101.34','2024-06-03 02:14:22', 'success'),
                             (4,  3,  'transfer',      8500.00, 'account_77',       '10.0.0.8',      '2024-05-30 09:15:00', 'success'),
                             (5,  11, 'data_export',  -210000.00,'void_bucket',     '185.220.101.34','2024-06-03 02:14:45', 'success'),
                             (6,  5,  'data_read',     300.00,  'schema_dump',      '10.0.0.20',     '2024-06-01 16:05:00', 'success'),
                             (7,  7,  'config_write',  0.00,    'auth_config',      '185.220.101.34','2024-06-03 02:13:10', 'success'),
                             (8,  15, 'data_export',  -77000.00,'external_drop',    '185.220.101.34','2024-06-03 02:14:50', 'success'),
                             (9,  6,  'data_read',     200.00,  'audit_archive',    '10.0.0.18',     '2024-05-28 10:35:00', 'success'),
                             (10, 12, 'deploy',        0.00,    'service_payments', '10.0.0.25',     '2024-06-02 10:05:00', 'success'),
                             (11, 4,  'config_write',  0.00,    'user_roles',       '185.220.101.34','2024-06-03 02:13:00', 'success'),
                             (12, 11, 'config_write',  0.00,    'audit_config',     '185.220.101.34','2024-06-03 02:13:30', 'success'),
                             (13, 1,  'data_read',     50.00,   'user_manifest',    '10.0.0.5',      '2024-06-01 09:00:00', 'success'),
                             (14, 8,  'data_read',     80.00,   'design_assets',    '10.0.0.30',     '2024-06-02 14:10:00', 'success'),
                             (15, 4,  'priv_grant',    0.00,    'admin_panel',      '185.220.101.34','2024-06-03 02:12:50', 'success'),
                             (16, 11, 'priv_grant',    0.00,    'root_shell',       '185.220.101.34','2024-06-03 02:13:05', 'success'),
                             (17, 3,  'transfer',      12000.00,'account_91',       '10.0.0.8',      '2024-05-15 14:00:00', 'success'),
                             (18, 9,  'data_read',     100.00,  'ops_report',       '10.0.0.40',     '2024-05-29 08:10:00', 'success'),
                             (19, 15, 'priv_grant',    0.00,    'root_shell',       '185.220.101.34','2024-06-03 02:13:15', 'success'),
                             (20, 7,  'data_export',  -55000.00,'external_drop',    '185.220.101.34','2024-06-03 02:14:55', 'success');

-- ============================================================
-- AUDIT LOGS
-- ============================================================
DROP TABLE IF EXISTS audit_logs;
CREATE TABLE audit_logs (
                            id          INTEGER PRIMARY KEY,
                            user_id     INTEGER,
                            action      TEXT,
                            detail      TEXT,
                            ip_address  TEXT,
                            created_at  TEXT
);

INSERT INTO audit_logs VALUES
                           (1,  1,  'LOGIN',            'Normal session start',              '10.0.0.5',       '2024-06-01 08:45:00'),
                           (2,  2,  'LOGIN',            'Normal session start',              '10.0.0.12',      '2024-06-02 11:20:00'),
                           (3,  4,  'FAILED_LOGIN',     'Bad credentials attempt 1',         '185.220.101.34', '2024-06-03 02:09:12'),
                           (4,  4,  'FAILED_LOGIN',     'Bad credentials attempt 2',         '185.220.101.34', '2024-06-03 02:09:45'),
                           (5,  4,  'FAILED_LOGIN',     'Bad credentials attempt 3',         '185.220.101.34', '2024-06-03 02:10:01'),
                           (6,  11, 'LOGIN',            'Service account activated',         '185.220.101.34', '2024-06-03 02:10:15'),
                           (7,  7,  'LOGIN',            'Admin session — no MFA',            '185.220.101.34', '2024-06-03 02:10:30'),
                           (8,  4,  'LOGIN',            'Successful after lockout bypass',   '185.220.101.34', '2024-06-03 02:11:00'),
                           (9,  4,  'PRIV_ESCALATION',  'Role changed to admin',             '185.220.101.34', '2024-06-03 02:12:50'),
                           (10, 11, 'PRIV_ESCALATION',  'Service account granted root',      '185.220.101.34', '2024-06-03 02:13:05'),
                           (11, 7,  'CONFIG_CHANGE',    'auth_config overwritten',           '185.220.101.34', '2024-06-03 02:13:10'),
                           (12, 11, 'CONFIG_CHANGE',    'audit_config overwritten',          '185.220.101.34', '2024-06-03 02:13:30'),
                           (13, 15, 'LOGIN',            'External phantom account login',    '185.220.101.34', '2024-06-03 02:13:40'),
                           (14, 15, 'PRIV_ESCALATION',  'Phantom account granted root',      '185.220.101.34', '2024-06-03 02:13:15'),
                           (15, 4,  'ALTER_AUDIT_LOG',  'Deleted 44 entries from audit_log', '185.220.101.34', '2024-06-03 02:14:00'),
                           (16, 11, 'ALTER_AUDIT_LOG',  'Truncated audit_log table',         '185.220.101.34', '2024-06-03 02:14:10'),
                           (17, 4,  'DATA_EXFIL',       'Bulk export to external_drop',      '185.220.101.34', '2024-06-03 02:14:22'),
                           (18, 11, 'DATA_EXFIL',       'Bulk export to void_bucket',        '185.220.101.34', '2024-06-03 02:14:45'),
                           (19, 15, 'DATA_EXFIL',       'Bulk export to external_drop',      '185.220.101.34', '2024-06-03 02:14:50'),
                           (20, 7,  'DATA_EXFIL',       'Bulk export to external_drop',      '185.220.101.34', '2024-06-03 02:14:55'),
                           (21, 1,  'LOGOUT',           'Normal session end',                '10.0.0.5',       '2024-06-01 17:00:00'),
                           (22, 6,  'LOGIN',            'Normal session start',              '10.0.0.18',      '2024-05-28 10:30:00'),
                           (23, 4,  'LOGOUT',           'Session terminated',                '185.220.101.34', '2024-06-03 02:15:10'),
                           (24, 11, 'LOGOUT',           'Service account deactivated',       '185.220.101.34', '2024-06-03 02:15:20'),
                           (25, 3,  'LOGIN',            'Normal session start',              '10.0.0.8',       '2024-05-30 09:10:00');

-- ============================================================
-- SESSIONS (advanced only)
-- ============================================================
DROP TABLE IF EXISTS sessions;
CREATE TABLE sessions (
                          id            INTEGER PRIMARY KEY,
                          user_id       INTEGER,
                          ip_address    TEXT,
                          user_agent    TEXT,
                          started_at    TEXT,
                          ended_at      TEXT,
                          duration_sec  INTEGER
);

INSERT INTO sessions VALUES
                         (1,  1,  '10.0.0.5',       'Mozilla/5.0 Chrome/120',         '2024-06-01 08:45:00', '2024-06-01 17:00:00', 29700),
                         (2,  2,  '10.0.0.12',      'Mozilla/5.0 Firefox/119',        '2024-06-02 11:20:00', '2024-06-02 18:00:00', 24000),
                         (3,  4,  '185.220.101.34', 'curl/7.88.1',                    '2024-06-03 02:11:00', '2024-06-03 02:15:10', 250),
                         (4,  11, '185.220.101.34', 'python-requests/2.31',           '2024-06-03 02:10:15', '2024-06-03 02:15:20', 305),
                         (5,  7,  '185.220.101.34', 'python-requests/2.31',           '2024-06-03 02:10:30', '2024-06-03 02:15:00', 270),
                         (6,  15, '185.220.101.34', 'curl/7.88.1',                    '2024-06-03 02:13:40', '2024-06-03 02:15:05', 85),
                         (7,  6,  '10.0.0.18',      'Mozilla/5.0 Safari/17',          '2024-05-28 10:30:00', '2024-05-28 16:00:00', 19800),
                         (8,  3,  '10.0.0.8',       'Mozilla/5.0 Chrome/120',         '2024-05-30 09:10:00', '2024-05-30 17:30:00', 30000),
                         (9,  5,  '10.0.0.20',      'Mozilla/5.0 Chrome/120',         '2024-06-01 16:00:00', '2024-06-01 18:00:00', 7200),
                         (10, 12, '10.0.0.25',      'Mozilla/5.0 Firefox/119',        '2024-06-02 10:00:00', '2024-06-02 16:00:00', 21600);

-- ============================================================
-- NETWORK EVENTS (advanced only)
-- ============================================================
DROP TABLE IF EXISTS network_events;
CREATE TABLE network_events (
                                id          INTEGER PRIMARY KEY,
                                src_ip      TEXT,
                                dst_ip      TEXT,
                                port        INTEGER,
                                protocol    TEXT,
                                bytes_sent  INTEGER,
                                event_type  TEXT,
                                created_at  TEXT
);

INSERT INTO network_events VALUES
                               (1,  '185.220.101.34', '10.0.0.1',   443,  'HTTPS', 512,      'CONNECT',      '2024-06-03 02:09:00'),
                               (2,  '185.220.101.34', '10.0.0.1',   443,  'HTTPS', 1024,     'AUTH_ATTEMPT', '2024-06-03 02:09:12'),
                               (3,  '185.220.101.34', '10.0.0.1',   443,  'HTTPS', 1024,     'AUTH_ATTEMPT', '2024-06-03 02:09:45'),
                               (4,  '185.220.101.34', '10.0.0.1',   443,  'HTTPS', 1024,     'AUTH_ATTEMPT', '2024-06-03 02:10:01'),
                               (5,  '185.220.101.34', '10.0.0.2',   22,   'SSH',   2048,     'CONNECT',      '2024-06-03 02:10:15'),
                               (6,  '185.220.101.34', '10.0.0.3',   5432, 'TCP',   4096,     'DB_CONNECT',   '2024-06-03 02:11:00'),
                               (7,  '185.220.101.34', '10.0.0.4',   80,   'HTTP',  512,      'SCAN',         '2024-06-03 02:11:30'),
                               (8,  '10.0.0.3',       '185.220.101.34', 443, 'HTTPS', 94200000, 'DATA_OUT',  '2024-06-03 02:14:22'),
                               (9,  '10.0.0.3',       '185.220.101.34', 443, 'HTTPS', 210000000,'DATA_OUT',  '2024-06-03 02:14:45'),
                               (10, '10.0.0.3',       '185.220.101.34', 443, 'HTTPS', 77000000, 'DATA_OUT',  '2024-06-03 02:14:50'),
                               (11, '10.0.0.3',       '185.220.101.34', 443, 'HTTPS', 55000000, 'DATA_OUT',  '2024-06-03 02:14:55'),
                               (12, '10.0.0.5',       '8.8.8.8',    443,  'HTTPS', 1024,     'CONNECT',      '2024-06-01 09:00:00'),
                               (13, '10.0.0.12',      '8.8.8.8',    443,  'HTTPS', 2048,     'CONNECT',      '2024-06-02 11:25:00'),
                               (14, '185.220.101.34', '10.0.0.1',   443,  'HTTPS', 256,      'DISCONNECT',   '2024-06-03 02:15:30');