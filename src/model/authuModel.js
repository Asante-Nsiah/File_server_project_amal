const pool = require("../db");

exports.findEmail = async (email) => {
    let sql = `SELECT * FROM users WHERE email =$1`;
    let result = await pool.query(sql , [email] )
    return result
}

exports.createUser = async (email, hashedPassword) => {
 
    let sql = `INSERT INTO users (email, password) VALUES ($1, $2)`;
    let result = await pool.query(sql , [email, hashedPassword] )
    return result
}
exports.verifyToken = async (email, hashedPassword) => {
 
    let sql = `INSERT INTO users (email, password) VALUES ($1, $2)`;
    let result = await pool.query(sql , [email, hashedPassword] )
    return result
}