// CIPHER DESIGN (explained in FinalView):
//   The answer to the FinalView is a username the player directly observed
//   in the query results during Advanced Task 5.
//   It is NOT derived from clue word first letters.
//   Players must have noted it — or re-run the query.
//
// Task 10 answer: 210 (MB) — the largest single-account exfil total
// This forces players to actually read the CTE output rather than paste
// the username they just saw, keeping the FinalView answer non-trivial.

export const advancedTasks = [
    {
        id: 1,
        story: `The breach was coordinated. Multiple accounts. One night. Six minutes from first probe to last data burst.\n\nThe sessions table logs every authenticated connection to the system — who connected, from where, and when. On June 3rd, something hit from outside the corporate network and opened sessions across several accounts simultaneously.\n\nBefore you can trace what they took, you need to know how many accounts they had control of.`,
        prompt: `On the night of the breach, how many distinct user accounts had sessions originating from outside the internal network?`,
        expectedAnswer: '4',
        clue: 'PERIMETER',
        hints: [
            'The sessions table has both ip_address and started_at columns.',
            'You want to count unique users, not unique sessions — one account may have had multiple connections.',
            'Filter by date using the started_at column and exclude the internal IP range you identified earlier.',
        ],
        solution: `SELECT COUNT(DISTINCT user_id) AS hostile_users
                   FROM sessions
                   WHERE ip_address NOT LIKE '10.%'
                     AND started_at LIKE '2024-06-03%';`,
        validate(res, answer) {
            if (parseInt(answer?.trim(), 10) === 4) return true
            return 'Use COUNT(DISTINCT user_id) after filtering by the breach date and non-internal IP range.'
        },
    },

    {
        id: 2,
        story: `Four compromised accounts. But look at how they connected.\n\nA real employee at their desk uses a browser. Their sessions carry a user_agent string beginning with "Mozilla" — every major browser sends it. What you're seeing in these hostile sessions is something else entirely. Not one of them used a browser. Every single connection came from automated tooling — curl, python-requests, scripted API calls.\n\nThis isn't someone stumbling across a vulnerability and poking around out of curiosity. Someone built infrastructure for this attack. Tested it. Deployed it. This was rehearsed.`,
        prompt: `Every session from the hostile IP left a user_agent record. How many of them came from automated tools rather than a browser?`,
        expectedAnswer: '4',
        clue: 'REMOTE',
        hints: [
            `The user_agent column reveals what software made each connection.`,
            `Browser sessions follow a consistent naming pattern — you can filter on it to identify them, then invert the filter to find everything else.`,
            `Count the rows from the hostile IP where the user_agent does not match the browser pattern.`,
        ],
        solution: `SELECT COUNT(*) AS automated_sessions
                   FROM sessions
                   WHERE ip_address = '185.220.101.34'
                     AND user_agent NOT LIKE 'Mozilla%';`,
        validate(res, answer) {
            if (parseInt(answer?.trim(), 10) === 4) return true
            return `Count every session from the hostile IP where the user_agent does not begin with the standard browser identifier.`
        },
    },

    {
        id: 3,
        story: `Automated tools. Pre-written scripts. A rehearsed, planned operation.\n\nBefore any account was touched, before any data moved, the attacker was already probing. The network_events table captures every packet crossing the perimeter — including the very first contact. Their first knock tells you how they approached.\n\nWhat they connected to first reveals their initial access vector.`,
        prompt: `Before the attacker authenticated, they made network contact. What was the very first port they reached out to?`,
        expectedAnswer: '443',
        clue: 'ORIGIN',
        hints: [
            'The network_events table records src_ip (source) and dst_ip (destination) — you want packets that came FROM the hostile IP.',
            'Once filtered to the right source address, ordering by timestamp reveals which event came first.',
            'LIMIT 1 after ORDER BY will return only the earliest record.',
        ],
        solution: `SELECT port, event_type, created_at
                   FROM network_events
                   WHERE src_ip = '185.220.101.34'
                   ORDER BY created_at ASC LIMIT 1;`,
        validate(res, answer) {
            if (parseInt(answer?.trim(), 10) === 443) return true
            return 'Filter on the src_ip column for outbound packets from the attacker, then sort by time and take the first row.'
        },
    },

    {
        id: 4,
        story: `Port 443. HTTPS. They came in through the same channel as legitimate web traffic — invisible to standard monitoring.\n\nAmong all the transactions that moved data out of the building, one stands apart. The single largest extraction. One account, one transaction, one catastrophic loss. Everything else was noise around this central act.\n\nThis is the account the entire operation was built to serve.`,
        prompt: `One transaction dwarfs all others in terms of data moved out. Which user_id was responsible for it?`,
        expectedAnswer: '11',
        clue: 'CROWN',
        hints: [
            'Outbound data is represented as negative amounts in the transactions table.',
            'Sorting a column in ascending order puts the most extreme negative value at the top.',
            'You only need the single most extreme row — one row, one user_id.',
        ],
        solution: `SELECT user_id, amount, created_at
                   FROM transactions
                   ORDER BY amount ASC LIMIT 1;`,
        validate(res, answer) {
            if (parseInt(answer?.trim(), 10) === 11) return true
            return 'Sort the transactions table by amount in ascending order — the most negative value is the largest extraction. Read the user_id from that row.'
        },
    },

    {
        id: 5,
        story: `User_id 11 keeps appearing everywhere in the logs.\n\nPull its full record. Created the same morning as the breach — minutes before the first failed login attempt. Email domain: nonexistent. Department: SYSTEM. Active flag: disabled. This account was created for one purpose, and that purpose was this attack.\n\nIts username is the only fingerprint it left behind.\n\n⚠ Note this username carefully. You will need it at the Final Debrief.`,
        prompt: `Pull the complete profile for user_id 11 and note down the username — you will need it later.`,
        expectedAnswer: 'ghost_proc_44',
        clue: 'FABRICATED',
        hints: [
            'You have the id — this is a direct lookup in the users table.',
            'SELECT everything from the row where id matches the value you found in the previous task.',
        ],
        solution: 'SELECT * FROM users WHERE id = 11;',
        validate(res, answer) {
            if (answer?.trim().toLowerCase() === 'ghost_proc_44') return true
            return 'Look up the user record directly by their id — the username is in the results.'
        },
    },

    {
        id: 6,
        story: `ghost_proc_44. The name itself is deliberate — designed to look like an automated system process, the kind of thing that gets ignored in log reviews.\n\nBut a service account doesn't need root privileges. To get those, the attacker had to make explicit escalation moves — overwriting role assignments, granting admin rights to multiple accounts in the span of minutes.\n\nThose events are logged. They weren't erased fast enough.`,
        prompt: `How many privilege escalation events are recorded in the audit logs?`,
        expectedAnswer: '3',
        clue: 'ELEVATED',
        hints: [
            'The audit_logs table has an action column that categorises each security event.',
            'You want to count rows matching a specific escalation action type — run SELECT DISTINCT action FROM audit_logs to see what values exist.',
            'Once you know the exact action string, COUNT(*) with a WHERE clause gives you the total.',
        ],
        solution: `SELECT user_id, detail, created_at
                   FROM audit_logs
                   WHERE action = 'PRIV_ESCALATION'
                   ORDER BY created_at;`,
        validate(res, answer) {
            if (parseInt(answer?.trim(), 10) === 3) return true
            return 'Filter the audit_logs table by the privilege escalation action type and count the matching rows.'
        },
    },

    {
        id: 7,
        story: `Three accounts elevated to root in under ninety seconds. Then came the erasure.\n\nWith root access, the attacker turned their attention to the audit trail itself — the very evidence you're using right now. They ran ALTER_AUDIT_LOG operations, deleting rows, truncating tables, trying to make the breach invisible.\n\nBut they missed something. One surviving log entry still describes exactly how much they erased.`,
        prompt: `One surviving log entry describes the scale of the deletion. How many audit entries did they erase?`,
        expectedAnswer: '44',
        clue: 'EXPUNGED',
        hints: [
            'The detail column in audit_logs contains a plain-text description of what each action did.',
            'Filter for the action type that relates to modifying or altering audit records.',
            'Read the detail text on the returned rows — the number is written in the description.',
        ],
        solution: `SELECT user_id, detail, created_at
                   FROM audit_logs
                   WHERE action = 'ALTER_AUDIT_LOG'
                   ORDER BY created_at;`,
        validate(res, answer) {
            if (answer?.trim() === '44') return true
            return 'Read the detail field on the ALTER_AUDIT_LOG rows — the number you need is written in the text.'
        },
    },

    {
        id: 8,
        story: `Forty-four entries gone. But they didn't get everything.\n\nYou need the full sequence — every action the hostile IP took, in order, from first contact to final disconnect. The complication: some of the accounts involved have NULL usernames (the ghost accounts you identified earlier). A standard JOIN would silently drop those rows, leaving gaps in the timeline you can't afford.\n\nYou need every event visible. When you look at the complete picture, just before the logouts, the last thing the attacker did before going dark tells you the true purpose of the operation.`,
        prompt: `Reconstruct the complete hostile activity timeline. What was the final action taken before the attacker's sessions ended?`,
        expectedAnswer: 'DATA_EXFIL',
        clue: 'SEQUENCE',
        hints: [
            `A regular JOIN silently drops rows where no match exists in the joined table — there is a variant that keeps all rows from the left table regardless.`,
            `SQL has a function that substitutes a fallback value when a column is NULL — useful for showing a placeholder instead of a blank username.`,
            `Filter to the hostile IP, order chronologically, and look at the row just above the LOGOUT entries at the bottom.`,
        ],
        solution: `SELECT al.created_at,
                          al.action,
                          COALESCE(u.username, '[UNKNOWN]') AS username,
                          al.detail
                   FROM audit_logs al
                            LEFT JOIN users u ON al.user_id = u.id
                   WHERE al.ip_address = '185.220.101.34'
                   ORDER BY al.created_at ASC;`,
        validate(res, answer) {
            if (answer?.trim().toUpperCase() === 'DATA_EXFIL') return true
            return `Build the full chronological timeline and look at the last action before the LOGOUT entries at the bottom of the list.`
        },
    },

    {
        id: 10,
        story: `You have all the pieces. Now build the final picture.\n\nA Common Table Expression lets you name an intermediate result and reference it like a table in the same query. This is the cleanest way to solve multi-step problems: first isolate which accounts had hostile sessions, then join to users and transactions, then aggregate.\n\nRun the full query. Look at the ranked output. The largest single-account exfil total — expressed in megabytes — is your final evidence figure. That number closes the file.`,
        prompt: `Using a CTE that links hostile sessions → users → transactions, rank accounts by total data extracted. What is the largest individual account total, in megabytes (divide bytes by 1,000)?`,
        expectedAnswer: '210',
        clue: 'MASTERMIND',
        hints: [
            'Start with: WITH hostile AS ( SELECT DISTINCT user_id FROM sessions WHERE ip_address NOT LIKE \'10.%\' )',
            'Join the CTE result to users (for usernames) and to transactions (for amounts). Group by username.',
            'SUM(ABS(amount)) gives total extracted per account. The top row has the answer — divide that number by 1000 for MB.',
        ],
        solution: `WITH hostile AS (SELECT DISTINCT user_id
                                    FROM sessions
                                    WHERE ip_address NOT LIKE '10.%')
                   SELECT u.username, SUM(ABS(t.amount)) AS total_exfil
                   FROM hostile h
                            JOIN users u ON h.user_id = u.id
                            JOIN transactions t ON t.user_id = u.id
                   GROUP BY u.username
                   ORDER BY total_exfil DESC;`,
        validate(res, answer) {
            const n = parseInt(answer?.trim(), 10)
            if (n === 210) return true
            // Accept if they enter the raw value without converting
            if (n === 210000) return true
            return 'Run the full CTE query, look at the largest value in the total_exfil column, and divide it by 1000 to get megabytes. Do not enter a username here.'
        },
    },
]