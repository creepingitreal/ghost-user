// src/composables/useDb.js
// AlaSQL via dynamic import() — keeps initial bundle small.
//
// IMPORTANT — AlaSQL reserved words used as column names must be backtick-quoted
// in CREATE TABLE and in every INSERT. Confirmed reserved in this schema:
//   TARGET, TYPE, STATUS, ACTION, DETAIL, PORT, PROTOCOL
// All are quoted below.

let _db          = null
let _seedPromise = null

// ── Normalise AlaSQL rows → {columns, values} (same shape as sql.js) ─────────
function normalise(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return []
    const columns = Object.keys(rows[0])
    const values  = rows.map(r => columns.map(c => (r[c] === undefined ? null : r[c])))
    return [{ columns, values }]
}

// ── MySQL command rewriter ────────────────────────────────────────────────────
function rewrite(sql) {
    const s = sql.trim()

    // SHOW TABLES
    if (/^SHOW\s+TABLES\s*;?$/i.test(s)) {
        return `SELECT 'users'          AS tbl_name
            UNION ALL SELECT 'transactions'
            UNION ALL SELECT 'audit_logs'
            UNION ALL SELECT 'sessions'
            UNION ALL SELECT 'network_events'`
    }

    // DESCRIBE / DESC / SHOW COLUMNS FROM
    const descMatch = s.match(/^(?:DESCRIBE|DESC|SHOW\s+COLUMNS\s+FROM)\s+(\w+)\s*;?$/i)
    if (descMatch) {
        const tbl = descMatch[1].toLowerCase()
        const defs = {
            users:          [['id','INT'],['username','VARCHAR(100)'],['email','VARCHAR(100)'],['role','VARCHAR(50)'],['department','VARCHAR(100)'],['created_at','VARCHAR(30)'],['last_login','VARCHAR(30)'],['is_active','INT']],
            transactions:   [['id','INT'],['user_id','INT'],['type','VARCHAR(50)'],['amount','FLOAT'],['target','VARCHAR(100)'],['ip_address','VARCHAR(50)'],['created_at','VARCHAR(30)'],['status','VARCHAR(20)']],
            audit_logs:     [['id','INT'],['user_id','INT'],['action','VARCHAR(50)'],['detail','VARCHAR(255)'],['ip_address','VARCHAR(50)'],['created_at','VARCHAR(30)']],
            sessions:       [['id','INT'],['user_id','INT'],['ip_address','VARCHAR(50)'],['user_agent','VARCHAR(255)'],['started_at','VARCHAR(30)'],['ended_at','VARCHAR(30)'],['duration_sec','INT']],
            network_events: [['id','INT'],['src_ip','VARCHAR(50)'],['dst_ip','VARCHAR(50)'],['port','INT'],['protocol','VARCHAR(10)'],['bytes_sent','INT'],['event_type','VARCHAR(30)'],['created_at','VARCHAR(30)']],
        }
        const cols = defs[tbl]
        if (!cols) throw new Error(`Unknown table: ${tbl}`)
        return cols
            .map(([f, t]) => `SELECT '${f}' AS Field, '${t}' AS col_type, 'YES' AS is_nullable, '' AS col_default, '' AS extra`)
            .join(' UNION ALL ')
    }

    return sql
}

// ── Safe row inserter ─────────────────────────────────────────────────────────
// colDefs: array of [jsKey, sqlColName] pairs
// sqlColName should be the backtick-quoted name used in CREATE TABLE
function ins(table, colDefs, rows) {
    const colList = colDefs.map(([, c]) => c).join(', ')
    for (const row of rows) {
        const vals = colDefs.map(([k]) => {
            const v = row[k]
            if (v === null || v === undefined) return 'NULL'
            if (typeof v === 'number') return String(v)
            return `'${String(v).replace(/'/g, "''")}'`
        }).join(', ')
        _db(`INSERT INTO \`${table}\` (${colList}) VALUES (${vals})`)
    }
}

// ── Seed ──────────────────────────────────────────────────────────────────────
function seed() {
    for (const t of ['network_events','sessions','audit_logs','transactions','users']) {
        try { _db(`DROP TABLE IF EXISTS \`${t}\``) } catch (_) {}
    }

    // ── users (no reserved words) ──
    _db(`CREATE TABLE \`users\` (
    id INT, username VARCHAR(100), email VARCHAR(100), role VARCHAR(50),
    department VARCHAR(100), created_at VARCHAR(30), last_login VARCHAR(30), is_active INT
  )`)
    const uDefs = [['id','id'],['username','username'],['email','email'],['role','role'],
        ['department','department'],['created_at','created_at'],['last_login','last_login'],['is_active','is_active']]
    ins('users', uDefs, [
        {id:1, username:'alice.morgan',  email:'alice@corp.internal',  role:'analyst',  department:'Security',   created_at:'2023-01-15 09:00:00', last_login:'2024-06-01 08:45:00', is_active:1},
        {id:2, username:'bob.hayes',     email:'bob@corp.internal',    role:'engineer', department:'DevOps',     created_at:'2023-03-10 10:30:00', last_login:'2024-06-02 11:20:00', is_active:1},
        {id:3, username:'carol.vance',   email:'carol@corp.internal',  role:'manager',  department:'Finance',    created_at:'2022-11-01 08:00:00', last_login:'2024-05-30 09:10:00', is_active:1},
        {id:4, username:null,            email:null,                   role:'unknown',  department:null,         created_at:'2024-06-03 02:11:00', last_login:'2024-06-03 02:14:00', is_active:1},
        {id:5, username:'dave.ortiz',    email:'dave@corp.internal',   role:'engineer', department:'Backend',    created_at:'2023-06-20 14:00:00', last_login:'2024-06-01 16:00:00', is_active:1},
        {id:6, username:'eve.santos',    email:'eve@corp.internal',    role:'analyst',  department:'Security',   created_at:'2023-09-05 11:00:00', last_login:'2024-05-28 10:30:00', is_active:1},
        {id:7, username:'frank.nil',     email:null,                   role:'admin',    department:'IT',         created_at:'2024-06-03 02:10:00', last_login:'2024-06-03 02:14:00', is_active:1},
        {id:8, username:'grace.wu',      email:'grace@corp.internal',  role:'engineer', department:'Frontend',   created_at:'2023-02-14 09:00:00', last_login:'2024-06-02 14:00:00', is_active:1},
        {id:9, username:'henry.cross',   email:'henry@corp.internal',  role:'manager',  department:'Operations', created_at:'2022-08-30 07:30:00', last_login:'2024-05-29 08:00:00', is_active:1},
        {id:10,username:'iris.bell',     email:'iris@corp.internal',   role:'analyst',  department:'Security',   created_at:'2023-07-11 12:00:00', last_login:'2024-06-01 09:00:00', is_active:1},
        {id:11,username:'ghost_proc_44', email:'ghost@null.void',      role:'service',  department:'SYSTEM',     created_at:'2024-06-03 02:09:00', last_login:'2024-06-03 02:14:00', is_active:0},
        {id:12,username:'jack.ford',     email:'jack@corp.internal',   role:'engineer', department:'Backend',    created_at:'2023-04-18 10:00:00', last_login:'2024-06-02 10:00:00', is_active:1},
        {id:13,username:'kate.shaw',     email:'kate@corp.internal',   role:'analyst',  department:'Finance',    created_at:'2023-10-22 09:30:00', last_login:'2024-05-31 09:30:00', is_active:1},
        {id:14,username:'liam.cross',    email:'liam@corp.internal',   role:'engineer', department:'DevOps',     created_at:'2023-05-05 08:00:00', last_login:'2024-06-01 08:00:00', is_active:1},
        {id:15,username:null,            email:'phantom@external.net', role:'unknown',  department:'EXTERNAL',   created_at:'2024-06-03 02:12:00', last_login:'2024-06-03 02:14:00', is_active:0},
    ])

    // ── transactions — TYPE, TARGET, STATUS are reserved ──
    _db(`CREATE TABLE \`transactions\` (
    id INT, user_id INT, \`type\` VARCHAR(50), amount FLOAT,
    \`target\` VARCHAR(100), ip_address VARCHAR(50), created_at VARCHAR(30), \`status\` VARCHAR(20)
  )`)
    const tDefs = [['id','id'],['user_id','user_id'],['type','`type`'],['amount','amount'],
        ['target','`target`'],['ip_address','ip_address'],['created_at','created_at'],['status','`status`']]
    ins('transactions', tDefs, [
        {id:1,  user_id:1,  type:'data_read',    amount:120,    target:'report_q1',        ip_address:'10.0.0.5',       created_at:'2024-06-01 08:50:00', status:'success'},
        {id:2,  user_id:2,  type:'deploy',       amount:0,      target:'service_api',      ip_address:'10.0.0.12',      created_at:'2024-06-02 11:25:00', status:'success'},
        {id:3,  user_id:4,  type:'data_export',  amount:-94200, target:'external_drop',    ip_address:'185.220.101.34', created_at:'2024-06-03 02:14:22', status:'success'},
        {id:4,  user_id:3,  type:'transfer',     amount:8500,   target:'account_77',       ip_address:'10.0.0.8',       created_at:'2024-05-30 09:15:00', status:'success'},
        {id:5,  user_id:11, type:'data_export',  amount:-210000,target:'void_bucket',      ip_address:'185.220.101.34', created_at:'2024-06-03 02:14:45', status:'success'},
        {id:6,  user_id:5,  type:'data_read',    amount:300,    target:'schema_dump',      ip_address:'10.0.0.20',      created_at:'2024-06-01 16:05:00', status:'success'},
        {id:7,  user_id:7,  type:'config_write', amount:0,      target:'auth_config',      ip_address:'185.220.101.34', created_at:'2024-06-03 02:13:10', status:'success'},
        {id:8,  user_id:15, type:'data_export',  amount:-77000, target:'external_drop',    ip_address:'185.220.101.34', created_at:'2024-06-03 02:14:50', status:'success'},
        {id:9,  user_id:6,  type:'data_read',    amount:200,    target:'audit_archive',    ip_address:'10.0.0.18',      created_at:'2024-05-28 10:35:00', status:'success'},
        {id:10, user_id:12, type:'deploy',       amount:0,      target:'service_payments', ip_address:'10.0.0.25',      created_at:'2024-06-02 10:05:00', status:'success'},
        {id:11, user_id:4,  type:'config_write', amount:0,      target:'user_roles',       ip_address:'185.220.101.34', created_at:'2024-06-03 02:13:00', status:'success'},
        {id:12, user_id:11, type:'config_write', amount:0,      target:'audit_config',     ip_address:'185.220.101.34', created_at:'2024-06-03 02:13:30', status:'success'},
        {id:13, user_id:1,  type:'data_read',    amount:50,     target:'user_manifest',    ip_address:'10.0.0.5',       created_at:'2024-06-01 09:00:00', status:'success'},
        {id:14, user_id:8,  type:'data_read',    amount:80,     target:'design_assets',    ip_address:'10.0.0.30',      created_at:'2024-06-02 14:10:00', status:'success'},
        {id:15, user_id:4,  type:'priv_grant',   amount:0,      target:'admin_panel',      ip_address:'185.220.101.34', created_at:'2024-06-03 02:12:50', status:'success'},
        {id:16, user_id:11, type:'priv_grant',   amount:0,      target:'root_shell',       ip_address:'185.220.101.34', created_at:'2024-06-03 02:13:05', status:'success'},
        {id:17, user_id:3,  type:'transfer',     amount:12000,  target:'account_91',       ip_address:'10.0.0.8',       created_at:'2024-05-15 14:00:00', status:'success'},
        {id:18, user_id:9,  type:'data_read',    amount:100,    target:'ops_report',       ip_address:'10.0.0.40',      created_at:'2024-05-29 08:10:00', status:'success'},
        {id:19, user_id:15, type:'priv_grant',   amount:0,      target:'root_shell',       ip_address:'185.220.101.34', created_at:'2024-06-03 02:13:15', status:'success'},
        {id:20, user_id:7,  type:'data_export',  amount:-55000, target:'external_drop',    ip_address:'185.220.101.34', created_at:'2024-06-03 02:14:55', status:'success'},
    ])

    // ── audit_logs — ACTION, DETAIL are reserved ──
    _db(`CREATE TABLE \`audit_logs\` (
    id INT, user_id INT, \`action\` VARCHAR(50),
    \`detail\` VARCHAR(255), ip_address VARCHAR(50), created_at VARCHAR(30)
  )`)
    const aDefs = [['id','id'],['user_id','user_id'],['action','`action`'],
        ['detail','`detail`'],['ip_address','ip_address'],['created_at','created_at']]
    ins('audit_logs', aDefs, [
        {id:1,  user_id:1,  action:'LOGIN',           detail:'Normal session start',             ip_address:'10.0.0.5',       created_at:'2024-06-01 08:45:00'},
        {id:2,  user_id:2,  action:'LOGIN',           detail:'Normal session start',             ip_address:'10.0.0.12',      created_at:'2024-06-02 11:20:00'},
        {id:3,  user_id:4,  action:'FAILED_LOGIN',    detail:'Bad credentials attempt 1',        ip_address:'185.220.101.34', created_at:'2024-06-03 02:09:12'},
        {id:4,  user_id:4,  action:'FAILED_LOGIN',    detail:'Bad credentials attempt 2',        ip_address:'185.220.101.34', created_at:'2024-06-03 02:09:45'},
        {id:5,  user_id:4,  action:'FAILED_LOGIN',    detail:'Bad credentials attempt 3',        ip_address:'185.220.101.34', created_at:'2024-06-03 02:10:01'},
        {id:6,  user_id:11, action:'LOGIN',           detail:'Service account activated',        ip_address:'185.220.101.34', created_at:'2024-06-03 02:10:15'},
        {id:7,  user_id:7,  action:'LOGIN',           detail:'Admin session no MFA',             ip_address:'185.220.101.34', created_at:'2024-06-03 02:10:30'},
        {id:8,  user_id:4,  action:'LOGIN',           detail:'Successful after lockout bypass',  ip_address:'185.220.101.34', created_at:'2024-06-03 02:11:00'},
        {id:9,  user_id:4,  action:'PRIV_ESCALATION', detail:'Role changed to admin',            ip_address:'185.220.101.34', created_at:'2024-06-03 02:12:50'},
        {id:10, user_id:11, action:'PRIV_ESCALATION', detail:'Service account granted root',     ip_address:'185.220.101.34', created_at:'2024-06-03 02:13:05'},
        {id:11, user_id:7,  action:'CONFIG_CHANGE',   detail:'auth_config overwritten',          ip_address:'185.220.101.34', created_at:'2024-06-03 02:13:10'},
        {id:12, user_id:11, action:'CONFIG_CHANGE',   detail:'audit_config overwritten',         ip_address:'185.220.101.34', created_at:'2024-06-03 02:13:30'},
        {id:13, user_id:15, action:'LOGIN',           detail:'External phantom account login',   ip_address:'185.220.101.34', created_at:'2024-06-03 02:13:40'},
        {id:14, user_id:15, action:'PRIV_ESCALATION', detail:'Phantom account granted root',     ip_address:'185.220.101.34', created_at:'2024-06-03 02:13:15'},
        {id:15, user_id:4,  action:'ALTER_AUDIT_LOG', detail:'Deleted 44 entries from audit_log',ip_address:'185.220.101.34', created_at:'2024-06-03 02:14:00'},
        {id:16, user_id:11, action:'ALTER_AUDIT_LOG', detail:'Truncated audit_log table',        ip_address:'185.220.101.34', created_at:'2024-06-03 02:14:10'},
        {id:17, user_id:4,  action:'DATA_EXFIL',      detail:'Bulk export to external_drop',     ip_address:'185.220.101.34', created_at:'2024-06-03 02:14:22'},
        {id:18, user_id:11, action:'DATA_EXFIL',      detail:'Bulk export to void_bucket',       ip_address:'185.220.101.34', created_at:'2024-06-03 02:14:45'},
        {id:19, user_id:15, action:'DATA_EXFIL',      detail:'Bulk export to external_drop',     ip_address:'185.220.101.34', created_at:'2024-06-03 02:14:50'},
        {id:20, user_id:7,  action:'DATA_EXFIL',      detail:'Bulk export to external_drop',     ip_address:'185.220.101.34', created_at:'2024-06-03 02:14:55'},
        {id:21, user_id:1,  action:'LOGOUT',          detail:'Normal session end',               ip_address:'10.0.0.5',       created_at:'2024-06-01 17:00:00'},
        {id:22, user_id:6,  action:'LOGIN',           detail:'Normal session start',             ip_address:'10.0.0.18',      created_at:'2024-05-28 10:30:00'},
        {id:23, user_id:4,  action:'LOGOUT',          detail:'Session terminated',               ip_address:'185.220.101.34', created_at:'2024-06-03 02:15:10'},
        {id:24, user_id:11, action:'LOGOUT',          detail:'Service account deactivated',      ip_address:'185.220.101.34', created_at:'2024-06-03 02:15:20'},
        {id:25, user_id:3,  action:'LOGIN',           detail:'Normal session start',             ip_address:'10.0.0.8',       created_at:'2024-05-30 09:10:00'},
    ])

    // ── sessions (no reserved words) ──
    _db(`CREATE TABLE \`sessions\` (
    id INT, user_id INT, ip_address VARCHAR(50), user_agent VARCHAR(255),
    started_at VARCHAR(30), ended_at VARCHAR(30), duration_sec INT
  )`)
    const sDefs = [['id','id'],['user_id','user_id'],['ip_address','ip_address'],['user_agent','user_agent'],
        ['started_at','started_at'],['ended_at','ended_at'],['duration_sec','duration_sec']]
    ins('sessions', sDefs, [
        {id:1,  user_id:1,  ip_address:'10.0.0.5',       user_agent:'Mozilla/5.0 Chrome/120',  started_at:'2024-06-01 08:45:00', ended_at:'2024-06-01 17:00:00', duration_sec:29700},
        {id:2,  user_id:2,  ip_address:'10.0.0.12',      user_agent:'Mozilla/5.0 Firefox/119', started_at:'2024-06-02 11:20:00', ended_at:'2024-06-02 18:00:00', duration_sec:24000},
        {id:3,  user_id:4,  ip_address:'185.220.101.34', user_agent:'curl/7.88.1',             started_at:'2024-06-03 02:11:00', ended_at:'2024-06-03 02:15:10', duration_sec:250},
        {id:4,  user_id:11, ip_address:'185.220.101.34', user_agent:'python-requests/2.31',    started_at:'2024-06-03 02:10:15', ended_at:'2024-06-03 02:15:20', duration_sec:305},
        {id:5,  user_id:7,  ip_address:'185.220.101.34', user_agent:'python-requests/2.31',    started_at:'2024-06-03 02:10:30', ended_at:'2024-06-03 02:15:00', duration_sec:270},
        {id:6,  user_id:15, ip_address:'185.220.101.34', user_agent:'curl/7.88.1',             started_at:'2024-06-03 02:13:40', ended_at:'2024-06-03 02:15:05', duration_sec:85},
        {id:7,  user_id:6,  ip_address:'10.0.0.18',      user_agent:'Mozilla/5.0 Safari/17',   started_at:'2024-05-28 10:30:00', ended_at:'2024-05-28 16:00:00', duration_sec:19800},
        {id:8,  user_id:3,  ip_address:'10.0.0.8',       user_agent:'Mozilla/5.0 Chrome/120',  started_at:'2024-05-30 09:10:00', ended_at:'2024-05-30 17:30:00', duration_sec:30000},
        {id:9,  user_id:5,  ip_address:'10.0.0.20',      user_agent:'Mozilla/5.0 Chrome/120',  started_at:'2024-06-01 16:00:00', ended_at:'2024-06-01 18:00:00', duration_sec:7200},
        {id:10, user_id:12, ip_address:'10.0.0.25',      user_agent:'Mozilla/5.0 Firefox/119', started_at:'2024-06-02 10:00:00', ended_at:'2024-06-02 16:00:00', duration_sec:21600},
    ])

    // ── network_events — PORT, PROTOCOL are reserved ──
    _db(`CREATE TABLE \`network_events\` (
    id INT, src_ip VARCHAR(50), dst_ip VARCHAR(50),
    \`port\` INT, \`protocol\` VARCHAR(10), bytes_sent INT,
    event_type VARCHAR(30), created_at VARCHAR(30)
  )`)
    const nDefs = [['id','id'],['src_ip','src_ip'],['dst_ip','dst_ip'],['port','`port`'],
        ['protocol','`protocol`'],['bytes_sent','bytes_sent'],['event_type','event_type'],['created_at','created_at']]
    ins('network_events', nDefs, [
        {id:1,  src_ip:'185.220.101.34', dst_ip:'10.0.0.1',       port:443,  protocol:'HTTPS', bytes_sent:512,       event_type:'CONNECT',      created_at:'2024-06-03 02:09:00'},
        {id:2,  src_ip:'185.220.101.34', dst_ip:'10.0.0.1',       port:443,  protocol:'HTTPS', bytes_sent:1024,      event_type:'AUTH_ATTEMPT', created_at:'2024-06-03 02:09:12'},
        {id:3,  src_ip:'185.220.101.34', dst_ip:'10.0.0.1',       port:443,  protocol:'HTTPS', bytes_sent:1024,      event_type:'AUTH_ATTEMPT', created_at:'2024-06-03 02:09:45'},
        {id:4,  src_ip:'185.220.101.34', dst_ip:'10.0.0.1',       port:443,  protocol:'HTTPS', bytes_sent:1024,      event_type:'AUTH_ATTEMPT', created_at:'2024-06-03 02:10:01'},
        {id:5,  src_ip:'185.220.101.34', dst_ip:'10.0.0.2',       port:22,   protocol:'SSH',   bytes_sent:2048,      event_type:'CONNECT',      created_at:'2024-06-03 02:10:15'},
        {id:6,  src_ip:'185.220.101.34', dst_ip:'10.0.0.3',       port:3306, protocol:'TCP',   bytes_sent:4096,      event_type:'DB_CONNECT',   created_at:'2024-06-03 02:11:00'},
        {id:7,  src_ip:'185.220.101.34', dst_ip:'10.0.0.4',       port:80,   protocol:'HTTP',  bytes_sent:512,       event_type:'SCAN',         created_at:'2024-06-03 02:11:30'},
        {id:8,  src_ip:'10.0.0.3',       dst_ip:'185.220.101.34', port:443,  protocol:'HTTPS', bytes_sent:94200000,  event_type:'DATA_OUT',     created_at:'2024-06-03 02:14:22'},
        {id:9,  src_ip:'10.0.0.3',       dst_ip:'185.220.101.34', port:443,  protocol:'HTTPS', bytes_sent:210000000, event_type:'DATA_OUT',     created_at:'2024-06-03 02:14:45'},
        {id:10, src_ip:'10.0.0.3',       dst_ip:'185.220.101.34', port:443,  protocol:'HTTPS', bytes_sent:77000000,  event_type:'DATA_OUT',     created_at:'2024-06-03 02:14:50'},
        {id:11, src_ip:'10.0.0.3',       dst_ip:'185.220.101.34', port:443,  protocol:'HTTPS', bytes_sent:55000000,  event_type:'DATA_OUT',     created_at:'2024-06-03 02:14:55'},
        {id:12, src_ip:'10.0.0.5',       dst_ip:'8.8.8.8',        port:443,  protocol:'HTTPS', bytes_sent:1024,      event_type:'CONNECT',      created_at:'2024-06-01 09:00:00'},
        {id:13, src_ip:'10.0.0.12',      dst_ip:'8.8.8.8',        port:443,  protocol:'HTTPS', bytes_sent:2048,      event_type:'CONNECT',      created_at:'2024-06-02 11:25:00'},
        {id:14, src_ip:'185.220.101.34', dst_ip:'10.0.0.1',       port:443,  protocol:'HTTPS', bytes_sent:256,       event_type:'DISCONNECT',   created_at:'2024-06-03 02:15:30'},
    ])
}

// ── Statement splitter (honours quoted strings) ───────────────────────────────
function splitStatements(sql) {
    const out = []
    let cur = '', inStr = false, q = ''
    for (let i = 0; i < sql.length; i++) {
        const ch = sql[i]
        if (!inStr && (ch === "'" || ch === '"' || ch === '`')) { inStr = true; q = ch; cur += ch }
        else if (inStr && ch === q && sql[i-1] !== '\\')        { inStr = false; cur += ch }
        else if (!inStr && ch === ';')                          { if (cur.trim()) out.push(cur.trim()); cur = '' }
        else cur += ch
    }
    if (cur.trim()) out.push(cur.trim())
    return out
}

// ── Public composable ─────────────────────────────────────────────────────────
export function useDb() {
    if (!_seedPromise) {
        _seedPromise = import('alasql').then(mod => {
            _db = mod.default
            seed()
        }).catch(err => {
            console.error('[useDb] seed failed:', err)
            _seedPromise = null
            throw err
        })
    }

    return {
        async exec(rawSql) {
            await _seedPromise

            const stmts = splitStatements(rawSql.trim())

            let last = []
            for (const stmt of stmts) {
                if (!stmt) continue
                const rewritten = rewrite(stmt)
                try {
                    const r = _db(rewritten)
                    last = Array.isArray(r) ? normalise(r) : []
                } catch (e) {
                    throw new Error(`${e.message}\n→ near: ${stmt.slice(0, 120)}`)
                }
            }
            return last
        },
        async isReady() { await _seedPromise; return true },
    }
}