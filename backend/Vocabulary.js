const mongoose = require('mongoose')

const vocabSchema = new mongoose.Schema({
  word: String,
  meaning: String
})

module.exports = mongoose.model('Vocabulary', vocabSchema)