const knex = require('knex');
require('dotenv').config(); 

const knexConfig = {
  client: 'pg',
  connection: {
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  },
};

const db = knex(knexConfig);

module.exports = knexConfig;
