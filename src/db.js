const { Pool } = require('pg');


    const pool = new Pool({
        user: 'projectadmin',
        host: 'dpg-ci661uunqql3q38ihjvg-a.oregon-postgres.render.com',
        database: 'fileserverdb_2s24',
        password: 'Y4M0LaKBqXFCLXwmdYvdn3NOI6jJxoEN',
        ssl: {
          rejectUnauthorized: false
        },
        port: '5432',
      });
    
      pool.connect()
      .then(() => {
        console.log('Connected to fileServerDB database');
      })
      .catch((err) => {
        console.error('Error connecting to database:', err);
      });




module.exports = pool;
