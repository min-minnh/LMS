const multer = require('multer');
const path = require('path');

// === Memory Storage ===
// Files are kept in RAM as buffers, then streamed to MongoDB GridFS.
// This avoids writing to Render's ephemeral disk (which gets wiped on restart).
const memStorage = multer.memoryStorage();

// Generic memory-based upload (accepts any file type)
exports.uploadAny = multer({ storage: memStorage });

// CSV / Excel only (still memory-based, caller reads buffer)
const fileFilterCSV = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimes = ['text/csv', 'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  if (allowedMimes.includes(file.mimetype) || ext === '.csv' || ext === '.xlsx') {
    cb(null, true);
  } else {
    cb(new Error('Only .csv and .xlsx formats allowed!'), false);
  }
};
exports.uploadCSV = multer({ storage: memStorage, fileFilter: fileFilterCSV });

// Image only
const fileFilterImage = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images allowed!'), false);
  }
};
exports.uploadImage = multer({ storage: memStorage, fileFilter: fileFilterImage });
