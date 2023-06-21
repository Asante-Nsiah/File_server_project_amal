const pg = require('pg');
const knex = require('knex');

const ConnectDb = knex({
    client: 'pg',
    connection: {
      connectionString: 'postgres://projectadmin:Y4M0LaKBqXFCLXwmdYvdn3NOI6jJxoEN@dpg-ci661uunqql3q38ihjvg',
      ssl: {
        rejectUnauthorized: false
      }
    }
  });

  

  module.exports = ConnectDb; 