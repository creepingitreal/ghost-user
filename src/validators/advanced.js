function rows(res) { return res?.[0]?.values || [] }

export const advancedPuzzles = [
    {
        id: 1,
        prompt: 'Rogue account detection (WHERE + NULL).',
        placeholder: `SELECT id,username,role FROM users WHERE username IS NULL OR role='unknown';`,
        clue: 'SHADOW',
        validate: res => rows(res).some(r => r.includes(null) || r.includes('unknown')) || "Use IS NULL or role='unknown'"
    },
    {
        id: 2,
        prompt: 'JOIN: map negative data_export to username.',
        placeholder: `SELECT u.username, t.amount, t.type FROM transactions t JOIN users u ON u.id=t.user_id WHERE t.type='data_export' AND t.amount < 0;`,
        clue: 'EXFIL',
        validate: res => rows(res).some(r => r.includes('data_export') && r.some(c => typeof c === 'number' && c < 0)) || 'JOIN + data_export & amount < 0'
    },
    {
        id: 3,
        prompt: 'GROUP BY + HAVING: users with negative net movement.',
        placeholder: `SELECT u.username, SUM(t.amount) AS net FROM transactions t JOIN users u ON u.id=t.user_id GROUP BY u.username HAVING SUM(t.amount) < 0;`,
        clue: 'TAMPER',
        validate: res => rows(res).some(r => r.some(c => typeof c === 'number' && c < 0)) || 'Expect SUM(amount) < 0'
    },
    {
        id: 4,
        prompt: 'Subquery: suspicious log users WITHOUT payroll.',
        placeholder: `SELECT u.id,u.username FROM users u WHERE u.id IN (SELECT DISTINCT al.user_id FROM audit_logs al WHERE al.action IN ('PRIV_ESCALATION','ALTER_AUDIT_LOG') AND al.user_id IS NOT NULL) AND NOT EXISTS (SELECT 1 FROM transactions t WHERE t.user_id=u.id AND t.type='payroll');`,
        clue: 'BREACH',
        validate: res => rows(res).length > 0 || 'Use IN/EXISTS to exclude payroll users'
    },
    {
        id: 5,
        prompt: 'Window/timeline: find action immediately after PRIV_ESCALATION.',
        placeholder: `SELECT action, created_at, LAG(action) OVER (ORDER BY created_at) AS prev_action FROM audit_logs ORDER BY created_at;`,
        clue: 'TRACE',
        validate: res => {
            const r = rows(res)
            const idx = a => r.findIndex(row => row.includes(a))
            return (idx('PRIV_ESCALATION') !== -1 && idx('ALTER_AUDIT_LOG') !== -1 && idx('ALTER_AUDIT_LOG') > idx('PRIV_ESCALATION')) || 'Use ORDER BY or LAG'
        }
    }
]