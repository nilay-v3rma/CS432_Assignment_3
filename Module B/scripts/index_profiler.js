const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPathSource = path.join(__dirname, '..', 'gategaurd.db');
const dbPathTest = path.join(__dirname, '..', 'gategaurd_test.db');

// Duplicate the existing DB for testing to not ruin the original
if (fs.existsSync(dbPathTest)) {
    fs.unlinkSync(dbPathTest);
}
fs.copyFileSync(dbPathSource, dbPathTest);

const db = new sqlite3.Database(dbPathTest);

// Utilities map
const run = (query, params = []) => new Promise((res, rej) => db.run(query, params, err => err ? rej(err) : res()));
const all = (query, params = []) => new Promise((res, rej) => db.all(query, params, (err, rows) => err ? rej(err) : res(rows)));

async function generateData(numPersons = 2000, numLogs = 10000) {
    console.log(`\n⏳ Generating dummy data... (${numPersons} persons, ${numLogs} logs)`);

    await run('BEGIN TRANSACTION');
    // Generate Person Info
    for(let i=0; i<numPersons; i++) {
        const type = i % 10 === 0 ? 'guest' : (i % 2 === 0 ? 'member' : 'visitor');
        const status = i % 5 === 0 ? 'inactive' : 'active';
        // Random date in the past year
        const dateOffset = Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000);
        const date = new Date(Date.now() - dateOffset).toISOString().replace('T', ' ').slice(0, 19);
        await run(`INSERT INTO person_info (type, status, created_at) VALUES (?, ?, ?)`, [type, status, date]);
    }

    // Generate People Logs
    for(let i=0; i<numLogs; i++) {
        const person_id = Math.floor(Math.random() * numPersons) + 1;
        const gate_id = (i % 4) + 1; // Assuming gate 1-4
        const log_type = i % 2 === 0 ? 'entry' : 'exit';
        const dateOffset = Math.floor(Math.random() * 100 * 24 * 60 * 60 * 1000);
        const date = new Date(Date.now() - dateOffset).toISOString().replace('T', ' ').slice(0, 19);
        
        await run(`INSERT INTO people_log (gate_id, person_id, log_type, time) VALUES (?, ?, ?, ?)`, 
                  [gate_id, person_id, log_type, date]);
    }
    await run('COMMIT');
    console.log('✅ Dummy data generated successfully.');
}

async function measureQuery(name, query, params = []) {
    const iterations = 5; // Run multiple times to average out noise
    let totalTime = 0;
    let resSize = 0;
    
    // Warm up
    await all(query, params);

    for(let i=0; i<iterations; i++) {
        const start = process.hrtime.bigint();
        const rows = await all(query, params);
        const end = process.hrtime.bigint();
        totalTime += Number(end - start) / 1000000; // ms
        resSize = rows.length;
    }
    const avgTimeMs = totalTime / iterations;
    console.log(`⏱️  [${name}] Execution Time: ${avgTimeMs.toFixed(2)} ms | Rows retrieved: ${resSize}`);
    return avgTimeMs;
}

async function executeProfile() {
    console.log('🚀 Starting Index Profiling...');
    await generateData(5000, 25000);
    
    // Define the test queries
    const q1 = {
        name: 'Find logs by narrow time range',
        query: `SELECT * FROM people_log WHERE time BETWEEN '2026-01-01 00:00:00' AND '2026-02-15 23:59:59'`, // 1 week
        params: []
    };
    
    const q2 = {
        name: 'Find guest details by person_id (JOIN)',
        query: `SELECT p.person_id, p.type, l.log_type, l.time FROM person_info p JOIN people_log l ON p.person_id = l.person_id WHERE p.type = 'guest' AND l.log_type = 'entry' AND l.time > '2026-02-01'`, // Complex join with filtering
        params: []
    };
    
    const q3 = {
        name: 'Count entries per gate rapidly',
        query: `SELECT gate_id, COUNT(*) FROM people_log WHERE log_type = 'entry' AND time > '2026-03-01' GROUP BY gate_id`,
        params: []
    };

    console.log('\n--- 🟥 BEFORE INDEXING ---');
    const beforeTimes = [];
    beforeTimes.push(await measureQuery(q1.name, q1.query, q1.params));
    beforeTimes.push(await measureQuery(q2.name, q2.query, q2.params));
    beforeTimes.push(await measureQuery(q3.name, q3.query, q3.params));

    console.log('\n--- 🛠️ CREATING INDEXES ---');
    
    // Apply Indexes
    await run(`CREATE INDEX idx_people_log_time ON people_log (time);`);
    console.log(`+ Created index 'idx_people_log_time' on people_log(time)`);
    
    await run(`CREATE INDEX idx_person_info_type_status ON person_info (type, status);`);
    console.log(`+ Created composite index 'idx_person_info_type_status' on person_info(type, status)`);
    
    await run(`CREATE INDEX idx_people_log_type_time ON people_log (log_type, time, gate_id);`); // Covering index for the aggregate basically
    console.log(`+ Created composite index 'idx_people_log_type_time' on people_log(log_type, time, gate_id)`);

    console.log('\n--- 🟩 AFTER INDEXING ---');
    const afterTimes = [];
    afterTimes.push(await measureQuery(q1.name, q1.query, q1.params));
    afterTimes.push(await measureQuery(q2.name, q2.query, q2.params));
    afterTimes.push(await measureQuery(q3.name, q3.query, q3.params));

    console.log('\n--- 📊 SUMMARY (Avg Execution Ms) ---');
    console.log(`| Target | Before | After | Improvement |`);
    console.log(`|--------|--------|-------|-------------|`);
    for(let i=0; i<3; i++) {
        const impr = ((beforeTimes[i] - afterTimes[i]) / beforeTimes[i] * 100).toFixed(1);
        console.log(`| Q${i+1}     | ${beforeTimes[i].toFixed(2)} | ${afterTimes[i].toFixed(2)} |  ${impr}% faster |`);
    }

    // Cleanup
    db.close();
    console.log('\n✅ Profiling complete. See gategaurd_test.db for the generated DB with indexes.');
}

executeProfile().catch(console.error);