function rows(res) { return res?.[0]?.values || [] }

export const basicPuzzles = [
    {
        id: 1,
        prompt: 'Find users with a missing username or role "unknown".',
        placeholder: `SELECT * FROM users WHERE username IS NULL OR role='unknown';`,
        clue: 'SHADOW',
        validate: res => rows(res).some(r => r.includes(null) || r.includes('unknown')) || 'Look for NULL or role="unknown"'
    },
    {
        id: 2,
        prompt: 'Find the data_export with a negative amount (JOIN optional).',
        placeholder: `SELECT u.username, t.amount FROM transactions t JOIN users u ON u.id=t.user_id WHERE t.type='data_export' AND t.amount < 0;`,
        clue: 'EXFIL',
        validate: res => rows(res).some(r => r.includes('data_export') && r.some(c => typeof c === 'number' && c < 0)) || 'Filter data_export AND amount < 0'
    },
    {
        id: 3,
        prompt: 'Find any ALTER_AUDIT_LOG entries.',
        placeholder: `SELECT * FROM audit_logs WHERE action='ALTER_AUDIT_LOG';`,
        clue: 'TAMPER',
        validate: res => rows(res).some(r => r.includes('ALTER_AUDIT_LOG')) || 'Look for ALTER_AUDIT_LOG'
    },
    {
        id: 4,
        prompt: 'Find FAILED_LOGIN in the logs.',
        placeholder: `SELECT * FROM audit_logs WHERE action='FAILED_LOGIN';`,
        clue: 'BREACH',
        validate: res => rows(res).some(r => r.includes('FAILED_LOGIN')) || 'Look for FAILED_LOGIN'
    },
    {
        id: 5,
        prompt: 'Order logs; ensure ALTER_AUDIT_LOG happens after PRIV_ESCALATION.',
        placeholder: `SELECT * FROM audit_logs ORDER BY created_at;`,
        clue: 'TRACE',
        validate: res => {
            const r = rows(res)
            const idx = a => r.findIndex(row => row.includes(a))
            return (idx('PRIV_ESCALATION') !== -1 && idx('ALTER_AUDIT_LOG') !== -1 && idx('ALTER_AUDIT_LOG') > idx('PRIV_ESCALATION')) || 'Timeline order incorrect'
        }
    }
]