const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for profile pictures
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../frontend/public/profile-pictures');
    console.log('Multer destination path:', uploadPath);
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      console.log('Creating directory:', uploadPath);
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename for profile pictures
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'profile-' + uniqueSuffix + path.extname(file.originalname);
    console.log('Multer filename:', filename);
    cb(null, filename);
  }
});

// Profile picture upload middleware
const profileUpload = multer({ 
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    console.log('Multer file filter - file:', file.originalname, 'mimetype:', file.mimetype);
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      console.log('File accepted by multer');
      cb(null, true);
    } else {
      console.log('File rejected by multer - not an image');
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

module.exports = { profileUpload };
