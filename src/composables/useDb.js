let _alasql = null
let _seedPromise = null

// ── Normalise AlaSQL result → {columns, values} (same shape as old sql.js) ──
function normalise(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return []
    const columns = Object.keys(rows[0])
    const values = rows.map(row => columns.map(c => {
        const v = row[c];
        return v === undefined ? null : v
    }))
    return [{columns, values}]
}

// ── MySQL command rewriter ────────────────────────────────────────────────────
// IMPORTANT: 'DEFAULT' is reserved in AlaSQL — alias it as col_default.
function rewrite(sql) {
    const s = sql.trim()

    if (/^SHOW\s+TABLES\s*;?$/i.test(s)) {
        return `SELECT 'users' AS Tables_in_ghostdb
                UNION ALL SELECT 'transactions'
                UNION ALL SELECT 'audit_logs'
                UNION ALL SELECT 'sessions'
                UNION ALL SELECT 'network_events'`
    }

    const descMatch = s.match(/^(?:DESCRIBE|DESC)\s+(\w+)\s*;?$/i)
    if (descMatch) {
        const tbl = descMatch[1].toLowerCase()
        const schemas = {
            users: [['id', 'INT'], ['username', 'VARCHAR(100)'], ['email', 'VARCHAR(100)'], ['role', 'VARCHAR(50)'], ['department', 'VARCHAR(100)'], ['created_at', 'VARCHAR(30)'], ['last_login', 'VARCHAR(30)'], ['is_active', 'INT']],
            transactions: [['id', 'INT'], ['user_id', 'INT'], ['type', 'VARCHAR(50)'], ['amount', 'FLOAT'], ['target', 'VARCHAR(100)'], ['ip_address', 'VARCHAR(50)'], ['created_at', 'VARCHAR(30)'], ['status', 'VARCHAR(20)']],
            audit_logs: [['id', 'INT'], ['user_id', 'INT'], ['action', 'VARCHAR(50)'], ['detail', 'VARCHAR(255)'], ['ip_address', 'VARCHAR(50)'], ['created_at', 'VARCHAR(30)']],
            sessions: [['id', 'INT'], ['user_id', 'INT'], ['ip_address', 'VARCHAR(50)'], ['user_agent', 'VARCHAR(255)'], ['started_at', 'VARCHAR(30)'], ['ended_at', 'VARCHAR(30)'], ['duration_sec', 'INT']],
            network_events: [['id', 'INT'], ['src_ip', 'VARCHAR(50)'], ['dst_ip', 'VARCHAR(50)'], ['port', 'INT'], ['protocol', 'VARCHAR(10)'], ['bytes_sent', 'INT'], ['event_type', 'VARCHAR(30)'], ['created_at', 'VARCHAR(30)']],
        }
        const cols = schemas[tbl]
        if (!cols) throw new Error(`Unknown table: ${tbl}`)
        const rows = cols.map(([name, type]) =>
            `SELECT '${name}' AS Field, '${type}' AS Type, 'YES' AS Nullable, '' AS Key_col, 'NULL' AS col_default, '' AS Extra`
        )
        return rows.join(' UNION ALL ')
    }

    const showColMatch = s.match(/^SHOW\s+COLUMNS\s+FROM\s+(\w+)\s*;?$/i)
    if (showColMatch) return rewrite(`DESCRIBE ${showColMatch[1]}`)

    return sql
}

// ── Row insert helper — explicit VALUES() avoids AlaSQL array-binding bugs ───
function insertRows(table, cols, rows) {
    const colList = cols.join(', ')
    for (const row of rows) {
        const vals = row.map(v => {
            if (v === null || v === undefined) return 'NULL'
            if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`
            return String(v)
        }).join(', ')
        _alasql(`INSERT INTO ${table} (${colList})
                 VALUES (${vals})`)
    }
}

// ── Seed ──────────────────────────────────────────────────────────────────────
function seed() {
    for (const t of ['users', 'transactions', 'audit_logs', 'sessions', 'network_events']) {
        try {
            _alasql(`DROP TABLE IF EXISTS ${t}`)
        } catch (_) {
        }
    }

    _alasql(`CREATE TABLE users
             (
                 id         INT,
                 username   VARCHAR(100),
                 email      VARCHAR(100),
                 role       VARCHAR(50),
                 department VARCHAR(100),
                 created_at VARCHAR(30),
                 last_login VARCHAR(30),
                 is_active  INT
             )`)
    insertRows('users', ['id', 'username', 'email', 'role', 'department', 'created_at', 'last_login', 'is_active'], [
        [1, 'alice.morgan', 'alice@corp.internal', 'analyst', 'Security', '2023-01-15 09:00:00', '2024-06-01 08:45:00', 1],
        [2, 'bob.hayes', 'bob@corp.internal', 'engineer', 'DevOps', '2023-03-10 10:30:00', '2024-06-02 11:20:00', 1],
        [3, 'carol.vance', 'carol@corp.internal', 'manager', 'Finance', '2022-11-01 08:00:00', '2024-05-30 09:10:00', 1],
        [4, null, null, 'unknown', null, '2024-06-03 02:11:00', '2024-06-03 02:14:00', 1],
        [5, 'dave.ortiz', 'dave@corp.internal', 'engineer', 'Backend', '2023-06-20 14:00:00', '2024-06-01 16:00:00', 1],
        [6, 'eve.santos', 'eve@corp.internal', 'analyst', 'Security', '2023-09-05 11:00:00', '2024-05-28 10:30:00', 1],
        [7, 'frank.nil', null, 'admin', 'IT', '2024-06-03 02:10:00', '2024-06-03 02:14:00', 1],
        [8, 'grace.wu', 'grace@corp.internal', 'engineer', 'Frontend', '2023-02-14 09:00:00', '2024-06-02 14:00:00', 1],
        [9, 'henry.cross', 'henry@corp.internal', 'manager', 'Operations', '2022-08-30 07:30:00', '2024-05-29 08:00:00', 1],
        [10, 'iris.bell', 'iris@corp.internal', 'analyst', 'Security', '2023-07-11 12:00:00', '2024-06-01 09:00:00', 1],
        [11, 'ghost_proc_44', 'ghost@null.void', 'service', 'SYSTEM', '2024-06-03 02:09:00', '2024-06-03 02:14:00', 0],
        [12, 'jack.ford', 'jack@corp.internal', 'engineer', 'Backend', '2023-04-18 10:00:00', '2024-06-02 10:00:00', 1],
        [13, 'kate.shaw', 'kate@corp.internal', 'analyst', 'Finance', '2023-10-22 09:30:00', '2024-05-31 09:30:00', 1],
        [14, 'liam.cross', 'liam@corp.internal', 'engineer', 'DevOps', '2023-05-05 08:00:00', '2024-06-01 08:00:00', 1],
        [15, null, 'phantom@external.net', 'unknown', 'EXTERNAL', '2024-06-03 02:12:00', '2024-06-03 02:14:00', 0],
    ])

    _alasql(`CREATE TABLE transactions
             (
                 id         INT,
                 user_id    INT,
                 type       VARCHAR(50),
                 amount     FLOAT,
                 target     VARCHAR(100),
                 ip_address VARCHAR(50),
                 created_at VARCHAR(30),
                 status     VARCHAR(20)
             )`)
    insertRows('transactions', ['id', 'user_id', 'type', 'amount', 'target', 'ip_address', 'created_at', 'status'], [
        [1, 1, 'data_read', 120.00, 'report_q1', '10.0.0.5', '2024-06-01 08:50:00', 'success'],
        [2, 2, 'deploy', 0.00, 'service_api', '10.0.0.12', '2024-06-02 11:25:00', 'success'],
        [3, 4, 'data_export', -94200.00, 'external_drop', '185.220.101.34', '2024-06-03 02:14:22', 'success'],
        [4, 3, 'transfer', 8500.00, 'account_77', '10.0.0.8', '2024-05-30 09:15:00', 'success'],
        [5, 11, 'data_export', -210000.00, 'void_bucket', '185.220.101.34', '2024-06-03 02:14:45', 'success'],
        [6, 5, 'data_read', 300.00, 'schema_dump', '10.0.0.20', '2024-06-01 16:05:00', 'success'],
        [7, 7, 'config_write', 0.00, 'auth_config', '185.220.101.34', '2024-06-03 02:13:10', 'success'],
        [8, 15, 'data_export', -77000.00, 'external_drop', '185.220.101.34', '2024-06-03 02:14:50', 'success'],
        [9, 6, 'data_read', 200.00, 'audit_archive', '10.0.0.18', '2024-05-28 10:35:00', 'success'],
        [10, 12, 'deploy', 0.00, 'service_payments', '10.0.0.25', '2024-06-02 10:05:00', 'success'],
        [11, 4, 'config_write', 0.00, 'user_roles', '185.220.101.34', '2024-06-03 02:13:00', 'success'],
        [12, 11, 'config_write', 0.00, 'audit_config', '185.220.101.34', '2024-06-03 02:13:30', 'success'],
        [13, 1, 'data_read', 50.00, 'user_manifest', '10.0.0.5', '2024-06-01 09:00:00', 'success'],
        [14, 8, 'data_read', 80.00, 'design_assets', '10.0.0.30', '2024-06-02 14:10:00', 'success'],
        [15, 4, 'priv_grant', 0.00, 'admin_panel', '185.220.101.34', '2024-06-03 02:12:50', 'success'],
        [16, 11, 'priv_grant', 0.00, 'root_shell', '185.220.101.34', '2024-06-03 02:13:05', 'success'],
        [17, 3, 'transfer', 12000.00, 'account_91', '10.0.0.8', '2024-05-15 14:00:00', 'success'],
        [18, 9, 'data_read', 100.00, 'ops_report', '10.0.0.40', '2024-05-29 08:10:00', 'success'],
        [19, 15, 'priv_grant', 0.00, 'root_shell', '185.220.101.34', '2024-06-03 02:13:15', 'success'],
        [20, 7, 'data_export', -55000.00, 'external_drop', '185.220.101.34', '2024-06-03 02:14:55', 'success'],
    ])

    _alasql(`CREATE TABLE audit_logs
             (
                 id         INT,
                 user_id    INT,
                 action     VARCHAR(50),
                 detail     VARCHAR(255),
                 ip_address VARCHAR(50),
                 created_at VARCHAR(30)
             )`)
    insertRows('audit_logs', ['id', 'user_id', 'action', 'detail', 'ip_address', 'created_at'], [
        [1, 1, 'LOGIN', 'Normal session start', '10.0.0.5', '2024-06-01 08:45:00'],
        [2, 2, 'LOGIN', 'Normal session start', '10.0.0.12', '2024-06-02 11:20:00'],
        [3, 4, 'FAILED_LOGIN', 'Bad credentials attempt 1', '185.220.101.34', '2024-06-03 02:09:12'],
        [4, 4, 'FAILED_LOGIN', 'Bad credentials attempt 2', '185.220.101.34', '2024-06-03 02:09:45'],
        [5, 4, 'FAILED_LOGIN', 'Bad credentials attempt 3', '185.220.101.34', '2024-06-03 02:10:01'],
        [6, 11, 'LOGIN', 'Service account activated', '185.220.101.34', '2024-06-03 02:10:15'],
        [7, 7, 'LOGIN', 'Admin session no MFA', '185.220.101.34', '2024-06-03 02:10:30'],
        [8, 4, 'LOGIN', 'Successful after lockout bypass', '185.220.101.34', '2024-06-03 02:11:00'],
        [9, 4, 'PRIV_ESCALATION', 'Role changed to admin', '185.220.101.34', '2024-06-03 02:12:50'],
        [10, 11, 'PRIV_ESCALATION', 'Service account granted root', '185.220.101.34', '2024-06-03 02:13:05'],
        [11, 7, 'CONFIG_CHANGE', 'auth_config overwritten', '185.220.101.34', '2024-06-03 02:13:10'],
        [12, 11, 'CONFIG_CHANGE', 'audit_config overwritten', '185.220.101.34', '2024-06-03 02:13:30'],
        [13, 15, 'LOGIN', 'External phantom account login', '185.220.101.34', '2024-06-03 02:13:40'],
        [14, 15, 'PRIV_ESCALATION', 'Phantom account granted root', '185.220.101.34', '2024-06-03 02:13:15'],
        [15, 4, 'ALTER_AUDIT_LOG', 'Deleted 44 entries from audit_log', '185.220.101.34', '2024-06-03 02:14:00'],
        [16, 11, 'ALTER_AUDIT_LOG', 'Truncated audit_log table', '185.220.101.34', '2024-06-03 02:14:10'],
        [17, 4, 'DATA_EXFIL', 'Bulk export to external_drop', '185.220.101.34', '2024-06-03 02:14:22'],
        [18, 11, 'DATA_EXFIL', 'Bulk export to void_bucket', '185.220.101.34', '2024-06-03 02:14:45'],
        [19, 15, 'DATA_EXFIL', 'Bulk export to external_drop', '185.220.101.34', '2024-06-03 02:14:50'],
        [20, 7, 'DATA_EXFIL', 'Bulk export to external_drop', '185.220.101.34', '2024-06-03 02:14:55'],
        [21, 1, 'LOGOUT', 'Normal session end', '10.0.0.5', '2024-06-01 17:00:00'],
        [22, 6, 'LOGIN', 'Normal session start', '10.0.0.18', '2024-05-28 10:30:00'],
        [23, 4, 'LOGOUT', 'Session terminated', '185.220.101.34', '2024-06-03 02:15:10'],
        [24, 11, 'LOGOUT', 'Service account deactivated', '185.220.101.34', '2024-06-03 02:15:20'],
        [25, 3, 'LOGIN', 'Normal session start', '10.0.0.8', '2024-05-30 09:10:00'],
    ])

    _alasql(`CREATE TABLE sessions
             (
                 id           INT,
                 user_id      INT,
                 ip_address   VARCHAR(50),
                 user_agent   VARCHAR(255),
                 started_at   VARCHAR(30),
                 ended_at     VARCHAR(30),
                 duration_sec INT
             )`)
    insertRows('sessions', ['id', 'user_id', 'ip_address', 'user_agent', 'started_at', 'ended_at', 'duration_sec'], [
        [1, 1, '10.0.0.5', 'Mozilla/5.0 Chrome/120', '2024-06-01 08:45:00', '2024-06-01 17:00:00', 29700],
        [2, 2, '10.0.0.12', 'Mozilla/5.0 Firefox/119', '2024-06-02 11:20:00', '2024-06-02 18:00:00', 24000],
        [3, 4, '185.220.101.34', 'curl/7.88.1', '2024-06-03 02:11:00', '2024-06-03 02:15:10', 250],
        [4, 11, '185.220.101.34', 'python-requests/2.31', '2024-06-03 02:10:15', '2024-06-03 02:15:20', 305],
        [5, 7, '185.220.101.34', 'python-requests/2.31', '2024-06-03 02:10:30', '2024-06-03 02:15:00', 270],
        [6, 15, '185.220.101.34', 'curl/7.88.1', '2024-06-03 02:13:40', '2024-06-03 02:15:05', 85],
        [7, 6, '10.0.0.18', 'Mozilla/5.0 Safari/17', '2024-05-28 10:30:00', '2024-05-28 16:00:00', 19800],
        [8, 3, '10.0.0.8', 'Mozilla/5.0 Chrome/120', '2024-05-30 09:10:00', '2024-05-30 17:30:00', 30000],
        [9, 5, '10.0.0.20', 'Mozilla/5.0 Chrome/120', '2024-06-01 16:00:00', '2024-06-01 18:00:00', 7200],
        [10, 12, '10.0.0.25', 'Mozilla/5.0 Firefox/119', '2024-06-02 10:00:00', '2024-06-02 16:00:00', 21600],
    ])

    _alasql(`CREATE TABLE network_events
             (
                 id         INT,
                 src_ip     VARCHAR(50),
                 dst_ip     VARCHAR(50),
                 port       INT,
                 protocol   VARCHAR(10),
                 bytes_sent INT,
                 event_type VARCHAR(30),
                 created_at VARCHAR(30)
             )`)
    insertRows('network_events', ['id', 'src_ip', 'dst_ip', 'port', 'protocol', 'bytes_sent', 'event_type', 'created_at'], [
        [1, '185.220.101.34', '10.0.0.1', 443, 'HTTPS', 512, 'CONNECT', '2024-06-03 02:09:00'],
        [2, '185.220.101.34', '10.0.0.1', 443, 'HTTPS', 1024, 'AUTH_ATTEMPT', '2024-06-03 02:09:12'],
        [3, '185.220.101.34', '10.0.0.1', 443, 'HTTPS', 1024, 'AUTH_ATTEMPT', '2024-06-03 02:09:45'],
        [4, '185.220.101.34', '10.0.0.1', 443, 'HTTPS', 1024, 'AUTH_ATTEMPT', '2024-06-03 02:10:01'],
        [5, '185.220.101.34', '10.0.0.2', 22, 'SSH', 2048, 'CONNECT', '2024-06-03 02:10:15'],
        [6, '185.220.101.34', '10.0.0.3', 3306, 'TCP', 4096, 'DB_CONNECT', '2024-06-03 02:11:00'],
        [7, '185.220.101.34', '10.0.0.4', 80, 'HTTP', 512, 'SCAN', '2024-06-03 02:11:30'],
        [8, '10.0.0.3', '185.220.101.34', 443, 'HTTPS', 94200000, 'DATA_OUT', '2024-06-03 02:14:22'],
        [9, '10.0.0.3', '185.220.101.34', 443, 'HTTPS', 210000000, 'DATA_OUT', '2024-06-03 02:14:45'],
        [10, '10.0.0.3', '185.220.101.34', 443, 'HTTPS', 77000000, 'DATA_OUT', '2024-06-03 02:14:50'],
        [11, '10.0.0.3', '185.220.101.34', 443, 'HTTPS', 55000000, 'DATA_OUT', '2024-06-03 02:14:55'],
        [12, '10.0.0.5', '8.8.8.8', 443, 'HTTPS', 1024, 'CONNECT', '2024-06-01 09:00:00'],
        [13, '10.0.0.12', '8.8.8.8', 443, 'HTTPS', 2048, 'CONNECT', '2024-06-02 11:25:00'],
        [14, '185.220.101.34', '10.0.0.1', 443, 'HTTPS', 256, 'DISCONNECT', '2024-06-03 02:15:30'],
    ])
}

// ── Public API ────────────────────────────────────────────────────────────────
export function useDb() {
    if (!_seedPromise) {
        _seedPromise = import('alasql').then(mod => {
            _alasql = mod.default
            seed()
        })
    }

    return {
        async exec(rawSql) {
            await _seedPromise
            const sql = rewrite(rawSql.trim())

            // Split on ; not inside single-quoted strings
            const statements = []
            let cur = '', inStr = false
            for (let i = 0; i < sql.length; i++) {
                const ch = sql[i]
                if (ch === "'" && sql[i - 1] !== '\\') inStr = !inStr
                if (ch === ';' && !inStr) {
                    if (cur.trim()) statements.push(cur.trim())
                    cur = ''
                } else {
                    cur += ch
                }
            }
            if (cur.trim()) statements.push(cur.trim())

            let last = []
            for (const stmt of statements) {
                if (!stmt) continue
                try {
                    const result = _alasql(stmt)
                    if (Array.isArray(result)) last = normalise(result)
                    else last = []
                } catch (e) {
                    throw new Error(`${e.message}\n→ in statement: ${stmt.slice(0, 120)}`)
                }
            }
            return last
        },
        async isReady() {
            await _seedPromise;
            return true
        }
    }
}
