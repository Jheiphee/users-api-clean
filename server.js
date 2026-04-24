require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const serverless = require('serverless-http');

const app = express();

// ✅ CORS (important for AWS + Postman)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(express.json());

/*
========================================
  🔥 DATABASE CONNECTION (AWS RDS)
========================================
*/
const pool = new Pool({
  host: "db-paul.c3awo28o84db.ap-southeast-2.rds.amazonaws.com",
  database: "training_db",
  user: "test_test_paul",
  password: "Leonorajuban29",
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

/*
========================================
  ✅ ROOT
========================================
*/
app.get('/', (req, res) => {
  res.send('Users API is running 🚀');
});

/*
========================================
  ✅ GET ALL USERS
========================================
*/
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('GET /users ERROR:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

/*
========================================
  ✅ GET SINGLE USER
========================================
*/
app.get('/users/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found ❌' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('GET /users/:id ERROR:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

/*
========================================
  ✅ CREATE USER
========================================
*/
app.post('/users', async (req, res) => {
  try {
    const { name, email, age, gender, bday } = req.body;

    const result = await pool.query(
      `INSERT INTO users (name, email, age, gender, bday)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, email, age, gender, bday]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('POST /users ERROR:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

/*
========================================
  ✅ UPDATE USER
========================================
*/
app.put('/users/:id', async (req, res) => {
  try {
    const { name, email, age, gender, bday } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET name = $1, email = $2, age = $3, gender = $4, bday = $5
       WHERE id = $6
       RETURNING *`,
      [name, email, age, gender, bday, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found ❌' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('PUT /users/:id ERROR:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

/*
========================================
  ✅ DELETE USER
========================================
*/
app.delete('/users/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found ❌' });
    }

    res.json({
      message: 'User deleted successfully 🗑️',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('DELETE /users/:id ERROR:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

/*
========================================
  🔥 LOCAL SERVER (for testing)
========================================
*/
if (require.main === module) {
  app.listen(3000, () => {
    console.log('🚀 Running locally at http://localhost:3000');
  });
}

/*
========================================
  🔥 EXPORT FOR LAMBDA
========================================
*/
module.exports.handler = serverless(app, {
  request: (req, event, context) => {
    req.headers['x-forwarded-proto'] = 'https';
  }
});