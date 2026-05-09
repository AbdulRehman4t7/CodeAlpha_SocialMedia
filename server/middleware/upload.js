const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Absolute paths based on this file's location (server/middleware/)
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');
const PROFILES_DIR = path.join(UPLOADS_ROOT, 'profiles');
const POSTS_DIR = path.join(UPLOADS_ROOT, 'posts');

// Ensure upload directories exist
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

ensureDir(PROFILES_DIR);
ensureDir(POSTS_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = file.fieldname === 'profilePicture' ? PROFILES_DIR : POSTS_DIR;
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, jpeg, png, gif, webp)'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

module.exports = upload;
