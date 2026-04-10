const fs = require('fs');
const path = require('path');

const files = [
  'dashboard.html',
  'users.html',
  'quizzes.html',
  'vocabulary.html',
  'lessons.html',
  'results.html'
];

files.forEach(filename => {
  const filepath = path.join(__dirname, filename);
  let content = fs.readFileSync(filepath, 'utf8');
  content = content.replace(/Vocabulary Folders/g, 'Vocabulary');
  content = content.replace(/Lessons Folders/g, 'Lessons');
  content = content.replace(/Quizzes Folders/g, 'Quizzes');
  content = content.replace(/Student Results Folders/g, 'Student Results');
  fs.writeFileSync(filepath, content);
  console.log('Processed ' + filename);
});
