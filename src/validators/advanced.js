function rows(res) { return res?.[0]?.values || [] }

export const advancedPuzzles = [
    {
        id: 1,
        story: `Identity Evasion:
Ghost entities often appear as NULL or misclassified roles. Start by isolating suspicious identities.`,
        prompt: 'Find NULL or unknown identities.',
        placeholder: `SELECT id, username, role FROM users WHERE username IS NULL OR role='unknown';`,
        solutionSql: `SELECT id, username, role FROM users WHERE username IS NULL OR role='unknown';`,
        clue: 'SHADOW',
        validate: res => rows(res).some(r => r.includes(null) || r.includes('unknown')) || "Use IS NULL or role='unknown'"
    },
    {
        id: 2,
        story: `Data Movement Correlation:
Tie exfiltration to specific principals via JOIN.`,
        prompt: 'Join users to transactions; locate negative data_export.',
        placeholder: `SELECT u.username, t.amount, t.type FROM transactions t JOIN users u ON u.id=t.user_id WHERE t.type='data_export' AND t.amount < 0;`,
        solutionSql: `SELECT u.username, t.amount, t.type FROM transactions t JOIN users u ON u.id=t.user_id WHERE t.type='data_export' AND t.amount < 0;`,
        clue: 'EXFIL',
        validate: res => rows(res).some(r => r.includes('data_export') && r.some(c => typeof c === 'number' && c < 0)) || 'JOIN + data_export & amount < 0'
    },
    {
        id: 3,
        story: `Anomaly Aggregation:
Spot accounts with unusual net movement.`,
        prompt: 'GROUP BY user and HAVING SUM(amount) < 0.',
        placeholder: `SELECT u.username, SUM(t.amount) AS net FROM transactions t JOIN users u ON u.id=t.user_id GROUP BY u.username HAVING SUM(t.amount) < 0;`,
        solutionSql: `SELECT u.username, SUM(t.amount) AS net FROM transactions t JOIN users u ON u.id=t.user_id GROUP BY u.username HAVING SUM(t.amount) < 0;`,
        clue: 'TAMPER',
        validate: res => rows(res).some(r => r.some(c => typeof c === 'number' && c < 0)) || 'Expect SUM(amount) < 0'
    },
    {
        id: 4,
        story: `Privilege & Mask:
Identify users implicated in sensitive actions that do not have legitimate payroll entries.`,
        prompt: 'Users in PRIV_ESCALATION / ALTER_AUDIT_LOG without payroll.',
        placeholder: `SELECT u.id, u.username FROM users u WHERE u.id IN (SELECT DISTINCT al.user_id FROM audit_logs al WHERE al.action IN ('PRIV_ESCALATION','ALTER_AUDIT_LOG') AND al.user_id IS NOT NULL) AND NOT EXISTS (SELECT 1 FROM transactions t WHERE t.user_id=u.id AND t.type='payroll');`,
        solutionSql: `SELECT u.id, u.username FROM users u WHERE u.id IN (SELECT DISTINCT al.user_id FROM audit_logs al WHERE al.action IN ('PRIV_ESCALATION','ALTER_AUDIT_LOG') AND al.user_id IS NOT NULL) AND NOT EXISTS (SELECT 1 FROM transactions t WHERE t.user_id=u.id AND t.type='payroll');`,
        clue: 'BREACH',
        validate: res => rows(res).length > 0 || 'Use IN/EXISTS to exclude payroll users'
    },
    {
        id: 5,
        story: `Causal Proof:
Prove ALTER_AUDIT_LOG follows PRIV_ESCALATION in time.`,
        prompt: 'Find the action immediately after PRIV_ESCALATION.',
        placeholder: `SELECT action, created_at, LAG(action) OVER (ORDER BY created_at) AS prev_action FROM audit_logs ORDER BY created_at;`,
        solutionSql: `SELECT action, created_at, LAG(action) OVER (ORDER BY created_at) AS prev_action FROM audit_logs ORDER BY created_at;`,
        clue: 'TRACE',
        validate: res => {
            const r = rows(res)
            const idx = a => r.findIndex(row => row.includes(a))
            return (idx('PRIV_ESCALATION') !== -1 && idx('ALTER_AUDIT_LOG') !== -1 && idx('ALTER_AUDIT_LOG') > idx('PRIV_ESCALATION')) || 'Use ORDER BY or LAG'
        }
    }
]