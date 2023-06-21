// const { Pool } = require('pg');
const  ConnectDb  = require('./migrateDb');

    const pool = new ConnectDb({
        user: 'postgres',
        host: 'localhost',
        database: 'fileServerDB',
        password: 'postgres',
        port: '5433',
      });
    
    
      
       async function poool() {
        try {
          await pool.connect();
          console.log('Connected to fileServerDB database');
        } catch (err) {
          console.error('Error connecting to database:', err);
        }
      }


module.exports = pool;
