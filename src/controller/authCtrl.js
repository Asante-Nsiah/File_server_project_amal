
const pool = require("./../db");
const validator = require('validator');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const authModel = require("../model/authuModel");
const bcrypt = require('bcrypt');


exports.register = (req, res) => {
    res.render("signup");
  };
exports.signup = async (req, res) => {
    try{
        let { email, password, password2 } = req.body;
       
    console.log(req.body)
      if (!validator.isEmail(email)){
        return res.status(400).send('Invalid email address');
      }
     let errors = [];
    
     if ( !email || !password || !password2) {
      errors.push ({message: "Kindly fill all fields"});
     }
     if (password.length < 6){
      errors.push ({message: "Password must be at least 6 characters"})
     }
     if(password !==password2) {
      errors.push({message: "Passwords do not match"});
     }
     if (errors.length > 0){
      res.render("signup", {errors, email, password, password2});
     } else {
      const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
    
      // check if the email already exists
      let existingUser = await authModel.findEmail(email);
if (existingUser.rows.length > 0) {
  console.log('Email exists');
  req.flash('error', 'Email already registered');
  return res.redirect('/signup');
}
    
      let createdUser = await authModel.createUser(email, hashedPassword)
      if(createdUser.rows){
        req.flash("success_msg", "You have registered successfully. Kindly log in");
        res.redirect("/login");
      }
      
    
      // Generate verification token
     
      
      const token = jwt.sign({ email }, 'secret', { expiresIn: '1h' });
      
      let verification = await authModel.storeToken(token);
      if (verification) {
        console.log(`This is the token: ${token}`);
      }
      
      // Create email transport and send verification email
      const transporter = nodemailer.createTransport({
        pool: true,
        host: "smtp.gmail.com",
        port: 465,
        auth: {
          user: 'demoproject369@gmail.com',
          pass: 'ikuckqlhraenviig'
        },
        tls: {
        
          rejectUnauthorized: false,
        },
      });
    
      const mailOptions = {
        from: 'demoproject369@gmail.com',
        to: email,
        subject: 'Verify your email',
        text: `Please click the following link to verify your email: http://localhost:8000/verify?token=${token}`
      };
    console.log('find error')
      try {
        await transporter.sendMail(mailOptions);
    
        const insertQuery = 'INSERT INTO users (email, password, is_verified, verification_token) VALUES ($1, $2, $3, $4)';
        const insertValues = [email, password, false];
        await pool.query(insertQuery, insertValues);
        res.send('Verification email sent!');
        console.log(`This is the token: ${token}`);
      } catch (error) {
        console.error(error);
        res.status(500).send('Failed to send verification email');
      }
         }
      } catch(err) {
        console.log(err);
        return res.render("signup", {message: "Email already registered"});
    
      }
    
  };

 
exports.verify = async (req, res) => {
  const token = req.query.token;

  try {
    const decodedToken = jwt.verify(token, 'secret');
    const email = decodedToken.email;

    const query = 'SELECT * FROM users WHERE email = $1';
    const values = [email];

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res.status(400).send('User not found');
    }

    const user = rows[0];

    if (user.is_verified) {
      return res.send('Email already verified');
    }

    const updateQuery = 'UPDATE users SET is_verified = $1 WHERE email = $2';
    const updateValues = [true, email];

    await pool.query(updateQuery, updateValues);

    res.send('Email verified!');
  } catch (error) {
    console.error(error);
    res.status(400).send('Invalid or expired verification token');
  }
};

exports.login = async (req, res) => {
  res.render("login");

};
exports.loginAccount = async (req, res, next) => {
    const authenticatedUser = passport.authenticate('local', (err, user, info) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Internal server error' });
        }
    
        if (!user) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
    
        req.session.user = {
          email: user.email,
        };
    
        // Check if the email matches the admin email
        if (user.email === 'demoproject369@gmail.com') {
          // Redirect to the admin page
          return res.redirect('/admin-dashboard');
        }
    
        // Redirect to the dashboard
        return res.redirect('/user-dashboard');
      })(req, res, next);

};

exports.dashboardUser = async (req, res) => {
    res.render("user-dashboard");
  
  };

exports.dashboardAdmin = async (req, res) => {
    res.render("admin-dashboard");
  
  };