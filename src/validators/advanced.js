// Advanced track (10 puzzles)
// Clue words: VECTOR → TOOLKIT → INGRESS → PRIMARY → IDENTITY →
//             ESCALATE → ERASURE → TIMELINE → IMPACT → UNMASKED

export const advancedPuzzles = [
    {
        id: 1,
        story: `You've confirmed the breach. Now you need to understand the attack surface.

The sessions table is your starting point — it records every authenticated connection to the system. On the night of June 3rd, between 02:09 and 02:15, a coordinated intrusion was underway. Multiple accounts. Same external IP. Each one a key turning in a different lock.

How many distinct user accounts were part of this operation?`,
        prompt: `How many distinct user_ids appear in sessions where ip_address is NOT in the 10.x.x.x range AND started_at begins with '2024-06-03'?`,
        expectedAnswer: '4',
        clue: 'VECTOR',
        hints: [
            `Filter with WHERE ip_address NOT LIKE '10.%' AND started_at LIKE '2024-06-03%' to isolate the hostile sessions.`,
            `Use COUNT(DISTINCT user_id) — some accounts may have opened multiple sessions that night.`,
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
            return '4 distinct accounts connected from the hostile IP on June 3rd.'
        },
    },

    {
        id: 2,
        story: `Four accounts. But look at how they connected.

Real employees use browsers — their user_agent strings start with "Mozilla". What you're seeing in the hostile sessions is different. Scripted tools. Automated clients. Someone wrote code to do this.

The distinction matters for attribution. A browser means a human at a keyboard. A scripted agent means infrastructure. This was planned.

How many of the hostile sessions used automated tooling?`,
        prompt: `How many sessions from IP 185.220.101.34 have a user_agent that does NOT start with 'Mozilla'?`,
        expectedAnswer: '3',
        clue: 'TOOLKIT',
        hints: [
            `Filter WHERE ip_address = '185.220.101.34' to isolate the attacker's sessions.`,
            `Add AND user_agent NOT LIKE 'Mozilla%' to exclude browser sessions.`,
            `SELECT COUNT(*) AS automated
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
            return '3 automated sessions. Filter on the hostile IP and NOT LIKE \'Mozilla%\'.'
        },
    },

    {
        id: 3,
        story: `Automated tools. Pre-written scripts. This wasn't opportunistic — this was a rehearsed operation.

The network_events table logs raw packet data crossing the perimeter. The attacker didn't just show up on one port. They probed the perimeter first — knocking on doors, listening for responses. Then they found the one that answered.

The first port they hit tells you something about their initial approach. Find it.`,
        prompt: `What was the first port contacted FROM the hostile IP 185.220.101.34, ordered by created_at ascending?`,
        expectedAnswer: '443',
        clue: 'INGRESS',
        hints: [
            `Filter WHERE src_ip = '185.220.101.34' to get packets the attacker sent (not received).`,
            `ORDER BY created_at ASC LIMIT 1 gives you the earliest network event.`,
            `SELECT port
             FROM network_events
             WHERE src_ip = '185.220.101.34'
             ORDER BY created_at ASC LIMIT 1;`,
        ],
        solution: `SELECT port, event_type, created_at
                   FROM network_events
                   WHERE src_ip = '185.220.101.34'
                   ORDER BY created_at ASC LIMIT 1;`,
        validate(res, userAnswer) {
            if (parseInt(userAnswer?.trim(), 10) === 443) return true
            return 'Port 443. ORDER BY created_at ASC, LIMIT 1.'
        },
    },

    {
        id: 4,
        story: `They came in on 443 — the same port as legitimate HTTPS traffic. Invisible in the noise.

Now follow the money. The transactions table holds the record of everything taken. One account is responsible for the single largest extraction — a transaction so large it stands alone. It's the primary exfiltration account, the one the whole operation was built around.

Which user_id signed off on the biggest loss?`,
        prompt: `Which user_id is linked to the transaction with the lowest (most negative) amount?`,
        expectedAnswer: '11',
        clue: 'PRIMARY',
        hints: [
            `Negative amounts represent outbound data. The most negative value is the largest extraction.`,
            `ORDER BY amount ASC puts the most negative row first. LIMIT 1 returns just that row.`,
            `SELECT user_id, amount
             FROM transactions
             ORDER BY amount ASC LIMIT 1;`,
        ],
        solution: `SELECT user_id, amount, target, created_at
                   FROM transactions
                   ORDER BY amount ASC LIMIT 1;`,
        validate(res, userAnswer) {
            if (parseInt(userAnswer?.trim(), 10) === 11) return true
            return 'user_id 11. ORDER BY amount ASC LIMIT 1.'
        },
    },

    {
        id: 5,
        story: `User_id 11. That number keeps surfacing in the logs.

Pull its full profile. The account was created the same morning as the breach — 02:09, six minutes before the first failed login attempt. Its email domain doesn't exist. Its department is listed as SYSTEM. Its is_active flag is 0.

This account was purpose-built. Created, used, and meant to be abandoned. The username is the only real fingerprint it left behind.

What is it?`,
        prompt: `What is the username of user_id 11?`,
        expectedAnswer: 'ghost_proc_44',
        clue: 'IDENTITY',
        hints: [
            `Simple lookup: SELECT * FROM users WHERE id = 11`,
            `SELECT username
             FROM users
             WHERE id = 11;`,
            `SELECT id, username, email, role, department, created_at
             FROM users
             WHERE id = 11;`,
        ],
        solution: `SELECT *
                   FROM users
                   WHERE id = 11;`,
        validate(res, userAnswer) {
            if (userAnswer?.trim().toLowerCase() === 'ghost_proc_44') return true
            return 'The username is ghost_proc_44.'
        },
    },

    {
        id: 6,
        story: `ghost_proc_44.

The name was chosen to blend in — a service account, routine-looking, the kind of thing a sysadmin creates and forgets. Except this one was given something no routine service account needs: root access.

To get that access, the attacker needed to escalate privileges — overwriting role assignments and pushing admin rights to multiple compromised accounts simultaneously.

The audit trail still has traces. Count the escalations.`,
        prompt: `How many rows in audit_logs have action = 'PRIV_ESCALATION'?`,
        expectedAnswer: '3',
        clue: 'ESCALATE',
        hints: [
            `SELECT COUNT(*)
             FROM audit_logs
             WHERE action = 'PRIV_ESCALATION'`,
            `You can also SELECT the individual rows to see which accounts were escalated and when.`,
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
            return '3 privilege escalation events. Filter WHERE action = \'PRIV_ESCALATION\'.'
        },
    },

    {
        id: 7,
        story: `Three accounts elevated to root in under ninety seconds. But that's not the most chilling part.

After gaining root access, the attacker moved to erase their tracks. ALTER_AUDIT_LOG events — deletions, truncations, rewrites — targeted the very table you're querying right now. They tried to burn the evidence.

They almost succeeded. But one entry survived: a detail field describing exactly how many records they deleted.

Find it. That number will matter when the lawyers get involved.`,
        prompt: `Look at the detail column for rows where action = 'ALTER_AUDIT_LOG'. How many entries were deleted?`,
        expectedAnswer: '44',
        clue: 'ERASURE',
        hints: [
            `SELECT detail
             FROM audit_logs
             WHERE action = 'ALTER_AUDIT_LOG'`,
            `Read the detail text carefully — one row states an exact number of deleted entries.`,
            `SELECT user_id, action, detail, created_at
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
            return 'The detail text says "Deleted 44 entries from audit_log". Answer: 44.'
        },
    },

    {
        id: 8,
        story: `Forty-four entries erased. But not enough.

You need the complete attack timeline — every action the hostile IP took, in the order it happened. Some of the accounts involved have NULL usernames (the ghost accounts), so a plain JOIN would drop those rows. You need a LEFT JOIN and COALESCE to keep every event visible, even the ones with no identity attached.

The second-to-last action before the attacker disconnected tells you the final thing they did before vanishing. Reconstruct the sequence.`,
        prompt: `Join audit_logs to users (LEFT JOIN) for all events from IP 185.220.101.34, ordered by created_at ASC. What is the action of the second-to-last row?`,
        expectedAnswer: 'DATA_EXFIL',
        clue: 'TIMELINE',
        hints: [
            `Use LEFT JOIN users ON audit_logs.user_id = users.id so ghost-account rows aren't dropped.`,
            `COALESCE(u.username, '[UNKNOWN]') replaces NULL usernames with a placeholder.`,
            `SELECT al.created_at, al.action, COALESCE(u.username, '[UNKNOWN]') AS username, al.detail
             FROM audit_logs al
                      LEFT JOIN users u ON al.user_id = u.id
             WHERE al.ip_address = '185.220.101.34'
             ORDER BY al.created_at ASC;`,
        ],
        solution: `SELECT al.created_at,
                          al.action,
                          COALESCE(u.username, '[UNKNOWN]') AS username,
                          al.detail
                   FROM audit_logs al
                            LEFT JOIN users u ON al.user_id = u.id
                   WHERE al.ip_address = '185.220.101.34'
                   ORDER BY al.created_at ASC;`,
        validate(res, userAnswer) {
            if (userAnswer?.trim().toUpperCase() === 'DATA_EXFIL') return true
            return 'The second-to-last action is DATA_EXFIL. Join, filter on the hostile IP, order by time, read the penultimate row.'
        },
    },

    {
        id: 9,
        story: `DATA_EXFIL. Right up until the final LOGOUT.

The network_events table captured the raw packet flow as data left the building. Four separate DATA_OUT bursts — each one a wave of stolen records streaming to the hostile IP over HTTPS, invisible to standard monitoring.

You need the total byte count. This is what goes in the breach notification. This is what triggers the regulatory fines. Make it exact.`,
        prompt: `What is the total SUM of bytes_sent for all network_events where event_type = 'DATA_OUT'?`,
        expectedAnswer: '436200000',
        clue: 'IMPACT',
        hints: [
            `SUM(bytes_sent) with WHERE event_type = 'DATA_OUT'`,
            `SELECT SUM(bytes_sent) AS total_bytes
             FROM network_events
             WHERE event_type = 'DATA_OUT';`,
            `SELECT SUM(bytes_sent) AS total_bytes, COUNT(*) AS events
             FROM network_events
             WHERE event_type = 'DATA_OUT';`,
        ],
        solution: `SELECT SUM(bytes_sent) AS total_bytes_exfiltrated
                   FROM network_events
                   WHERE event_type = 'DATA_OUT';`,
        validate(res, userAnswer) {
            if (parseInt(userAnswer?.trim(), 10) === 436200000) return true
            return '436,200,000 bytes. Filter WHERE event_type = \'DATA_OUT\' and SUM(bytes_sent).'
        },
    },

    {
        id: 10,
        story: `436 million bytes. Over 415 megabytes of client data, trading records, and personnel files — gone in under four minutes.

You have all the pieces. Now assemble them.

Use a Common Table Expression to isolate every user_id that connected from outside the internal network. Join those accounts to their users profiles, then to their transactions. Sum the absolute value of their exports. Rank them.

The account at the top of that list is the one that did the most damage. That's your primary suspect. Name them.`,
        prompt: `Write a CTE that finds the username with the highest total ABS(amount) across all transactions, joining through sessions (ip NOT LIKE '10.%'). What is the username?`,
        expectedAnswer: 'ghost_proc_44',
        clue: 'UNMASKED',
        hints: [
            `Start with: WITH hostile AS (SELECT DISTINCT user_id FROM sessions WHERE ip_address NOT LIKE '10.%')`,
            `Join hostile → users ON user_id, then → transactions ON user_id. GROUP BY username, SUM(ABS(amount)).`,
            `WITH hostile AS (SELECT DISTINCT user_id FROM sessions WHERE ip_address NOT LIKE '10.%')
             SELECT u.username, SUM(ABS(t.amount)) AS total_exfil
             FROM hostile h
                      JOIN users u ON h.user_id = u.id
                      JOIN transactions t ON t.user_id = u.id
             GROUP BY u.username
             ORDER BY total_exfil DESC LIMIT 1;`,
        ],
        solution: `WITH hostile AS (SELECT DISTINCT user_id
                                    FROM sessions
                                    WHERE ip_address NOT LIKE '10.%')
                   SELECT u.username,
                          SUM(ABS(t.amount)) AS total_exfil
                   FROM hostile h
                            JOIN users u ON h.user_id = u.id
                            JOIN transactions t ON t.user_id = u.id
                   GROUP BY u.username
                   ORDER BY total_exfil DESC LIMIT 1;`,
        validate(res, userAnswer) {
            if (userAnswer?.trim().toLowerCase() === 'ghost_proc_44') return true
            return 'ghost_proc_44. Build the CTE, join through to transactions, SUM(ABS(amount)), ORDER BY DESC.'
        },
    },
]
