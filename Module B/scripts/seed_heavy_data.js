const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '../gategaurd.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database for heavy seeding');
});

// Helper for random choice
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
// Helper for random integer
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
// Helper for random date within past years
const randomPastDate = (yearsBack) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - randomInt(0, yearsBack));
  d.setMonth(randomInt(0, 11));
  d.setDate(randomInt(1, 28));
  d.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59));
  return d.toISOString().replace('T', ' ').substring(0, 19);
};
// Helper to pad numbers
const pad = (num, size) => ('000000000' + num).substr(-size);

async function seedData() {
  db.serialize(() => {
    db.run("BEGIN TRANSACTION;");
    
    let lastPersonId = 5013; // Starting after existing records roughly
    const memberIds = [];
    const guestIds = [];
    const visitorIds = [];
    const guestRequestIds = [];

    console.log("Seeding Members, Guests, Visitors and Person Info...");
    for (let i = 10001; i <= 15000; i++) {
      lastPersonId++;
      const type = randomChoice(['member', 'guest', 'visitor']);
      const status = randomChoice(['active', 'inactive', 'active', 'active']);
      const createdAt = randomPastDate(3);
      
      db.run("INSERT INTO person_info (person_id, type, status, created_at) VALUES (?, ?, ?, ?)", [lastPersonId, type, status, createdAt]);

      if (type === 'member') {
        const memberId = 'MEM_' + pad(i, 6);
        memberIds.push({ pId: lastPersonId, mId: memberId });
        db.run("INSERT INTO member (member_id, person_id, name, image, age, email, contact) VALUES (?, ?, ?, ?, ?, ?, ?)", 
          [memberId, lastPersonId, `Member ${i}`, `img_${i}.jpg`, randomInt(18, 60), `member${i}@inst.ac.in`, `900${pad(i, 7)}`]);
      } else if (type === 'visitor') {
        const visitorId = 'VIS_' + pad(i, 6);
        visitorIds.push({ pId: lastPersonId, vId: visitorId });
        db.run("INSERT INTO visitor (visitor_id, person_id, name, contact, age, reason, gate_id, in_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
          [visitorId, lastPersonId, `Visitor ${i}`, `800${pad(i, 7)}`, randomInt(20, 50), randomChoice(['Delivery', 'Meeting', 'Interview']), randomInt(1, 3), createdAt]);
      } else {
        const guestId = 'GST_' + pad(i, 6);
        guestIds.push({ pId: lastPersonId, gId: guestId, i: i });
      }
    }

    console.log("Seeding Guest Requests and connecting to Guests...");
    const memList = memberIds.map(m => m.mId);
    if (memList.length > 0) {
      for (let i = 1; i <= 2000; i++) {
        const rStatus = randomChoice(['pending', 'approved', 'rejected']);
        const exitDate = randomPastDate(1).substring(0, 10);
        db.run("INSERT INTO guest_request (member_id, name, contact, reason, status, exit_date) VALUES (?, ?, ?, ?, ?, ?)", 
          [randomChoice(memList), `Guest Req ${i}`, `700${pad(i, 7)}`, 'Personal', rStatus, exitDate], function(err) {
            if (!err) guestRequestIds.push(this.lastID);
        });
      }
    }

    // Process guests when requests are roughly known
    // Since guest requests are added async in sqlite, we wait for request completion via a trick or just use IDs 1..2000 assuming auto-increment starts after existing
    let nextReqId = 5; // offset
    for(const g of guestIds) {
      db.run("INSERT INTO guest (guest_id, person_id, room_number, guest_request_id) VALUES (?, ?, ?, ?)", 
        [g.gId, g.pId, `R${randomInt(100, 500)}`, randomInt(1, 2000)]);
    }

    console.log("Seeding People Logs...");
    for (let i = 1; i <= 50000; i++) {
      const gId = randomInt(1, 3);
      const pId = randomInt(1, lastPersonId);
      const lType = randomChoice(['entry', 'exit']);
      const time = randomPastDate(3);
      db.run("INSERT INTO people_log (gate_id, person_id, log_type, time) VALUES (?, ?, ?, ?)", [gId, pId, lType, time]);
    }

    db.run("COMMIT;", (err) => {
      if (err) {
        console.error("❌ Commit failed", err);
      } else {
        console.log("✅ Successfully seeded huge database!");
      }
    });

  });
}

seedData();
