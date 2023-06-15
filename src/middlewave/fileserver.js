const pool = require("./../db");
const multer = require('multer');
const nodemailer = require('nodemailer');


// Set up file upload storage using Multer
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const extension = file.originalname.split('.').pop();
      cb(null, file.fieldname + '-' + uniqueSuffix + '.' + extension);
    },
  });
  
  const upload = multer({ storage }).single('file');
  
  exports.uploadFile = (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        console.error('Error uploading file:', err);
        res.status(500).send('Internal server error');
      } else {
        const { title, description } = req.body;
        const file = req.file;
  
        try {
          // Store the file information in the database
          const query = 'INSERT INTO files (title, description, filename) VALUES ($1, $2, $3) RETURNING *';
          const values = [title, description, file.filename];
          const result = await pool.query(query, values);
          const uploadedFile = result.rows[0];
  
          // Render the EJS template with the uploaded file's information
          res.render('admin-dashboard', { file: uploadedFile });
        } catch (error) {
          console.error('Error storing file:', error);
          res.status(500).send('Internal server error');
        }
      }
    });
  };
  

  exports.displayAdminFiles = async (req, res) => {
    try {
        const query = 'SELECT * FROM files';
        const result = await pool.query(query);
        const files = result.rows;
    
        res.render('admin-dashboard', { files: files });
      } catch (error) {
        console.error('Error retrieving files:', error);
        res.status(500).send('Internal server error');
      }
  };

exports.displayUserFiles = async (req, res) => {
    try {
        // Retrieve files from the database
        const filesQuery = 'SELECT * FROM files';
        const filesResult = await pool.query(filesQuery);
        const files = filesResult.rows;
    
        res.render('user-dashboard', { files });
      } catch (error) {
        console.error('Error retrieving files:', error);
        res.status(500).send('Internal server error');
      }
};