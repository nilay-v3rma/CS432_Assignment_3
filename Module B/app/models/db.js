/**
 * Database Configuration & Utilities
 * 
 * Provides:
 * - Database initialization helper
 * - Query execution wrappers
 * - Connection management
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

/**
 * Initialize Database Connection
 * 
 * @param {string} dbPath - Path to SQLite database file
 * @returns {sqlite3.Database} Database connection object
 */
const initializeDatabase = (dbPath) => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('✅ Database initialized:', dbPath);
        resolve(db);
      }
    });
  });
};

/**
 * Execute SQL Dump File
 * 
 * Reads and executes SQL statements from the provided dump file
 * 
 * @param {sqlite3.Database} db - Database connection
 * @param {string} sqlDumpPath - Path to SQL dump file
 * @returns {Promise} Resolves when all statements are executed
 */
const executeSQLDump = (db, sqlDumpPath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(sqlDumpPath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      // Split statements and filter empty ones
      const statements = data
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      if (statements.length === 0) {
        resolve({ count: 0, errors: 0 });
        return;
      }

      let completed = 0;
      let errors = 0;

      statements.forEach((statement) => {
        db.run(statement, (err) => {
          if (err) {
            // Some errors like "table already exists" are expected
            console.warn(`⚠️  Non-critical error: ${err.message}`);
            errors++;
          }
          completed++;

          if (completed === statements.length) {
            resolve({ count: statements.length, errors });
          }
        });
      });
    });
  });
};

/**
 * Promisified Database Query
 * Executes a SELECT query and returns results
 * 
 * @param {sqlite3.Database} db - Database connection
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Array of result rows
 */
const dbQuery = (db, query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
};

/**
 * Promisified Database Get (Single Row)
 * 
 * @param {sqlite3.Database} db - Database connection
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|null>} Single row or null
 */
const dbGet = (db, query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
};

/**
 * Promisified Database Run (INSERT, UPDATE, DELETE)
 * 
 * @param {sqlite3.Database} db - Database connection
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<{id, changes}>} Last inserted ID and number of changes
 */
const dbRun = (db, query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          id: this.lastID,
          changes: this.changes,
        });
      }
    });
  });
};

/**
 * Create Default Admin and User Accounts
 * Should only be called during initial setup
 * 
 * @param {sqlite3.Database} db - Database connection
 */
const createDefaultAccounts = async (db) => {
  const bcrypt = require('bcryptjs');

  try {
    // Check if users table exists and has data
    const userCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row?.count || 0);
        }
      });
    });

    if (userCount > 0) {
      console.log('ℹ️  Users already exist, skipping default account creation');
      return;
    }

    // Hash default passwords
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const userPasswordHash = await bcrypt.hash('user123', 10);

    // Insert default accounts
    const insertAdmin = `
      INSERT INTO users (username, password_hash, role, email)
      VALUES ('admin', ?, 'admin', 'admin@gateguard.local')
    `;

    const insertUser = `
      INSERT INTO users (username, password_hash, role, email)
      VALUES ('user', ?, 'user', 'user@gateguard.local')
    `;

    db.run(insertAdmin, [adminPasswordHash], function (err) {
      if (err) {
        console.warn('Could not create admin account:', err.message);
      } else {
        console.log('✅ Default admin account created (username: admin, password: admin123)');
      }
    });

    db.run(insertUser, [userPasswordHash], function (err) {
      if (err) {
        console.warn('Could not create user account:', err.message);
      } else {
        console.log('✅ Default user account created (username: user, password: user123)');
      }
    });
  } catch (err) {
    console.warn('Error creating default accounts:', err.message);
  }
};

module.exports = {
  initializeDatabase,
  executeSQLDump,
  dbQuery,
  dbGet,
  dbRun,
  createDefaultAccounts,
};
