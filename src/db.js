const { Pool } = require('pg');
const knex = require('knex');

    const pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'fileServerDB',
        password: 'postgres',
        port: '5433',
      });
    
      pool.connect()
      .then(() => {
        console.log('Connected to fileServerDB database');
      })
      .catch((err) => {
        console.error('Error connecting to database:', err);
      });

      const db = knex({
        client: 'pg',
        connection: {
          connectionString: 'postgres://projectadmin:Y4M0LaKBqXFCLXwmdYvdn3NOI6jJxoEN@dpg-ci661uunqql3q38ihjvg-a/fileserverdb_2s24',
          ssl: {
            rejectUnauthorized: false
          }
        }
      });


module.exports = pool;
