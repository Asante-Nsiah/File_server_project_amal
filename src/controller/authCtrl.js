
const pool = require("./../db");
const validator = require('validator');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const authModel = require("../model/authuModel");
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

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
        text: `Please click the following link to verify your email: https://file-server-project-tc.onrender.com/verify?token=${token}`
        // text: `Please click the following link to verify your email: http://localhost:8000/verify?token=${token}`
      };
    console.log('find error')
      try {
        await transporter.sendMail(mailOptions);
    
        const insertQuery = 'INSERT INTO users (email, password, is_verified, verification_token) VALUES ($1, $2, $3, $4)';
        const insertValues = [email, password, false];
        await poool.query(insertQuery, insertValues);
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
  passport.authenticate('local', async (err, user, info) => {
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
      sessionId: uuidv4()
    };

    // Debugging: Log the session user object
    console.log('Session user:', req.session.user);

    // Retrieve files from the database, ordered by the "id" column in descending order
    const filesQuery = 'SELECT * FROM files ORDER BY id DESC';
    const filesResult = await pool.query(filesQuery);
    const files = filesResult.rows;

    // Check if the email matches the admin email
    if (user.email === 'demoproject369@gmail.com') {
      // Debugging: Log admin login
      console.log('Admin logged in');
      // Render the admin dashboard view with the files
      return res.render('admin-dashboard', { files });
    }

    // Debugging: Log user login
    console.log('User logged in');

    
    // Render the user dashboard view
    return res.render('user-dashboard', { files, email: '' });
  })(req, res, next);
};


exports.dashboardUser = async (req, res) => {
  try {
    if (!req.session.user) {
      // User is not logged in, redirect to the login page or show an appropriate message
      return res.redirect('/login'); // Replace '/login' with the actual URL of your login page
    }

    // Retrieve files from the database, ordered by the "id" column in descending order
    const filesQuery = 'SELECT * FROM files ORDER BY id DESC';
    const filesResult = await pool.query(filesQuery);
    const files = filesResult.rows;

    // Fetch the download count and email count for each file and add them to the file object
    for (const file of files) {
      const fetchDownloadCountQuery = 'SELECT download_count FROM files WHERE filename = $1';
      const downloadCountResult = await pool.query(fetchDownloadCountQuery, [file.filename]);
      file.downloadCount = downloadCountResult.rows[0].download_count;

      const fetchEmailCountQuery = 'SELECT email_count FROM files WHERE filename = $1';
      const emailCountResult = await pool.query(fetchEmailCountQuery, [file.filename]);
      file.emailCount = emailCountResult.rows[0].email_count;
    }

    const email = req.session.user.email;
    const message = req.query.message;
    
    res.render('user-dashboard', { files, email, message });
  } catch (error) {
    console.error('Error retrieving files:', error);
    return res.status(500).send('Internal server error');
  }
};


exports.dashboardAdmin = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'admin') {
      // User is not logged in as an admin, redirect to the appropriate page or show an appropriate message
      return res.redirect('/admin-login'); // Replace '/admin-login' with the actual URL of your admin login page
    }

    // Retrieve files from the database, ordered by the "id" column in descending order
    const filesQuery = 'SELECT * FROM files ORDER BY id DESC';
    const filesResult = await pool.query(filesQuery);
    const files = filesResult.rows;

    // Fetch the download count and email count for each file and add them to the file object
    for (const file of files) {
      const fetchDownloadCountQuery = 'SELECT download_count FROM files WHERE filename = $1';
      const downloadCountResult = await pool.query(fetchDownloadCountQuery, [file.filename]);
      file.downloadCount = downloadCountResult.rows[0].download_count;

      const fetchEmailCountQuery = 'SELECT email_count FROM files WHERE filename = $1';
      const emailCountResult = await pool.query(fetchEmailCountQuery, [file.filename]);
      file.emailCount = emailCountResult.rows[0].email_count;
    }

    res.render('admin-dashboard', { files });
  } catch (error) {
    console.error('Error retrieving files:', error);
    return res.status(500).send('Internal server error');
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

function generateToken(payload) {
  const length = 20;
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `${result}.${encodedPayload}`;
}


const tokenMap = new Map();

exports.forgetPassword = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await authModel.findEmail({ email });
    console.log(`email: ${email}`);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const tokenPayload = {
      email,
      expiryTime: Date.now() + (24 * 60 * 60 * 1000) // Set token expiration time to 24 hours from now
    };
    const token = generateToken(tokenPayload);

    tokenMap.set(token, email);

    const mailOptions = {
      from: 'demoproject369@gmail.com',
      to: email,
      subject: 'Password reset request',
      text: `Click the following link to reset your password: https://file-server-project-tc.onrender.com/update-password/${token}`
      // text: `Click the following link to reset your password: http://localhost:8000/update-password/${token}`
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent');
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;

  try {
    // Retrieve the email associated with the token from the database or cache
    const email = tokenMap.get(token);

    if (!email) {
      return res.status(404).json({ message: 'Invalid or expired reset token' });
    }

    // Render the reset-password view and pass the email and token as query parameters
    res.render('update-password', { email, token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


  

 exports.updatePassword = async (req, res) => {
  const { newpassword, confirmpassword, token } = req.body;

try {
  const email = tokenMap.get(token);

  if (!email) {
    return res.status(404).json({ message: 'Invalid or expired reset token' });
  }

  if (newpassword !== confirmpassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  } else {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newpassword, 10);

    // Update the user's password in the database
    await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
    console.log('Password reset successfully');
  }

  // Remove the token from the tokenMap
  tokenMap.delete(token);

  // Send a success message
  res.status(200).json({ message: 'Password reset successful' });

 
  
} catch (error) {
  console.log(error);
  res.status(500).json({ message: 'Internal server error' });
}

};

exports.checkSession = (req, res, next) => {
  if (req.session.user && req.session.user.sessionId) {
    // Check if the stored session identifier matches the current session identifier
    if (req.session.user.sessionId !== req.session.id) {
      // If the session identifiers do not match, it means the user has logged in from a different browser or device.
      // In this case, log them out and redirect to the login page.
      delete req.session.user.sessionId;
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
          return res.status(500).send('Internal Server Error');
        }
        res.redirect('/login');
      });
    } else {
      // Session identifier matches, determine the user's role and redirect accordingly
      const { email } = req.session.user;
      
      // Check if the email matches the admin email
      if (email === 'demoproject369@gmail.com') {
        // Store the retrieved session information in req.session.user
        req.session.user = { email, sessionId: req.session.id };
        // Redirect to the admin dashboard
        return res.redirect('/admin-dashboard');
      } else {
        // Store the retrieved session information in req.session.user
        req.session.user = { email, sessionId: req.session.id };
        // Redirect to the user dashboard
        return res.redirect('/user-dashboard');
      }
    }
  } else {
    // No session identifier found, user is not logged in
    res.redirect('/login'); // Redirect the user to the login page
  }
};



exports.logout = (req, res) => {
  if (req.session.user) {
    delete req.session.user.sessionId;
  }
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/login'); 
  });
};

 