const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Multer generic storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); 
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
  }
});

// CSV / Excel file filter
const fileFilterCSV = (req, file, cb) => {
  const allowedMimeTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) || ext === '.csv' || ext === '.xlsx') {
    cb(null, true);
  } else {
    cb(new Error('Only .csv and .xlsx formats allowed!'), false);
  }
};

// Image filter
const fileFilterImage = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images allowed!'), false);
  }
};

exports.uploadCSV = multer({ storage: storage, fileFilter: fileFilterCSV });
exports.uploadImage = multer({ storage: storage, fileFilter: fileFilterImage });
exports.uploadAny = multer({ storage: storage });
