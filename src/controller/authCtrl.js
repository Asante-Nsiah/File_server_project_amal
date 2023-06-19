
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
      
    
      // Generate verification tok en
      const token = jwt.sign({ email }, 'secret', { expiresIn: 1000 * 60 * 60 }); // 1 hour

        const verification = await authModel.storeToken(token);
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
  
    if (!user.is_verified) {
      return res.status(401).json({ message: 'Email not verified' });
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
  try {
    // Retrieve files from the database
    const filesQuery = 'SELECT *, COALESCE(download_count, 0) AS download_count FROM files';
    const filesResult = await pool.query(filesQuery);
    const files = filesResult.rows;

    const email = req.query.email;
    const { message } = req.query;
    res.render('user-dashboard', { files, email, message });
  } catch (error) {
    console.error('Error retrieving files:', error);
    return res.status(500).send('Internal server error');
  }
};

exports.dashboardAdmin = async (req, res) => {
  try {
    const client = await pool.connect();
  
    // Query the files table
    const filesQuery = 'SELECT *, COALESCE(download_count, 0) AS download_count FROM files';
    const filesResult = await client.query(filesQuery);
    const files = filesResult.rows;
  
    // Query the downloads table
    const downloadsQuery = 'SELECT download_count FROM files'; // Replace with the appropriate query for the downloads table
    const downloadsResult = await client.query(downloadsQuery);
    const downloads = downloadsResult.rows;
  
    // Query the emails table
    const emailsQuery = 'SELECT email_count FROM files'; // Replace with the appropriate query for the emails table
    const emailsResult = await client.query(emailsQuery);
    const emails = emailsResult.rows;
  
    client.release();

    res.render('admin-dashboard', { files });
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).send('Internal server error');
  }
  
  };
exports.requestPd = async (req, res) => {
    res.render("request-resetPd");
  
  };


// Set up nodemailer transporter with your email service credentials
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
  
  // Generate a random token for password reset
  function generateToken() {
    const length = 20;
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
  
  // Store the token and email in memory for demo purposes
  const tokenMap = new Map();

  exports.forgetPassword = async (req, res) => {
    const { email } = req.body;
    // Check if email exists in your user database
    // If it does, generate a token and send a password reset email
    // with a link that includes the token in the URL
    try {
      const user = await authModel.findEmail({ email });
      console.log(`email:${email}`)
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const token = generateToken();
      tokenMap.set(token, email);
      const mailOptions = {
        from: 'demoproject369@gmail.com',
        to: email,
        subject: 'Password reset request',
        text: `Click the following link to reset your password: http://localhost:8000/reset-password/${token}`
      };
  
     
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          return res.status(500).json({ message: 'Error sending email' });
        }
        console.log('Email sent: ' + info.response);
        res.status(200).json({ message: 'Password reset email sent' });
        pool.query('UPDATE users SET reset_token = $1 WHERE email = $2', [token, email], (err, result) => {
          if (err) {
            console.log(err);
            return res.status(400).json({ message: 'Reset password link error' });
          }
          console.log('Reset password link updated successfully');
        });
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal server error' });
    }
     
  };

  exports.resetPassword = (req, res) => {
    const { token } = req.query;
    res.render('reset-password', {token});
  
   
  };