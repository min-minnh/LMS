const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Require routes
const authRoutes = require('./routes/authRoutes');
const topicRoutes = require('./routes/topicRoutes');
const vocabRoutes = require('./routes/vocabRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const quizRoutes = require('./routes/quizRoutes');
const resultRoutes = require('./routes/resultRoutes');
const userRoutes = require('./routes/userRoutes');
const aiRoutes = require('./routes/aiRoutes');
const { streamFromGridFS } = require('./utils/gridfs');

const app = express();
app.use(express.json());
app.use(cors());

// Serve files from MongoDB GridFS (replaces ephemeral /uploads folder)
// Any URL like /files/:id will stream the file directly from MongoDB
app.get('/files/:id', async (req, res) => {
  await streamFromGridFS(req.params.id, res);
});

// Connect Database
mongoose.connect(process.env.MONGO_URI || "mongodb+srv://caom2k6_db_user:1412kaitokid@cluster0.ylpbpan.mongodb.net/lms")
  .then(async () => {
    console.log("DB connected");
  })
  .catch(err => console.log("DB error:", err));

// Register Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/topics', topicRoutes);
app.use('/vocabulary', vocabRoutes);
app.use('/lessons', lessonRoutes);
app.use('/quizzes', quizRoutes);
app.use('/quizzes-ai', aiRoutes);
app.use('/results', resultRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send({ success: true, message: 'Server is running', data: null });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at https://lms-gzty.onrender.com:${PORT}`);
});