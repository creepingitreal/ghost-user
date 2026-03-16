// src/validators/basic.js
// Clue first letters spell: G · H · O · S · T
// Combined with advanced clues 1-4 (P·R·O·C) + the number from adv task 7 (44):
//   GHOST + _ + PROC + _ + 44 = ghost_proc_44

export const basicTasks = [
    {
        id: 1,
        // Clue first letter: G
        story: `03:47. The call drags you out of a dead sleep.\n\n"We've been hit." Your CISO's voice is flat. Controlled. That's worse than panic.\n\nNexus Financial's production database — 15 years of client portfolios, trading histories, personnel records — was accessed by something that has no right to exist in your systems. No alarm fired. No access log flagged it. Whatever got in knew exactly where to look.\n\nYou have a read-only forensic mirror and six hours before the regulators arrive. You know nothing yet. Start at the beginning.`,
        prompt: `You're staring at a database you've never seen before. Before you can find anything, you need to know what you're working with. What tables exist, and what does the structure of the users table look like?`,
        expectedAnswer: '8',
        clue: 'GROUNDWORK',
        hints: [
            'MySQL has a command that lists all tables in the current database.',
            'Once you know the tables, there\'s a MySQL command that shows the columns of a specific table.',
            'You\'re looking for two separate commands — one to explore, one to inspect.',
        ],
        solution: 'SHOW TABLES;\nDESCRIBE users;',
        validate(res, answer) {
            if (parseInt(answer?.trim(), 10) === 8) return true
            return 'Count the rows returned by DESCRIBE users — each row is one column.'
        },
    },

    {
        id: 2,
        // Clue first letter: H
        story: `The schema is in front of you. Five tables. Thousands of rows.\n\nYou scan the users table and something's immediately wrong. Real employees have names, emails, departments. But several rows are hollow — critical identity fields missing entirely. NULL where a person should be.\n\nThese aren't data entry errors. Someone deliberately inserted accounts with just enough presence to authenticate but no traceable identity. They wanted to be invisible.`,
        prompt: `Something in the users table doesn't add up. Some records are missing the identity fields that every real employee should have. How many users are they?`,
        expectedAnswer: '3',
        clue: 'HOLLOW',
        hints: [
            'Look at the columns that identify a person: username, email, department.',
            'A missing value in SQL is represented by NULL — there\'s a specific operator to test for it.',
            'You need to find rows where ANY of those three fields is missing, not all of them.',
        ],
        solution: `SELECT COUNT(*) AS ghost_accounts
                   FROM users
                   WHERE username IS NULL
                      OR email IS NULL
                      OR department IS NULL;`,
        validate(res, answer) {
            if (parseInt(answer?.trim(), 10) === 3) return true
            return "That\'s not quite right. Check that you're looking for NULL in any of the three identity columns."
        },
    },

    {
        id: 3,
        // Clue first letter: O
        story: `Three ghost accounts seeded before the attack. But they're just the keys — what matters is what was taken.\n\nThe transactions table tells the real story. Most entries look routine: reads, deploys, transfers. But buried in the noise is a pattern you've seen before in financial exfiltration cases. Negative amounts. Outbound flows. A type of transaction that only runs when data is being moved somewhere it shouldn't go.\n\nThe scale of it, when you add it up, is going to make headlines.`,
        prompt: `Hidden in the transactions are records of data leaving the system. The amounts are negative — outbound. What is the total value that moved out?`,
        expectedAnswer: '-436200',
        clue: 'OUTFLOW',
        hints: [
            "The transaction type you're interested in contains the word 'export'.",
            'SQL has an aggregate function that adds up a column — useful when you need a total.',
            "Filter the transactions table to only the relevant type, then sum the amount column.",
        ],
        solution: `SELECT SUM(amount) AS total_exported
                   FROM transactions
                   WHERE type = 'data_export';`,
        validate(res, answer) {
            const clean = answer?.trim().replace(/\s/g, '')
            if (['-436200', '-436200.0', '-436200.00'].includes(clean)) return true
            const val = res?.[0]?.values?.[0]?.[0]
            if (val === -436200 || val === -436200.0) return true
            return 'That\'s not quite right. Make sure you\'re only summing the relevant transaction type.'
        },
    },

    {
        id: 4,
        // Clue first letter: S
        story: `$436,200 of data value extracted in under four minutes.\n\nBefore any of that could happen, the attacker needed a way in. The audit log captures everything — including the failed attempts that came before the successful one. Someone was hammering an account door.\n\nNormal security policy should have triggered a lockout. It didn't. That tells you something about what happened on the inside — but first, find the account they were targeting.`,
        prompt: `The audit logs contain traces of a brute-force attempt before the breach. Which account was targeted, and how many failed attempts were logged against it?`,
        expectedAnswer: '4:3',
        clue: 'SIEGE',
        hints: [
            'The audit_logs table records the type of each action — look for failed authentication events.',
            'Once filtered, you can count how many times each user appears using GROUP BY.',
            'To find the worst-hit account, consider how to order your results.',
        ],
        solution: `SELECT user_id, COUNT(*) AS attempts
                   FROM audit_logs
                   WHERE action = 'FAILED_LOGIN'
                   GROUP BY user_id
                   ORDER BY attempts DESC
                       LIMIT 1;`,
        validate(res, answer) {
            if (answer?.trim() === '4:3') return true
            return 'Format your answer as user_id:count — e.g. 5:1 means user 4 had 1 failed attempts.'
        },
    },

    {
        id: 5,
        // Clue first letter: T
        story: `User_id 4's account was the door they kicked in.\n\nEvery single hostile event in every log table traces back to one external address. Internal traffic uses a consistent IP range — your corporate network. Anything outside that range is either a remote worker, a vendor, or an attacker.\n\nThere are no scheduled external vendors. No authorised remote sessions logged for that night. Whatever IP you find sitting outside the internal range is the origin of this entire attack.`,
        prompt: `Internal traffic comes from one IP range. Anything else is foreign. What external address appears in the transactions data?`,
        expectedAnswer: '185.220.101.34',
        clue: 'TRACER',
        hints: [
            'Internal IPs follow a specific pattern — look at the ip_address column to see what format they use.',
            'SQL has a pattern-matching operator that can filter strings by a prefix.',
            'You want the addresses that do NOT match the internal pattern, and only unique values.',
        ],
        solution: `SELECT DISTINCT ip_address
                   FROM transactions
                   WHERE ip_address NOT LIKE '10.%';`,
        validate(res, answer) {
            if (answer?.trim() === '185.220.101.34') return true
            return "That\'s not quite right. Filter out the internal range and look for what's left."
        },
    },
]