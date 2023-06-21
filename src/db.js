
const { Pool } = require('pg');
require('dotenv').config();


    const pool = new Pool({
      host: process.env.PGHOST,
      port: process.env.PGPORT,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: {
        rejectUnauthorized: false, 
      },
      });
    
      pool.connect()
      .then(() => {
        console.log('Connected to FlieServerDB database');
      })
      .catch((err) => {
        console.error('Error connecting to FlieServerDB database:', err);
      });


      

module.exports = pool;
