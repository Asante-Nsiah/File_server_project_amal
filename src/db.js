
const { Pool } = require('pg');
const knexConfig = require('./knexfile');


    const pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'fileServerDB',
        password: 'postgres',
        port: 5433,
      });
    
      pool.connect()
      .then(() => {
        console.log('Connected to FlieServerDB database');
      })
      .catch((err) => {
        console.error('Error connecting to FlieServerDB database:', err);
      });


      

module.exports = pool;
