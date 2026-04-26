const mongoose = require('mongoose')

const lessonSchema = new mongoose.Schema({
  title: String,
  content: String,
  imageUrl: String
})

module.exports = mongoose.model('Lesson', lessonSchema)
