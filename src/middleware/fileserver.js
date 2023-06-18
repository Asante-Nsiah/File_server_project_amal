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

exports.uploadFile = async (req, res) => {
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
        const values = [title, description, file.filename]; // Add the filename to the values
        const result = await pool.query(query, values);
        const uploadedFile = result.rows[0];

        // Fetch all files from the database
        const filesQuery = 'SELECT * FROM files';
        const filesResult = await pool.query(filesQuery);
        const files = filesResult.rows;

        // Render the admin dashboard template with the uploaded file and all files
        res.render('admin-dashboard', { files: files, uploadedFile: uploadedFile });
      } catch (error) {
        console.error('Error storing file:', error);
        res.status(500).send('Internal server error');
      }
    }
  });
};

  


exports.downloadFile = async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '..', 'files', filename);
  console.log(__dirname);

  
  // Check if the file exists before initiating the download
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(404).send('File not found');
      return;
    }
  
    // Stream the file for download
    const fileStream = fs.createReadStream(filePath, { autoClose: true });
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fileStream.pipe(res)
  .on('finish', () => {
    // File download completed successfully
    console.log('File download completed successfully');
    res.status(200).send('File download completed successfully');
  })
  .on('error', (err) => {
    // Handle any errors that occur during the download
    console.error('Error downloading file:', err);
    res.status(500).send('Error downloading file');
  });
  });
};

exports.searchFiles = (req, res) =>{
  const searchTerm = req.query.searchTerm; // Assuming the search term is sent as a query parameter

  // Perform the search query using PostgreSQL
  pool.query(
    'SELECT * FROM files WHERE title ILIKE $1 OR description ILIKE $1',
    [`%${searchTerm}%`],
    (err, result) => {
      if (err) {
        console.error('Error executing search query:', err);
        res.sendStatus(500); // Internal Server Error
      } else {
        const files = result.rows;
        res.render('user-dashboard', { files }); // Render the user-dashboard view with the search results
      }
    }
  );
};
