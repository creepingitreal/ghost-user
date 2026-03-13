// 10 puzzles — Advanced track
// MySQL syntax throughout; all JOIN / CTE / GROUP BY / HAVING patterns

export const advancedPuzzles = [
    {
        id: 1,
        story: `The sessions table logs every authenticated connection. On the night of the breach — June 3rd — multiple hostile sessions were opened from the same external IP. Start by counting how many distinct user accounts connected from outside the 10.x.x.x range on that date.`,
        prompt: `How many distinct user_ids appear in sessions where ip_address is not in the 10.x.x.x range AND the session started on 2024-06-03?`,
        expectedAnswer: '4',
        clue: 'VECTOR',
        hints: [
            'Filter with WHERE ip_address NOT LIKE \'10.%\' AND started_at LIKE \'2024-06-03%\'.',
            'Use COUNT(DISTINCT user_id) to deduplicate across multiple sessions per user.',
            `SELECT COUNT(DISTINCT user_id) AS hostile_users
             FROM sessions
             WHERE ip_address NOT LIKE '10.%'
               AND started_at LIKE '2024-06-03%';`,
        ],
        solution: `SELECT COUNT(DISTINCT user_id) AS hostile_users
FROM sessions
WHERE ip_address NOT LIKE '10.%'
  AND started_at LIKE '2024-06-03%';`,
        validate(res, userAnswer) {
            if (parseInt(userAnswer?.trim(), 10) === 4) return true
            return '4 distinct user accounts connected from the hostile IP on June 3rd.'
        },
    },

    {
        id: 2,
        story: `Legitimate users connect via a browser — their user_agent starts with "Mozilla". The attacker used automated tools: curl, python-requests, and other non-browser agents. Count how many hostile sessions used a non-Mozilla user agent.`,
        prompt: `How many sessions from the hostile IP (185.220.101.34) have a user_agent that does NOT start with 'Mozilla'?`,
        expectedAnswer: '3',
        clue: 'TOOLKIT',
        hints: [
            'Filter WHERE ip_address = \'185.220.101.34\' AND user_agent NOT LIKE \'Mozilla%\'.',
            'COUNT(*) gives you the total number of matching rows.',
            `SELECT COUNT(*) AS automated_sessions
             FROM sessions
             WHERE ip_address = '185.220.101.34'
               AND user_agent NOT LIKE 'Mozilla%';`,
        ],
        solution: `SELECT COUNT(*) AS automated_sessions
FROM sessions
WHERE ip_address = '185.220.101.34'
  AND user_agent NOT LIKE 'Mozilla%';`,
        validate(res, userAnswer) {
            if (parseInt(userAnswer?.trim(), 10) === 3) return true
            return '3 sessions used automated tools. Filter on the hostile IP and NOT LIKE \'Mozilla%\'.'
        },
    },

    {
        id: 3,
        story: `The network_events table records every packet crossing the perimeter. The attacker probed several ports before gaining entry. Find the first port they hit — that's where the intrusion began.`,
        prompt: `What was the first port number contacted FROM the hostile IP (185.220.101.34) to any internal address? Order by created_at ascending.`,
        expectedAnswer: '443',
        clue: 'INGRESS',
        hints: [
            'Filter WHERE src_ip = \'185.220.101.34\' to get outbound packets from the attacker.',
            'ORDER BY created_at ASC LIMIT 1 gives you the earliest event.',
            `SELECT port
             FROM network_events
             WHERE src_ip = '185.220.101.34'
             ORDER BY created_at ASC
                 LIMIT 1;`,
        ],
        solution: `SELECT port, created_at
FROM network_events
WHERE src_ip = '185.220.101.34'
ORDER BY created_at ASC
LIMIT 1;`,
        validate(res, userAnswer) {
            if (parseInt(userAnswer?.trim(), 10) === 443) return true
            return 'The first port hit was 443. Order by created_at ASC and take the first row.'
        },
    },

    {
        id: 4,
        story: `The largest single data export — the one that drained the most value — was authorised by a specific account. Join transactions to sessions to identify which user_id is responsible for the single most negative transaction amount.`,
        prompt: `Which user_id is associated with the transaction that has the lowest (most negative) amount?`,
        expectedAnswer: '11',
        clue: 'PRIMARY',
        hints: [
            'ORDER BY amount ASC puts the most negative amount first.',
            'LIMIT 1 returns just that row.',
            `SELECT user_id, amount
             FROM transactions
             ORDER BY amount ASC
                 LIMIT 1;`,
        ],
        solution: `SELECT user_id, amount, target
                   FROM transactions
                   ORDER BY amount ASC
                       LIMIT 1;`,
        validate(res, userAnswer) {
            if (parseInt(userAnswer?.trim(), 10) === 11) return true
            return 'user_id 11 is responsible for the largest single export. ORDER BY amount ASC LIMIT 1.'
        },
    },

    {
        id: 5,
        story: `user_id 11 is the primary exfiltration account. It's a service account created minutes before the breach with a non-corporate email. Retrieve its full profile from the users table.`,
        prompt: `What is the username of user_id 11?`,
        expectedAnswer: 'ghost_proc_44',
        clue: 'IDENTITY',
        hints: [
            'Simple SELECT WHERE id = 11.',
            'SELECT * FROM users WHERE id = 11;',
            `SELECT id, username, email, role, department
             FROM users
             WHERE id = 11;`,
        ],
        solution: `SELECT * FROM users WHERE id = 11;`,
        validate(res, userAnswer) {
            if (userAnswer?.trim().toLowerCase() === 'ghost_proc_44') return true
            return 'The username is ghost_proc_44. Run SELECT * FROM users WHERE id = 11.'
        },
    },

    {
        id: 6,
        story: `Before exfiltrating data, the attacker needed elevated permissions. The audit_logs table records PRIV_ESCALATION events — each one granted admin or root access to a compromised account. How many privilege escalations occurred during the breach?`,
        prompt: `How many rows in audit_logs have action = 'PRIV_ESCALATION'?`,
        expectedAnswer: '3',
        clue: 'ESCALATE',
        hints: [
            'SELECT COUNT(*) with a WHERE clause on the action column.',
            `SELECT COUNT(*) AS escalations
FROM audit_logs
WHERE action = 'PRIV_ESCALATION';`,
            `SELECT user_id, detail, created_at
             FROM audit_logs
             WHERE action = 'PRIV_ESCALATION'
             ORDER BY created_at;`,
        ],
        solution: `SELECT user_id, detail, created_at
FROM audit_logs
WHERE action = 'PRIV_ESCALATION'
ORDER BY created_at;`,
        validate(res, userAnswer) {
            if (parseInt(userAnswer?.trim(), 10) === 3) return true
            return 'There were 3 privilege escalation events. Filter WHERE action = \'PRIV_ESCALATION\'.'
        },
    },

    {
        id: 7,
        story: `To cover their tracks the attacker ran ALTER_AUDIT_LOG actions — deleting entries from the log itself. One of those entries describes exactly how many records were wiped. Find it and report the number.`,
        prompt: `Look at the detail column for audit_log rows where action = 'ALTER_AUDIT_LOG'. How many entries were deleted?`,
        expectedAnswer: '44',
        clue: 'ERASURE',
        hints: [
            'SELECT detail FROM audit_logs WHERE action = \'ALTER_AUDIT_LOG\'.',
            'Read the detail text — one row states a specific number of deleted entries.',
            `SELECT user_id, detail, created_at
             FROM audit_logs
             WHERE action = 'ALTER_AUDIT_LOG'
             ORDER BY created_at;`,
        ],
        solution: `SELECT user_id, detail, created_at
                   FROM audit_logs
                   WHERE action = 'ALTER_AUDIT_LOG'
                   ORDER BY created_at;`,
        validate(res, userAnswer) {
            if (userAnswer?.trim() === '44') return true
            return 'The detail says "Deleted 44 entries from audit_log". The answer is 44.'
        },
    },

    {
        id: 8,
        story: `We need a complete timeline of hostile actions in the correct sequence. Join audit_logs to users (using a LEFT JOIN to preserve rows where username is NULL) and list every action from the hostile IP ordered by time. The second-to-last action before the attacker disconnected was the final exfiltration step.`,
        prompt: `Looking at audit_logs WHERE ip_address = '185.220.101.34', ordered by created_at ASC — what is the action of the second-to-last row?`,
        expectedAnswer: 'DATA_EXFIL',
        clue: 'TIMELINE',
        hints: [
            'LEFT JOIN users ON audit_logs.user_id = users.id — use COALESCE(username, \'[UNKNOWN]\') to handle NULLs.',
            'ORDER BY created_at ASC then read the second-to-last row from the results.',
            `SELECT al.created_at, al.action, COALESCE(u.username, '[UNKNOWN]') AS username, al.detail
             FROM audit_logs al
                      LEFT JOIN users u ON al.user_id = u.id
             WHERE al.ip_address = '185.220.101.34'
             ORDER BY al.created_at ASC;`,
        ],
        solution: `SELECT al.created_at, al.action,
                          COALESCE(u.username, '[UNKNOWN]') AS username,
                          al.detail
                   FROM audit_logs al
                            LEFT JOIN users u ON al.user_id = u.id
                   WHERE al.ip_address = '185.220.101.34'
                   ORDER BY al.created_at ASC;`,
        validate(res, userAnswer) {
            if (userAnswer?.trim().toUpperCase() === 'DATA_EXFIL') return true
            return 'The second-to-last action is DATA_EXFIL. Join audit_logs → users, filter on the hostile IP, order by time.'
        },
    },

    {
        id: 9,
        story: `The network_events table captured the raw bytes leaving the network. Sum up every DATA_OUT event to quantify the total data volume exfiltrated during the attack.`,
        prompt: `What is the total SUM of bytes_sent for all network_events where event_type = 'DATA_OUT'?`,
        expectedAnswer: '436200000',
        clue: 'IMPACT',
        hints: [
            'SUM(bytes_sent) with WHERE event_type = \'DATA_OUT\'.',
            `SELECT SUM(bytes_sent) AS total_bytes
FROM network_events
WHERE event_type = 'DATA_OUT';`,
            `SELECT SUM(bytes_sent) AS total_bytes,
                    COUNT(*) AS event_count
             FROM network_events
             WHERE event_type = 'DATA_OUT';`,
        ],
        solution: `SELECT SUM(bytes_sent) AS total_bytes_exfiltrated
FROM network_events
WHERE event_type = 'DATA_OUT';`,
        validate(res, userAnswer) {
            const n = parseInt(userAnswer?.trim(), 10)
            if (n === 436200000) return true
            return '436200000 bytes were exfiltrated in total. Filter WHERE event_type = \'DATA_OUT\'.'
        },
    },

    {
        id: 10,
        story: `Final task. Use a Common Table Expression (CTE) to link sessions → users → transactions and find the single account responsible for the highest absolute value of data exports. This is the mastermind account.`,
        prompt: `Using a CTE, join sessions to users to transactions. Which username has the highest total ABS(amount) across all their transactions? (hostile sessions only, ip NOT LIKE '10.%')`,
        expectedAnswer: 'ghost_proc_44',
        clue: 'UNMASKED',
        hints: [
            'Start with WITH hostile_sessions AS (SELECT DISTINCT user_id FROM sessions WHERE ip_address NOT LIKE \'10.%\').',
            'Join the CTE to users and then to transactions, GROUP BY username, SUM(ABS(amount)).',
            `WITH hostile_sessions AS (
                SELECT DISTINCT user_id
                FROM sessions
                WHERE ip_address NOT LIKE '10.%'
            )
             SELECT u.username, SUM(ABS(t.amount)) AS total_exfil
             FROM hostile_sessions hs
                      JOIN users u ON hs.user_id = u.id
                      JOIN transactions t ON t.user_id = u.id
             GROUP BY u.username
             ORDER BY total_exfil DESC
                 LIMIT 1;`,
        ],
        solution: `WITH hostile_sessions AS (
            SELECT DISTINCT user_id
            FROM sessions
            WHERE ip_address NOT LIKE '10.%'
        )
                   SELECT u.username,
                          SUM(ABS(t.amount)) AS total_exfil
                   FROM hostile_sessions hs
                            JOIN users u         ON hs.user_id = u.id
                            JOIN transactions t  ON t.user_id  = u.id
                   GROUP BY u.username
                   ORDER BY total_exfil DESC
                       LIMIT 1;`,
        validate(res, userAnswer) {
            if (userAnswer?.trim().toLowerCase() === 'ghost_proc_44') return true
            return 'The answer is ghost_proc_44. Build a CTE for hostile sessions, join to users and transactions, order by SUM(ABS(amount)) DESC.'
        },
    },
]