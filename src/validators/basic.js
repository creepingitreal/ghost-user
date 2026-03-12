function rows(res) {
    return res?.[0]?.values || []
}

export const basicPuzzles = [
    {
        id: 1,
        story: `Initial Recon:
The Ghost actor likely avoided a normal identity trail. In our system, that often shows as a missing username or a synthetic role.
Task: Identify any suspicious accounts with missing identity or unknown role.`,
        prompt: 'Find users with missing username or role "unknown".',
        placeholder: `SELECT id, username, role
                      FROM users
                      WHERE username IS NULL
                         OR role = 'unknown';`,
        solutionSql: `SELECT id, username, role
                      FROM users
                      WHERE username IS NULL
                         OR role = 'unknown';`,
        clue: 'SHADOW',
        validate: res => rows(res).some(r => r.includes(null) || r.includes('unknown')) || 'Look for NULL username or role="unknown"'
    },

    {
        id: 2,
        story: `Exfiltration Sweep: A large negative data movement indicates exfiltration. Task: Join users to transactions and find any negative "data_export".`,
        prompt: 'Map the negative data_export to a user.',
        placeholder: `SELECT u.username, t.amount, t.type
                      FROM transactions t
                               JOIN users u ON u.id = t.user_id
                      WHERE t.type = 'data_export'
                        AND t.amount < 0;`,

        solutionSql: `SELECT u.username, t.amount, t.type
                      FROM transactions t
                               JOIN users u ON u.id = t.user_id
                      WHERE t.type = 'data_export'
                        AND t.amount < 0;`,

        clue: 'EXFIL',

        validate: res =>
            rows(res).some(
                r => r.includes('data_export') && r.some(c => typeof c === 'number' && c < 0)
            ) || 'Filter type=data_export AND amount < 0'
    },
    {
        id: 4,
        story: `Failed Access:
Attackers often brute force or test creds after tampering.
Task: Identify FAILED_LOGIN events.`,
        prompt: 'Find FAILED_LOGIN entries.',
        placeholder: `SELECT *
                      FROM audit_logs
                      WHERE action ='FAILED_LOGIN';`,
        solutionSql: `SELECT *
                      FROM audit_logs
                      WHERE action ='FAILED_LOGIN';`,
        clue: 'BREACH',
        validate: res => rows(res).some(r => r.includes('FAILED_LOGIN')) || 'Look for FAILED_LOGIN'
    },
    {
        id: 5,
        story: `Sequence Reconstruction:
We must prove what happened immediately after privilege escalation.
Task: Order events and ensure ALTER_AUDIT_LOG follows PRIV_ESCALATION.`,
        prompt: 'Order audit logs by created_at and verify the next action.',
        placeholder: `SELECT action, created_at, LAG(action) OVER (ORDER BY created_at) AS prev
                      FROM audit_logs
                      ORDER BY created_at;`,
        solutionSql: `SELECT action, created_at, LAG(action) OVER (ORDER BY created_at) AS prev_action
                      FROM audit_logs
                      ORDER BY created_at;`,
        clue: 'TRACE',
        validate: res => {
            const r = rows(res)
            const idx = a => r.findIndex(row => row.includes(a))
            return (idx('PRIV_ESCALATION') !== -1 && idx('ALTER_AUDIT_LOG') !== -1 && idx('ALTER_AUDIT_LOG') > idx('PRIV_ESCALATION')) || 'Use ORDER BY or LAG'
        }
    }
]