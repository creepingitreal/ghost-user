// puzzles/basic.js

function rows(res) {
    return res?.[0]?.values || []
}

function cols(res) {
    return res?.[0]?.columns || []
}

export const basicPuzzles = [
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 1,
        story: `
██ TRANSMISSION RECEIVED — CASE FILE: GHOST USER ██

Analyst. You're being brought in cold.

At 02:14 UTC, our internal network recorded an intrusion unlike anything
in the past three years. The attacker — already being called the "Ghost User"
— moved through our systems like they knew every corridor. They tampered
with logs, escalated privileges, and vanished before anyone raised the alarm.

We have three data sources to work with:
  · users         — registered accounts in the system
  · transactions  — all data movements and operations
  · audit_logs    — recorded system events

Before you can investigate, you need to know the terrain.

Your first task is simple: map the battlefield.
Run a query to see every table available in this database and
describe the structure of the 'users' table so you know what
columns you are working with.

Hint: SQLite stores table metadata in a system table called sqlite_master.
      To inspect a table's columns, try: PRAGMA table_info(table_name);
`,
        prompt: 'What are the column names in the users table? Enter the answer as a comma-separated list e.g. id, name, role',
        expectedAnswer: 'id, username, email, role, department, created_at, last_login, is_active',
        clue: 'RECON',
        solution: `PRAGMA table_info(users);`,
        validate: (res, userAnswer) => {
            if (!userAnswer) return 'Run the query, then type your answer above.'
            const cleaned = userAnswer.toLowerCase().replace(/\s/g, '')
            const required = ['id','username','email','role','department','created_at','last_login','is_active']
            const allFound = required.every(col => cleaned.includes(col))
            return allFound || 'Check your column list — make sure you have all 8 columns from the users table.'
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 2,
        story: `
██ CLUE FRAGMENT 1 ACQUIRED: RECON ██

Good work, Analyst. You know the layout now.

Intelligence suggests the Ghost User didn't enter through a legitimate 
identity. They used — or created — accounts that don't conform to standard
employee profiles. Normal staff accounts follow a clear pattern: they have
a username, an email, and an assigned department.

Somewhere in this database are accounts that break that pattern.
Accounts that look like they were placed there — not hired there.

Your task: find the anomalies. Look for any user records that are 
missing identity markers that every legitimate employee should have.
How many suspicious accounts can you find?
`,
        prompt: 'How many suspicious accounts did you find? Enter a number.',
        expectedAnswer: '3',
        clue: 'PHANTOM',
        solution: `SELECT COUNT(*) FROM users
                    WHERE username IS NULL
                       OR email IS NULL
                       OR department IS NULL;`,
        validate: (res, userAnswer) => {
            if (!userAnswer) return 'Run your query first, then type the count above.'
            const n = parseInt(userAnswer.trim())
            return n === 3 || 'Not quite. Think about what a real employee account must always have.'
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 3,
        story: `
██ CLUE FRAGMENT 2 ACQUIRED: PHANTOM ██

Three accounts with compromised identities. That's not coincidence — 
that's a pattern.

Now look at the transactions table. Something moved out of this network
that night. Not a small amount — something significant enough to be a 
primary objective. Data exfiltration at this scale leaves a mark in
the numbers.

Pull up the transactions. Study the types, the amounts, the targets.
Something will stand out. What is the total volume of data that left 
this network?

Hint: Run PRAGMA table_info(transactions); if you need to see the columns.
`,
        prompt: 'What is the total combined amount from all outbound data export transactions? Enter the number (negative values count).',
        expectedAnswer: '-436200',
        clue: 'EXODUS',
        solution: `SELECT SUM(amount) FROM transactions
                    WHERE type = 'data_export';`,
        validate: (res, userAnswer) => {
            if (!userAnswer) return 'Run your query and sum the relevant transactions.'
            const n = parseFloat(userAnswer.trim().replace(/,/g, ''))
            return (n === -436200 || n === 436200) || 'Check which transaction type represents outbound data — and sum their amounts.'
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 4,
        story: `
██ CLUE FRAGMENT 3 ACQUIRED: EXODUS ██

Massive. Over four hundred thousand units of data moved out in under 
ninety seconds. Someone knew exactly what they wanted.

But how did they get in? Ghost Users don't walk through the front door.
Check the audit_logs — every login, every failure, every escalation is
recorded there (or what's left of the record after they were done with it).

Before the breach succeeded, there were signs. Repeated failed attempts.
The kind of thing that happens when someone is hammering a lock.

Find the evidence of the forced entry. Which user_id was being hammered,
and how many times did they fail before getting through?
`,
        prompt: 'Enter the user_id that had failed login attempts, followed by the number of failures. Format: id:count e.g. 4:3',
        expectedAnswer: '4:3',
        clue: 'BREACH',
        solution: `SELECT user_id, COUNT(*) as failures
                    FROM audit_logs
                    WHERE action = 'FAILED_LOGIN'
                    GROUP BY user_id;`,
        validate: (res, userAnswer) => {
            if (!userAnswer) return 'Query the audit_logs and find repeated failure events.'
            const cleaned = userAnswer.trim().replace(/\s/g, '')
            return cleaned === '4:3' || 'Look for repeated failure actions in the logs — count them per user.'
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 5,
        story: `
██ CLUE FRAGMENT 4 ACQUIRED: BREACH ██

There it is. User ID 4 — one of the phantom accounts — battered the door
three times before the lock gave. But that's not the full picture.

The Ghost User didn't stop at getting in. They escalated. They rewrote
their own permissions mid-session. In the audit trail, there's a specific
action that records when a user's privileges were forcibly elevated.

Then — immediately after — the logs themselves were altered.

Your final basic task: prove the sequence. Show that privilege escalation
came first, and that a log alteration followed it. List the actions in 
chronological order for the suspicious IP address to demonstrate the 
chain of events.

The IP address of all Ghost User traffic originates from a single 
external source. You've seen it in the data — it was attached to 
every hostile transaction.
`,
        prompt: 'What is the external IP address all Ghost User activity originated from?',
        expectedAnswer: '185.220.101.34',
        clue: 'TRACED',
        solution: `SELECT action, created_at, ip_address
                    FROM audit_logs
                    WHERE ip_address = '185.220.101.34'
                    ORDER BY created_at ASC;`,
        validate: (res, userAnswer) => {
            if (!userAnswer) return 'Order the audit_logs by time and look at the IP address column.'
            const cleaned = userAnswer.trim()
            return cleaned === '185.220.101.34' || 'Look at the ip_address on the suspicious audit log entries — they all share one external IP.'
        }
    }
]