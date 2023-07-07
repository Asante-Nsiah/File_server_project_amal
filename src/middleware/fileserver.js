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
        const insertQuery = 'INSERT INTO files (title, description, filename) VALUES ($1, $2, $3)';
        const insertValues = [title, description, file.filename];

        // Insert the file
        await pool.query(insertQuery, insertValues);

        // Retrieve the inserted file and order by the "id" column in descending order (last uploaded file first)
        const selectQuery = 'SELECT * FROM files WHERE filename = $1 ORDER BY id DESC LIMIT 1';
        const selectValues = [file.filename];
        const selectResult = await pool.query(selectQuery, selectValues);
        const uploadedFile = selectResult.rows[0];

        // // Fetch the updated download count for the uploaded file
        // const downloadCountQuery = 'SELECT download_count FROM files WHERE id = $1';
        // const downloadCountResult = await pool.query(downloadCountQuery, [uploadedFile.id]);
        // const downloadCount = downloadCountResult.rows[0].download_count;

        // Fetch all files from the database, ordered by the "id" column in descending order (last uploaded file first)
        const filesQuery = 'SELECT * FROM files ORDER BY id DESC';
        const filesResult = await pool.query(filesQuery);
        const files = filesResult.rows;

        // Render the admin dashboard template with the uploaded file, all files, and the download count
        res.render('admin-dashboard', { files, uploadedFile });
      } catch (error) {
        console.error('Error storing file:', error);
        res.status(500).send('Internal server error');
      }
    }
  });
};








  


exports.downloadFile = async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'uploads', filename);

    // Check if the file exists before initiating the download
    const fileExists = await fs.promises.access(filePath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);

    if (!fileExists) {
      console.error('Error downloading file: File not found');
      return res.status(404).send('File not found');
    }

    // Stream the file for download
    const fileStream = fs.createReadStream(filePath, { autoClose: true });

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fileStream.pipe(res)
      .on('finish', async () => {
        // File download completed successfully
        console.log('File download completed successfully');

        // Increment the download count in the database
        const incrementDownloadCountQuery = 'UPDATE files SET download_count = COALESCE(download_count, 0) + 1 WHERE filename = $1';
        await pool.query(incrementDownloadCountQuery, [filename]);

        // Fetch the updated download count for the downloaded file
        const fetchDownloadCountQuery = 'SELECT download_count FROM files WHERE filename = $1';
        const downloadCountResult = await pool.query(fetchDownloadCountQuery, [filename]);
        const downloadCount = downloadCountResult.rows[0].download_count;

        // Increment the email count in the database
        const incrementEmailCountQuery = 'UPDATE files SET email_count = COALESCE(email_count, 0) + 1 WHERE filename = $1';
        await pool.query(incrementEmailCountQuery, [filename]);

        // Fetch the updated email count for the downloaded file
        const fetchEmailCountQuery = 'SELECT email_count FROM files WHERE filename = $1';
        const emailCountResult = await pool.query(fetchEmailCountQuery, [filename]);
        const emailCount = emailCountResult.rows[0].email_count;

        // Render the download count and email count in the response
        res.status(200).json({ message: 'File downloaded successfully', downloadCount, emailCount });
      })
      .on('error', (err) => {
        // Handle any errors that occur during the download
        console.error('Error downloading file:', err);
        res.status(500).send('Error downloading file');
      });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).send('Error downloading file');
  }
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
        res.render('user-dashboard', { files, email: '' }); // Render the user-dashboard view with the search results
      }
    }
  );
};

exports.emailFiles = async (req, res) => {
  try {
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

    const { filename } = req.params;
    const { email } = req.body;

    if (!filename || !email) {
      return res.status(400).send('Missing filename or email'); // Bad Request
    }

    // Retrieve the file information from the database
    const fileQuery = 'SELECT * FROM files WHERE filename = $1';
    const fileResult = await pool.query(fileQuery, [filename]);
    const file = fileResult.rows[0];

    if (!file) {
      return res.status(404).send('File not found'); // Not Found
    }

    const filePath = path.join(__dirname, '..', '..', 'uploads', file.filename);

    // Read the file to get its contents
    const data = await fs.promises.readFile(filePath);

    const attachment = {
      filename: filename,
      content: data
    };

    // Send email with the file attachment
    const emailInfo = await transporter.sendMail({
      from: 'demoproject369@gmail.com',
      to: email,
      subject: 'File Attachment',
      text: 'Dear recipient,\n\nPlease find the file attached for your reference.\n\nBest regards,\nYour Name',
      attachments: [attachment]
    });

    console.log('Email sent:', emailInfo.response);

    // Increment the email count in the database
    const incrementQuery = 'UPDATE files SET email_count = COALESCE(email_count, 0) + 1 WHERE filename = $1';
    await pool.query(incrementQuery, [filename]);

    const queryParams = new URLSearchParams({ message: 'Email sent successfully' }).toString();
    res.redirect(`/email-success?${queryParams}`);
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Internal server error');
  }
};


exports.emailSuccess = (req, res) => {
  const { message } = req.query;
  res.render('email-success', { message });
  
};