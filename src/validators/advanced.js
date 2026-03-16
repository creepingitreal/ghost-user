// src/validators/advanced.js
//
// CIPHER KEY (explained on FinalView):
//   Basic clues 1-5 first letters:    G-H-O-S-T   → "ghost"
//   Advanced clues 1-4 first letters: P-R-O-C     → "proc"
//   Answer from Advanced task 7:      44           → "44"
//   Combined with underscores:        ghost_proc_44

export const advancedTasks = [
    {
        id: 1,
        // Clue first letter: P
        story: `The breach was coordinated. Multiple accounts. One night. Six minutes from first probe to last data burst.\n\nThe sessions table logs every authenticated connection to the system — who connected, from where, and when. On June 3rd, something hit from outside the corporate network and opened sessions across several accounts simultaneously.\n\nBefore you can trace what they took, you need to know how many accounts they had control of.`,
        prompt: `On the night of the breach, how many distinct user accounts had sessions originating from outside the internal network?`,
        expectedAnswer: '4',
        clue: 'PERIMETER',
        hints: [
            'The sessions table has both ip_address and started_at columns.',
            'You want to count unique users, not unique sessions — one account may have had multiple connections.',
            "Filter by date using the started_at column and exclude the internal IP range you identified earlier.",
        ],
        solution: `SELECT COUNT(DISTINCT user_id) AS hostile_users
                   FROM sessions
                   WHERE ip_address NOT LIKE '10.%'
                     AND started_at LIKE '2024-06-03%';`,
        validate(res, answer) {
            if (parseInt(answer?.trim(), 10) === 4) return true
            return 'That\'s not quite right. Use COUNT(DISTINCT ...) after filtering by date and IP range.'
        },
    },

    {
        id: 2,
        // Clue first letter: R
        story: `Four compromised accounts. But not all connected the same way.\n\nA real employee sitting at their desk uses a browser. Every browser sends a standard identifier in the user_agent field — it starts with "Mozilla". What you're seeing in these hostile sessions is different. Automated tooling. Scripts running against the API. Someone built infrastructure for this attack.\n\nThat distinction matters for attribution. This wasn't a person at a keyboard.`,
        prompt: `Of the sessions connected from the hostile IP, how many were running automated tools rather than a browser?`,
        expectedAnswer: '3',
        clue: 'REMOTE',
        hints: [
            'The user_agent column reveals what software made the connection.',
            'Browser sessions follow a consistent naming pattern you can filter on.',
            "You want the hostile IP sessions where the agent doesn't match that browser pattern.",
        ],
        solution: `SELECT COUNT(*) AS automated_sessions
                   FROM sessions
                   WHERE ip_address = '185.220.101.34'
                     AND user_agent NOT LIKE 'Mozilla%';`,
        validate(res, answer) {
            if (parseInt(answer?.trim(), 10) === 3) return true
            return "That\'s not quite right. Filter on the hostile IP and exclude browser user agents."
        },
    },

    {
        id: 3,
        // Clue first letter: O
        story: `Automated tools. Pre-written scripts. A rehearsed, planned operation.\n\nBefore any account was touched, before any data moved, the attacker was already probing. The network_events table captures every packet crossing the perimeter — including the very first contact. Their first knock tells you how they approached.\n\nWhat they connected to first reveals their initial access vector.`,
        prompt: `Before the attacker authenticated, they made network contact. What was the very first port they reached out to?`,
        expectedAnswer: '443',
        clue: 'ORIGIN',
        hints: [
            'The network_events table records src_ip (source) and dst_ip (destination).',
            "You want packets that came FROM the hostile IP — think about which column that maps to.",
            'Once filtered, ordering by time will reveal which event came first.',
        ],
        solution: `SELECT port, event_type, created_at
                   FROM network_events
                   WHERE src_ip = '185.220.101.34'
                   ORDER BY created_at ASC LIMIT 1;`,
        validate(res, answer) {
            if (parseInt(answer?.trim(), 10) === 443) return true
            return 'That\'s not quite right. Check if there is a port that is the same as HTTPS traffic, done deliberately chosen to blend in.'
        },
    },

    {
        id: 4,
        // Clue first letter: C
        story: `Port 443. HTTPS. They came in through the same channel as legitimate web traffic — invisible to standard monitoring.\n\nAmong all the transactions that moved data out of the building, one stands apart. The single largest extraction. One account, one transaction, one catastrophic loss. Everything else was noise around this central act.\n\nThis is the account the entire operation was built to serve.`,
        prompt: `One transaction dwarfs all others in terms of data moved out. Which user was responsible for it?`,
        expectedAnswer: '11',
        clue: 'CROWN',
        hints: [
            'Outbound data is represented as negative amounts in the transactions table.',
            'Think about how to sort a column to put the most extreme value at the top.',
            "You only need the single most extreme row.",
        ],
        solution: `SELECT user_id, amount, "target", created_at
                   FROM transactions
                   ORDER BY amount ASC LIMIT 1;`,
        validate(res, answer) {
            if (parseInt(answer?.trim(), 10) === 11) return true
            return 'That\'s not quite right. Sort by amount ascending — the most negative value is the largest extraction.'
        },
    },

    {
        id: 5,
        story: `User_id 11 keeps appearing everywhere in the logs.\n\nPull its full record. Created the same morning as the breach — minutes before the first failed login attempt. Email domain: nonexistent. Department: SYSTEM. Active flag: disabled. This account was created for one purpose, and that purpose was this attack.\n\nIts username is the only fingerprint it left behind.`,
        prompt: `Pull the complete profile for user_id 11. What is their username?`,
        expectedAnswer: 'ghost_proc_44',
        clue: 'FABRICATED',
        hints: [
            'You have the id — this is a direct lookup in the users table.',
            'SELECT everything from the row where id matches.',
        ],
        solution: 'SELECT * FROM users WHERE id = 11;',
        validate(res, answer) {
            if (answer?.trim().toLowerCase() === 'ghost_proc_44') return true
            return "That\'s not quite right. Look up user id 11 directly."
        },
    },

    {
        id: 6,
        story: `ghost_proc_44. The name itself is deliberate — designed to look like an automated system process, the kind of thing that gets ignored in log reviews.\n\nBut a service account doesn't need root privileges. To get those, the attacker had to make explicit escalation moves — overwriting role assignments, granting admin rights to multiple accounts in the span of minutes.\n\nThose events are logged. They weren't erased fast enough.`,
        prompt: `How many privilege escalation events are recorded in the audit logs?`,
        expectedAnswer: '3',
        clue: 'ELEVATED',
        hints: [
            'The audit_logs table records different action types.',
            'You want to count rows matching a specific escalation action.',
            "Look at what action values exist in the table — SELECT DISTINCT action FROM audit_logs might help.",
        ],
        solution: `SELECT user_id, detail, created_at
                   FROM audit_logs
                   WHERE action = 'PRIV_ESCALATION'
                   ORDER BY created_at;`,
        validate(res, answer) {
            if (parseInt(answer?.trim(), 10) === 3) return true
            return "That\'s not quite right. Filter the audit_logs table by the escalation action type."
        },
    },

    {
        id: 7,
        story: `Three accounts elevated to root in under ninety seconds. Then came the erasure.\n\nWith root access, the attacker turned their attention to the audit trail itself — the very evidence you're using right now. They ran ALTER_AUDIT_LOG operations, deleting rows, truncating tables, trying to make the breach invisible.\n\nBut they missed something. One surviving log entry still describes exactly how much they erased.`,
        prompt: `One surviving log entry describes the scale of the deletion. How many audit entries did they erase?`,
        expectedAnswer: '44',
        clue: 'EXPUNGED',
        hints: [
            'The detail column in audit_logs contains a description of what each action did.',
            "Filter for the action type that relates to modifying or altering audit records.",
            "Read the detail text carefully — the number is written out in the description.",
        ],
        solution: `SELECT user_id, detail, created_at
                   FROM audit_logs
                   WHERE action = 'ALTER_AUDIT_LOG'
                   ORDER BY created_at;`,
        validate(res, answer) {
            if (answer?.trim() === '44') return true
            return 'That\'s not quite right. What does the detail field say about deleted entries from audit_log?'
        },
    },

    {
        id: 8,
        story: `Forty-four entries gone. But they didn't get everything.\n\nYou need the full sequence — every action the hostile IP took, in chronological order. The complication: some of the accounts involved have NULL usernames (your ghost accounts), which means a standard JOIN would silently drop those rows from the results. You need every event visible, even the anonymous ones.\n\nThe second-to-last action tells you what they were doing right before they vanished.`,
        prompt: `Reconstruct the complete hostile timeline. What action appears second-to-last before the attacker disconnected?`,
        expectedAnswer: 'DATA_EXFIL',
        clue: 'SEQUENCE',
        hints: [
            "A regular JOIN drops rows where the joined table has no match — there's a variant that keeps all rows from the left table.",
            "Some usernames will be NULL — SQL has a function that substitutes a fallback value when a field is NULL.",
            "Filter to the hostile IP, order chronologically, and read from the bottom of the results.",
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
            return 'That\'s not quite right. Build the full timeline and read the second-to-last row.'
        },
    },

    {
        id: 9,
        story: `DATA_EXFIL right up until the final LOGOUT.\n\nThe network layer captured what the application layer tried to hide. Four DATA_OUT bursts, each one a wave of records leaving over port 443, timed to the second with the exfiltration transactions you found earlier.\n\nThis is the number that goes in the breach notification. This is the figure the regulators will quote. It needs to be exact.`,
        prompt: `The network layer recorded every byte that left the building. What is the total volume of data that was exfiltrated?`,
        expectedAnswer: '436200000',
        clue: 'VOLUME',
        hints: [
            'The network_events table has a bytes_sent column and an event_type column.',
            "You want only the events representing outbound data transfers.",
            'Sum the bytes across all matching events.',
        ],
        solution: `SELECT SUM(bytes_sent) AS total_bytes_exfiltrated
                   FROM network_events
                   WHERE event_type = 'DATA_OUT';`,
        validate(res, answer) {
            if (parseInt(answer?.trim(), 10) === 436200000) return true
            return 'That\'s not quite right. Sum the bytes_sent column for the DATA_OUT event type.'
        },
    },

    {
        id: 10,
        story: `436 million bytes. 415 megabytes of client portfolios, trading records, personnel files. Gone in under four minutes.\n\nYou have all the pieces. Now build the final picture.\n\nSome SQL problems require you to break a complex query into named steps — first isolating one set of records, then joining them to other tables, then aggregating the result. This is one of those problems. Write it in layers. The account at the top of your ranked list is your primary suspect.`,
        prompt: `Using a multi-step query, identify which account is responsible for the greatest total volume of extracted data — linking sessions, users, and transactions together. What is their username?`,
        expectedAnswer: 'ghost_proc_44',
        clue: 'MASTERMIND',
        hints: [
            "Start by isolating which user IDs had sessions from outside the internal network — that's your hostile set.",
            "WITH (a Common Table Expression) lets you name an intermediate result and reference it like a table.",
            "Once you have the hostile user IDs, join to users to get usernames, then join to transactions to get amounts.",
        ],
        solution: `WITH hostile AS (SELECT DISTINCT user_id
                                    FROM sessions
                                    WHERE ip_address NOT LIKE '10.%')
                   SELECT u.username, SUM(ABS(t.amount)) AS total_exfil
                   FROM hostile h
                            JOIN users u ON h.user_id = u.id
                            JOIN transactions t ON t.user_id = u.id
                   GROUP BY u.username
                   ORDER BY total_exfil DESC LIMIT 1;`,
        validate(res, answer) {
            if (answer?.trim().toLowerCase() === 'ghost_proc_44') return true
            return 'That\'s not quite right. Build a CTE for hostile sessions, join to users and transactions, rank by total extracted.'
        },
    },
]