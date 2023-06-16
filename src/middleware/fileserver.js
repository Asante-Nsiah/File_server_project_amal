const pool = require("../db");
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

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
          res.render('admin-dashboard', { files: uploadedFile });
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

exports.downloadCount = async (req, res) => {
  try {
    // Fetch downloads information from the database
    const result = await pool.query('SELECT download_count FROM downloads');
    const downloads = result.rows.map((row) => row.count);

    res.render('downloads', { downloads: downloads });
  } catch (err) {
    console.error('Error fetching downloads:', err);
    res.status(500).send('Error fetching downloads');
  }
  };

exports.downloadFile = async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.resolve(__dirname, 'fileserver', 'files', filename);
  
  // Check if the file exists before initiating the download
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(404).send('File not found');
      return;
    }
  
    // Stream the file for download
    const fileStream = fs.createReadStream(filePath);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fileStream.pipe(res);
  
    // Handle any stream or download errors
    fileStream.on('error', (err) => {
      console.error('Error streaming file:', err);
      res.status(500).send('Error downloading file');
    });
  });
}
