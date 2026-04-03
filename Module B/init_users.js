/**
 * Initialize Users Table with Default Accounts
 * Run this script once to seed the users table with admin and user accounts
 * 
 * Usage: node init_users.js
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'gategaurd.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// Hash passwords
async function initializeUsers() {
  try {
    // Hash admin password
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    console.log('✅ Admin password hashed');

    // Hash user password
    const userPasswordHash = await bcrypt.hash('user123', 10);
    console.log('✅ User password hashed');

    // Clear existing users (optional, comment out if you want to preserve)
    db.run('DELETE FROM users', (err) => {
      if (err && !err.message.includes('no such table')) {
        console.error('Error clearing users:', err.message);
      }
    });

    // Insert admin user
    db.run(
      `INSERT INTO users (username, password_hash, role, email) 
       VALUES (?, ?, ?, ?)`,
      ['admin', adminPasswordHash, 'admin', 'admin@gateguard.local'],
      function (err) {
        if (err) {
          console.error('❌ Error inserting admin user:', err.message);
        } else {
          console.log('✅ Admin user created (ID:', this.lastID, ')');
        }
      }
    );

    // Insert regular user
    db.run(
      `INSERT INTO users (username, password_hash, role, email) 
       VALUES (?, ?, ?, ?)`,
      ['user', userPasswordHash, 'user', 'user@gateguard.local'],
      function (err) {
        if (err) {
          console.error('❌ Error inserting user:', err.message);
        } else {
          console.log('✅ User account created (ID:', this.lastID, ')');
        }
      }
    );

    // Verify users were inserted
    setTimeout(() => {
      db.all('SELECT id, username, role, email FROM users', (err, rows) => {
        if (err) {
          console.error('Error fetching users:', err.message);
        } else {
          console.log('\n📋 Users in database:');
          console.table(rows);
          console.log('\n✅ Initialization complete!');
          console.log('You can now login with:');
          console.log('  - Username: admin, Password: admin123');
          console.log('  - Username: user, Password: user123');
        }
        db.close();
      });
    }, 500);
  } catch (err) {
    console.error('❌ Error during initialization:', err.message);
    db.close();
    process.exit(1);
  }
}

initializeUsers();
