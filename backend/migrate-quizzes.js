const mongoose = require('mongoose');
require('dotenv').config();
const Quiz = require('./models/Quiz');

async function migrate() {
  try {
    const uri = process.env.MONGO_URI || "mongodb+srv://caom2k6_db_user:1412kaitokid@cluster0.ylpbpan.mongodb.net/lms";
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const result = await Quiz.updateMany(
      {}, 
      { $set: { shuffleQuestions: false } }
    );

    console.log(`Updated ${result.modifiedCount} quizzes to shuffleQuestions: false`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();
