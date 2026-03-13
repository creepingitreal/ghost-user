// Uses AlaSQL — pure JS in-browser SQL with MySQL-compatible syntax.
// Supports: SHOW TABLES, DESCRIBE, SHOW COLUMNS FROM, AUTO_INCREMENT,
//           JOIN, GROUP BY, HAVING, LEFT JOIN, COALESCE, WITH (CTE), etc.

import alasql from 'alasql'

let _seeded = false
let _seedPromise = null

// AlaSQL returns plain JS arrays of objects: [{ col: val, ... }, ...]
// We normalise that into the same {columns, values} shape sql.js used,
// so ResultsTable.vue and all validators work without changes.
function normalise(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return []
    const columns = Object.keys(rows[0])
    const values  = rows.map(row => columns.map(c => row[c] ?? null))
    return [{ columns, values }]
}

// AlaSQL executes synchronously — wrap in a resolved promise so the
// call-sites (which use await db.exec()) keep working unchanged.
function execSync(sql) {
    const trimmed = sql.trim()

    // AlaSQL doesn't support semicolon-separated multi-statement strings
    // in a single call the way sql.js does, so split and run each one.
    // Preserve string literals by splitting only on ; followed by whitespace/end.
    const statements = trimmed
        .split(/;\s*(?=\S|$)/)
        .map(s => s.trim())
        .filter(s => s.length > 0)

    let lastResult = null

    for (const stmt of statements) {
        try {
            const result = alasql(stmt)
            // Only capture SELECT-like results (arrays of objects)
            if (Array.isArray(result)) {
                lastResult = normalise(result)
            } else if (result === 1 || result === true || typeof result === 'number') {
                // DDL / DML returns 1 or a count — treat as empty result set
                lastResult = []
            }
        } catch (e) {
            throw new Error(`${e.message}\n→ in statement: ${stmt.slice(0, 120)}`)
        }
    }

    return lastResult ?? []
}

async function seed() {
    // Drop and recreate tables so hot-reload doesn't leave stale state
    const tables = ['users', 'transactions', 'audit_logs', 'sessions', 'network_events']
    for (const t of tables) {
        try { alasql(`DROP TABLE IF EXISTS ${t}`) } catch (_) {}
    }

    // ── USERS ────────────────────────────────────────────────────────────────
    alasql(`CREATE TABLE users (
                                   id          INT,
                                   username    VARCHAR(100),
                                   email       VARCHAR(100),
                                   role        VARCHAR(50),
                                   department  VARCHAR(100),
                                   created_at  VARCHAR(30),
                                   last_login  VARCHAR(30),
                                   is_active   INT
            )`)

    const users = [
        [1,  'alice.morgan',   'alice@corp.internal',   'analyst',    'Security',    '2023-01-15 09:00:00', '2024-06-01 08:45:00', 1],
        [2,  'bob.hayes',      'bob@corp.internal',     'engineer',   'DevOps',      '2023-03-10 10:30:00', '2024-06-02 11:20:00', 1],
        [3,  'carol.vance',    'carol@corp.internal',   'manager',    'Finance',     '2022-11-01 08:00:00', '2024-05-30 09:10:00', 1],
        [4,  null,             null,                    'unknown',    null,          '2024-06-03 02:11:00', '2024-06-03 02:14:00', 1],
        [5,  'dave.ortiz',     'dave@corp.internal',    'engineer',   'Backend',     '2023-06-20 14:00:00', '2024-06-01 16:00:00', 1],
        [6,  'eve.santos',     'eve@corp.internal',     'analyst',    'Security',    '2023-09-05 11:00:00', '2024-05-28 10:30:00', 1],
        [7,  'frank.nil',      null,                    'admin',      'IT',          '2024-06-03 02:10:00', '2024-06-03 02:14:00', 1],
        [8,  'grace.wu',       'grace@corp.internal',   'engineer',   'Frontend',    '2023-02-14 09:00:00', '2024-06-02 14:00:00', 1],
        [9,  'henry.cross',    'henry@corp.internal',   'manager',    'Operations',  '2022-08-30 07:30:00', '2024-05-29 08:00:00', 1],
        [10, 'iris.bell',      'iris@corp.internal',    'analyst',    'Security',    '2023-07-11 12:00:00', '2024-06-01 09:00:00', 1],
        [11, 'ghost_proc_44',  'ghost@null.void',       'service',    'SYSTEM',      '2024-06-03 02:09:00', '2024-06-03 02:14:00', 0],
        [12, 'jack.ford',      'jack@corp.internal',    'engineer',   'Backend',     '2023-04-18 10:00:00', '2024-06-02 10:00:00', 1],
        [13, 'kate.shaw',      'kate@corp.internal',    'analyst',    'Finance',     '2023-10-22 09:30:00', '2024-05-31 09:30:00', 1],
        [14, 'liam.cross',     'liam@corp.internal',    'engineer',   'DevOps',      '2023-05-05 08:00:00', '2024-06-01 08:00:00', 1],
        [15, null,             'phantom@external.net',  'unknown',    'EXTERNAL',    '2024-06-03 02:12:00', '2024-06-03 02:14:00', 0],
    ]
    alasql('INSERT INTO users VALUES ?', [users.map(r => ({
        id: r[0], username: r[1], email: r[2], role: r[3],
        department: r[4], created_at: r[5], last_login: r[6], is_active: r[7]
    }))])

    // ── TRANSACTIONS ──────────────────────────────────────────────────────────
    alasql(`CREATE TABLE transactions (
                                          id          INT,
                                          user_id     INT,
                                          type        VARCHAR(50),
                                          amount      FLOAT,
                                          target      VARCHAR(100),
                                          ip_address  VARCHAR(50),
                                          created_at  VARCHAR(30),
                                          status      VARCHAR(20)
            )`)

    alasql('INSERT INTO transactions VALUES ?', [[
        {id:1,  user_id:1,  type:'data_read',     amount:120.00,      target:'report_q1',         ip_address:'10.0.0.5',       created_at:'2024-06-01 08:50:00', status:'success'},
        {id:2,  user_id:2,  type:'deploy',        amount:0.00,        target:'service_api',        ip_address:'10.0.0.12',      created_at:'2024-06-02 11:25:00', status:'success'},
        {id:3,  user_id:4,  type:'data_export',   amount:-94200.00,   target:'external_drop',      ip_address:'185.220.101.34', created_at:'2024-06-03 02:14:22', status:'success'},
        {id:4,  user_id:3,  type:'transfer',      amount:8500.00,     target:'account_77',         ip_address:'10.0.0.8',       created_at:'2024-05-30 09:15:00', status:'success'},
        {id:5,  user_id:11, type:'data_export',   amount:-210000.00,  target:'void_bucket',        ip_address:'185.220.101.34', created_at:'2024-06-03 02:14:45', status:'success'},
        {id:6,  user_id:5,  type:'data_read',     amount:300.00,      target:'schema_dump',        ip_address:'10.0.0.20',      created_at:'2024-06-01 16:05:00', status:'success'},
        {id:7,  user_id:7,  type:'config_write',  amount:0.00,        target:'auth_config',        ip_address:'185.220.101.34', created_at:'2024-06-03 02:13:10', status:'success'},
        {id:8,  user_id:15, type:'data_export',   amount:-77000.00,   target:'external_drop',      ip_address:'185.220.101.34', created_at:'2024-06-03 02:14:50', status:'success'},
        {id:9,  user_id:6,  type:'data_read',     amount:200.00,      target:'audit_archive',      ip_address:'10.0.0.18',      created_at:'2024-05-28 10:35:00', status:'success'},
        {id:10, user_id:12, type:'deploy',        amount:0.00,        target:'service_payments',   ip_address:'10.0.0.25',      created_at:'2024-06-02 10:05:00', status:'success'},
        {id:11, user_id:4,  type:'config_write',  amount:0.00,        target:'user_roles',         ip_address:'185.220.101.34', created_at:'2024-06-03 02:13:00', status:'success'},
        {id:12, user_id:11, type:'config_write',  amount:0.00,        target:'audit_config',       ip_address:'185.220.101.34', created_at:'2024-06-03 02:13:30', status:'success'},
        {id:13, user_id:1,  type:'data_read',     amount:50.00,       target:'user_manifest',      ip_address:'10.0.0.5',       created_at:'2024-06-01 09:00:00', status:'success'},
        {id:14, user_id:8,  type:'data_read',     amount:80.00,       target:'design_assets',      ip_address:'10.0.0.30',      created_at:'2024-06-02 14:10:00', status:'success'},
        {id:15, user_id:4,  type:'priv_grant',    amount:0.00,        target:'admin_panel',        ip_address:'185.220.101.34', created_at:'2024-06-03 02:12:50', status:'success'},
        {id:16, user_id:11, type:'priv_grant',    amount:0.00,        target:'root_shell',         ip_address:'185.220.101.34', created_at:'2024-06-03 02:13:05', status:'success'},
        {id:17, user_id:3,  type:'transfer',      amount:12000.00,    target:'account_91',         ip_address:'10.0.0.8',       created_at:'2024-05-15 14:00:00', status:'success'},
        {id:18, user_id:9,  type:'data_read',     amount:100.00,      target:'ops_report',         ip_address:'10.0.0.40',      created_at:'2024-05-29 08:10:00', status:'success'},
        {id:19, user_id:15, type:'priv_grant',    amount:0.00,        target:'root_shell',         ip_address:'185.220.101.34', created_at:'2024-06-03 02:13:15', status:'success'},
        {id:20, user_id:7,  type:'data_export',   amount:-55000.00,   target:'external_drop',      ip_address:'185.220.101.34', created_at:'2024-06-03 02:14:55', status:'success'},
    ]])

    // ── AUDIT_LOGS ────────────────────────────────────────────────────────────
    alasql(`CREATE TABLE audit_logs (
                                        id          INT,
                                        user_id     INT,
                                        action      VARCHAR(50),
                                        detail      VARCHAR(255),
                                        ip_address  VARCHAR(50),
                                        created_at  VARCHAR(30)
            )`)

    alasql('INSERT INTO audit_logs VALUES ?', [[
        {id:1,  user_id:1,  action:'LOGIN',            detail:'Normal session start',               ip_address:'10.0.0.5',       created_at:'2024-06-01 08:45:00'},
        {id:2,  user_id:2,  action:'LOGIN',            detail:'Normal session start',               ip_address:'10.0.0.12',      created_at:'2024-06-02 11:20:00'},
        {id:3,  user_id:4,  action:'FAILED_LOGIN',     detail:'Bad credentials attempt 1',          ip_address:'185.220.101.34', created_at:'2024-06-03 02:09:12'},
        {id:4,  user_id:4,  action:'FAILED_LOGIN',     detail:'Bad credentials attempt 2',          ip_address:'185.220.101.34', created_at:'2024-06-03 02:09:45'},
        {id:5,  user_id:4,  action:'FAILED_LOGIN',     detail:'Bad credentials attempt 3',          ip_address:'185.220.101.34', created_at:'2024-06-03 02:10:01'},
        {id:6,  user_id:11, action:'LOGIN',            detail:'Service account activated',          ip_address:'185.220.101.34', created_at:'2024-06-03 02:10:15'},
        {id:7,  user_id:7,  action:'LOGIN',            detail:'Admin session — no MFA',             ip_address:'185.220.101.34', created_at:'2024-06-03 02:10:30'},
        {id:8,  user_id:4,  action:'LOGIN',            detail:'Successful after lockout bypass',    ip_address:'185.220.101.34', created_at:'2024-06-03 02:11:00'},
        {id:9,  user_id:4,  action:'PRIV_ESCALATION',  detail:'Role changed to admin',              ip_address:'185.220.101.34', created_at:'2024-06-03 02:12:50'},
        {id:10, user_id:11, action:'PRIV_ESCALATION',  detail:'Service account granted root',       ip_address:'185.220.101.34', created_at:'2024-06-03 02:13:05'},
        {id:11, user_id:7,  action:'CONFIG_CHANGE',    detail:'auth_config overwritten',            ip_address:'185.220.101.34', created_at:'2024-06-03 02:13:10'},
        {id:12, user_id:11, action:'CONFIG_CHANGE',    detail:'audit_config overwritten',           ip_address:'185.220.101.34', created_at:'2024-06-03 02:13:30'},
        {id:13, user_id:15, action:'LOGIN',            detail:'External phantom account login',     ip_address:'185.220.101.34', created_at:'2024-06-03 02:13:40'},
        {id:14, user_id:15, action:'PRIV_ESCALATION',  detail:'Phantom account granted root',       ip_address:'185.220.101.34', created_at:'2024-06-03 02:13:15'},
        {id:15, user_id:4,  action:'ALTER_AUDIT_LOG',  detail:'Deleted 44 entries from audit_log',  ip_address:'185.220.101.34', created_at:'2024-06-03 02:14:00'},
        {id:16, user_id:11, action:'ALTER_AUDIT_LOG',  detail:'Truncated audit_log table',          ip_address:'185.220.101.34', created_at:'2024-06-03 02:14:10'},
        {id:17, user_id:4,  action:'DATA_EXFIL',       detail:'Bulk export to external_drop',       ip_address:'185.220.101.34', created_at:'2024-06-03 02:14:22'},
        {id:18, user_id:11, action:'DATA_EXFIL',       detail:'Bulk export to void_bucket',         ip_address:'185.220.101.34', created_at:'2024-06-03 02:14:45'},
        {id:19, user_id:15, action:'DATA_EXFIL',       detail:'Bulk export to external_drop',       ip_address:'185.220.101.34', created_at:'2024-06-03 02:14:50'},
        {id:20, user_id:7,  action:'DATA_EXFIL',       detail:'Bulk export to external_drop',       ip_address:'185.220.101.34', created_at:'2024-06-03 02:14:55'},
        {id:21, user_id:1,  action:'LOGOUT',           detail:'Normal session end',                 ip_address:'10.0.0.5',       created_at:'2024-06-01 17:00:00'},
        {id:22, user_id:6,  action:'LOGIN',            detail:'Normal session start',               ip_address:'10.0.0.18',      created_at:'2024-05-28 10:30:00'},
        {id:23, user_id:4,  action:'LOGOUT',           detail:'Session terminated',                 ip_address:'185.220.101.34', created_at:'2024-06-03 02:15:10'},
        {id:24, user_id:11, action:'LOGOUT',           detail:'Service account deactivated',        ip_address:'185.220.101.34', created_at:'2024-06-03 02:15:20'},
        {id:25, user_id:3,  action:'LOGIN',            detail:'Normal session start',               ip_address:'10.0.0.8',       created_at:'2024-05-30 09:10:00'},
    ]])

    // ── SESSIONS ──────────────────────────────────────────────────────────────
    alasql(`CREATE TABLE sessions (
                                      id            INT,
                                      user_id       INT,
                                      ip_address    VARCHAR(50),
                                      user_agent    VARCHAR(255),
                                      started_at    VARCHAR(30),
                                      ended_at      VARCHAR(30),
                                      duration_sec  INT
            )`)

    alasql('INSERT INTO sessions VALUES ?', [[
        {id:1,  user_id:1,  ip_address:'10.0.0.5',       user_agent:'Mozilla/5.0 Chrome/120',      started_at:'2024-06-01 08:45:00', ended_at:'2024-06-01 17:00:00', duration_sec:29700},
        {id:2,  user_id:2,  ip_address:'10.0.0.12',      user_agent:'Mozilla/5.0 Firefox/119',     started_at:'2024-06-02 11:20:00', ended_at:'2024-06-02 18:00:00', duration_sec:24000},
        {id:3,  user_id:4,  ip_address:'185.220.101.34', user_agent:'curl/7.88.1',                 started_at:'2024-06-03 02:11:00', ended_at:'2024-06-03 02:15:10', duration_sec:250},
        {id:4,  user_id:11, ip_address:'185.220.101.34', user_agent:'python-requests/2.31',        started_at:'2024-06-03 02:10:15', ended_at:'2024-06-03 02:15:20', duration_sec:305},
        {id:5,  user_id:7,  ip_address:'185.220.101.34', user_agent:'python-requests/2.31',        started_at:'2024-06-03 02:10:30', ended_at:'2024-06-03 02:15:00', duration_sec:270},
        {id:6,  user_id:15, ip_address:'185.220.101.34', user_agent:'curl/7.88.1',                 started_at:'2024-06-03 02:13:40', ended_at:'2024-06-03 02:15:05', duration_sec:85},
        {id:7,  user_id:6,  ip_address:'10.0.0.18',      user_agent:'Mozilla/5.0 Safari/17',       started_at:'2024-05-28 10:30:00', ended_at:'2024-05-28 16:00:00', duration_sec:19800},
        {id:8,  user_id:3,  ip_address:'10.0.0.8',       user_agent:'Mozilla/5.0 Chrome/120',      started_at:'2024-05-30 09:10:00', ended_at:'2024-05-30 17:30:00', duration_sec:30000},
        {id:9,  user_id:5,  ip_address:'10.0.0.20',      user_agent:'Mozilla/5.0 Chrome/120',      started_at:'2024-06-01 16:00:00', ended_at:'2024-06-01 18:00:00', duration_sec:7200},
        {id:10, user_id:12, ip_address:'10.0.0.25',      user_agent:'Mozilla/5.0 Firefox/119',     started_at:'2024-06-02 10:00:00', ended_at:'2024-06-02 16:00:00', duration_sec:21600},
    ]])

    // ── NETWORK_EVENTS ────────────────────────────────────────────────────────
    alasql(`CREATE TABLE network_events (
                                            id          INT,
                                            src_ip      VARCHAR(50),
                                            dst_ip      VARCHAR(50),
                                            port        INT,
                                            protocol    VARCHAR(10),
                                            bytes_sent  INT,
                                            event_type  VARCHAR(30),
                                            created_at  VARCHAR(30)
            )`)

    alasql('INSERT INTO network_events VALUES ?', [[
        {id:1,  src_ip:'185.220.101.34', dst_ip:'10.0.0.1',         port:443,  protocol:'HTTPS', bytes_sent:512,       event_type:'CONNECT',      created_at:'2024-06-03 02:09:00'},
        {id:2,  src_ip:'185.220.101.34', dst_ip:'10.0.0.1',         port:443,  protocol:'HTTPS', bytes_sent:1024,      event_type:'AUTH_ATTEMPT',  created_at:'2024-06-03 02:09:12'},
        {id:3,  src_ip:'185.220.101.34', dst_ip:'10.0.0.1',         port:443,  protocol:'HTTPS', bytes_sent:1024,      event_type:'AUTH_ATTEMPT',  created_at:'2024-06-03 02:09:45'},
        {id:4,  src_ip:'185.220.101.34', dst_ip:'10.0.0.1',         port:443,  protocol:'HTTPS', bytes_sent:1024,      event_type:'AUTH_ATTEMPT',  created_at:'2024-06-03 02:10:01'},
        {id:5,  src_ip:'185.220.101.34', dst_ip:'10.0.0.2',         port:22,   protocol:'SSH',   bytes_sent:2048,      event_type:'CONNECT',      created_at:'2024-06-03 02:10:15'},
        {id:6,  src_ip:'185.220.101.34', dst_ip:'10.0.0.3',         port:3306, protocol:'TCP',   bytes_sent:4096,      event_type:'DB_CONNECT',   created_at:'2024-06-03 02:11:00'},
        {id:7,  src_ip:'185.220.101.34', dst_ip:'10.0.0.4',         port:80,   protocol:'HTTP',  bytes_sent:512,       event_type:'SCAN',         created_at:'2024-06-03 02:11:30'},
        {id:8,  src_ip:'10.0.0.3',       dst_ip:'185.220.101.34',   port:443,  protocol:'HTTPS', bytes_sent:94200000,  event_type:'DATA_OUT',     created_at:'2024-06-03 02:14:22'},
        {id:9,  src_ip:'10.0.0.3',       dst_ip:'185.220.101.34',   port:443,  protocol:'HTTPS', bytes_sent:210000000, event_type:'DATA_OUT',     created_at:'2024-06-03 02:14:45'},
        {id:10, src_ip:'10.0.0.3',       dst_ip:'185.220.101.34',   port:443,  protocol:'HTTPS', bytes_sent:77000000,  event_type:'DATA_OUT',     created_at:'2024-06-03 02:14:50'},
        {id:11, src_ip:'10.0.0.3',       dst_ip:'185.220.101.34',   port:443,  protocol:'HTTPS', bytes_sent:55000000,  event_type:'DATA_OUT',     created_at:'2024-06-03 02:14:55'},
        {id:12, src_ip:'10.0.0.5',       dst_ip:'8.8.8.8',          port:443,  protocol:'HTTPS', bytes_sent:1024,      event_type:'CONNECT',      created_at:'2024-06-01 09:00:00'},
        {id:13, src_ip:'10.0.0.12',      dst_ip:'8.8.8.8',          port:443,  protocol:'HTTPS', bytes_sent:2048,      event_type:'CONNECT',      created_at:'2024-06-02 11:25:00'},
        {id:14, src_ip:'185.220.101.34', dst_ip:'10.0.0.1',         port:443,  protocol:'HTTPS', bytes_sent:256,       event_type:'DISCONNECT',   created_at:'2024-06-03 02:15:30'},
    ]])
}

// AlaSQL shims for MySQL commands the puzzles teach
// These translate MySQL-style introspection to AlaSQL table data
function registerShims() {
    // SHOW TABLES  →  returns [{Tables_in_ghostdb: 'tablename'}, ...]
    alasql.fn.SHOW_TABLES = function() {
        return ['users','transactions','audit_logs','sessions','network_events']
            .map(t => ({ 'Tables_in_ghostdb': t }))
    }

    // We intercept SHOW TABLES and DESCRIBE at the exec level (see execSync above)
}

// Intercept MySQL-style commands that AlaSQL doesn't parse natively
function rewrite(sql) {
    const s = sql.trim()

    // SHOW TABLES
    if (/^SHOW\s+TABLES\s*;?$/i.test(s)) {
        return `SELECT 'users' AS Tables_in_ghostdb
                UNION ALL SELECT 'transactions'
                UNION ALL SELECT 'audit_logs'
                UNION ALL SELECT 'sessions'
                UNION ALL SELECT 'network_events'`
    }

    // DESCRIBE <table>  /  DESC <table>
    const descMatch = s.match(/^(?:DESCRIBE|DESC)\s+(\w+)\s*;?$/i)
    if (descMatch) {
        const tbl = descMatch[1].toLowerCase()
        const schemas = {
            users:          ['id','username','email','role','department','created_at','last_login','is_active'],
            transactions:   ['id','user_id','type','amount','target','ip_address','created_at','status'],
            audit_logs:     ['id','user_id','action','detail','ip_address','created_at'],
            sessions:       ['id','user_id','ip_address','user_agent','started_at','ended_at','duration_sec'],
            network_events: ['id','src_ip','dst_ip','port','protocol','bytes_sent','event_type','created_at'],
        }
        const types = {
            users:          ['INT','VARCHAR(100)','VARCHAR(100)','VARCHAR(50)','VARCHAR(100)','VARCHAR(30)','VARCHAR(30)','INT'],
            transactions:   ['INT','INT','VARCHAR(50)','FLOAT','VARCHAR(100)','VARCHAR(50)','VARCHAR(30)','VARCHAR(20)'],
            audit_logs:     ['INT','INT','VARCHAR(50)','VARCHAR(255)','VARCHAR(50)','VARCHAR(30)'],
            sessions:       ['INT','INT','VARCHAR(50)','VARCHAR(255)','VARCHAR(30)','VARCHAR(30)','INT'],
            network_events: ['INT','VARCHAR(50)','VARCHAR(50)','INT','VARCHAR(10)','INT','VARCHAR(30)','VARCHAR(30)'],
        }
        const cols = schemas[tbl] || []
        const typs = types[tbl]   || []
        if (cols.length === 0) throw new Error(`Unknown table: ${tbl}`)
        // Build a UNION ALL that returns one row per column
        const rows = cols.map((col, i) =>
            `SELECT '${col}' AS Field, '${typs[i] || 'VARCHAR'}' AS Type, 'YES' AS \`Null\`, '' AS Key, 'NULL' AS Default, '' AS Extra`
        )
        return rows.join(' UNION ALL ')
    }

    // SHOW COLUMNS FROM <table>  — same as DESCRIBE
    const showColMatch = s.match(/^SHOW\s+COLUMNS\s+FROM\s+(\w+)\s*;?$/i)
    if (showColMatch) {
        return rewrite(`DESCRIBE ${showColMatch[1]}`)
    }

    return sql
}

export function useDb() {
    if (!_seedPromise) {
        _seedPromise = Promise.resolve().then(() => {
            if (!_seeded) {
                registerShims()
                seed()
                _seeded = true
            }
        })
    }

    return {
        async exec(rawSql) {
            await _seedPromise
            const sql = rewrite(rawSql.trim())
            return execSync(sql)
        },
        async isReady() {
            await _seedPromise
            return true
        }
    }
}