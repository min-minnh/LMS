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

const app = express();
app.use(express.json());
app.use(cors());

// Serve uploads dir for static images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use('/results', resultRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send({ success: true, message: 'Server is running', data: null });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});