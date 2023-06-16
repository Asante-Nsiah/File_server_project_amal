const { Pool } = require('pg');


    const pool = new Pool({
        user: 'postgres',
        host: '127.0.0.1',
        database: 'fileServerDB',
        password: 'postgres',
        port: 5433,
      });
    
      pool.connect()
      .then(() => {
        console.log('Connected to fileServerDB database');
      })
      .catch((err) => {
        console.error('Error connecting to database:', err);
      });




module.exports = pool;
