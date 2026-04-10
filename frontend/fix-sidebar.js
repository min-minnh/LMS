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

const cssTarget = `
    .sidebar { width: 260px; background: #ffffff; border-right: 1px solid #e2e8f0; padding: 30px 20px; display: flex; flex-direction: column; flex-shrink: 0; }
    .sidebar .logo { font-weight: 700; font-size: 24px; margin-bottom: 40px; color: #1e293b; display: flex; align-items: center; gap: 10px; }
    .sidebar .logo span { width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 8px; color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .sidebar a { display: flex; align-items: center; gap: 12px; margin: 8px 0; padding: 12px 16px; color: #64748b; text-decoration: none; cursor: pointer; border-radius: 12px; transition: all 0.2s ease; font-size: 15px; font-weight: 500; }
    .sidebar a:hover { background: #f1f5f9; color: #1e293b; }
    .sidebar a.active { background: #fee2e2; color: #ef4444; }
`;

function buildSidebarHtml(activePage) {
  return `<div class="sidebar">
  <div class="logo"><span>A</span> Admin Panel</div>
  <a href="dashboard.html" \${activePage === 'dashboard' ? 'class="active"' : ''}>🏠 Dashboard</a>
  <a href="vocabulary.html" \${activePage === 'vocabulary' ? 'class="active"' : ''}>📚 Vocabulary Folders</a>
  <a href="lessons.html" \${activePage === 'lessons' ? 'class="active"' : ''}>📖 Lessons Folders</a>
  <a href="users.html" \${activePage === 'users' ? 'class="active"' : ''}>👥 Users List</a>
  <a href="quizzes.html" \${activePage === 'quizzes' ? 'class="active"' : ''}>📝 Quizzes Folders</a>
  <a href="results.html" \${activePage === 'results' ? 'class="active"' : ''}>📊 Student Results</a>
  <div style="flex-grow: 1;"></div>
  <a href="index.html" onclick="localStorage.clear()" style="color: #ef4444;">🚪 Logout</a>
</div>`;
}

function processFile(filename) {
  const filepath = path.join(__dirname, filename);
  let content = fs.readFileSync(filepath, 'utf8');

  // 1. Regex to replace .sidebar CSS block
  // We look for .sidebar { ... } up to the end of .sidebar a.active { ... } or similar.
  // Instead of complex regex, let's just strip out any line that starts with .sidebar
  const lines = content.split('\\n');
  const filteredLines = lines.filter(line => !line.trim().startsWith('.sidebar'));
  
  // Find where to inject the new CSS. Let's put it right after body { ... }
  let bodyCssIndex = filteredLines.findIndex(l => l.includes('body {'));
  if (bodyCssIndex !== -1) {
    filteredLines.splice(bodyCssIndex + 1, 0, cssTarget.trim());
  }
  
  content = filteredLines.join('\\n');

  // 2. Replace the HTML sidebar block
  const pageName = filename.replace('.html', '');
  const sidebarHtml = buildSidebarHtml(pageName).replace(/\\$\\{/g, '').replace(/\\}/g, ''); // just evaluate the manual string replace below
  
  // Actually, let's evaluate template literal manually:
  const finalSidebar = `<div class="sidebar">
  <div class="logo"><span>A</span> Admin Panel</div>
  <a href="dashboard.html" ${pageName === 'dashboard' ? 'class="active"' : ''}>🏠 Dashboard</a>
  <a href="vocabulary.html" ${pageName === 'vocabulary' ? 'class="active"' : ''}>📚 Vocabulary Folders</a>
  <a href="lessons.html" ${pageName === 'lessons' ? 'class="active"' : ''}>📖 Lessons Folders</a>
  <a href="users.html" ${pageName === 'users' ? 'class="active"' : ''}>👥 Users List</a>
  <a href="quizzes.html" ${pageName === 'quizzes' ? 'class="active"' : ''}>📝 Quizzes Folders</a>
  <a href="results.html" ${pageName === 'results' ? 'class="active"' : ''}>📊 Student Results</a>
  <div style="flex-grow: 1;"></div>
  <a href="index.html" onclick="localStorage.clear()" style="color: #ef4444;">🚪 Logout</a>
</div>`;

  content = content.replace(/<div class="sidebar">[\s\S]*?<\/div>\s*<\/div>/, finalSidebar); 
  // Wait, the regex `[\s\S]*?<\/div>` might match the first </div> which closes .logo!
  // It's safer to use an exact string replacement for the known sidebar blocks or a better regex.
  // We can search for `<div class="sidebar">` and then count opening and closing divs.
  
  let startIndex = content.indexOf('<div class="sidebar">');
  if (startIndex === -1) return;
  
  let openDivs = 0;
  let endIndex = -1;
  for (let i = startIndex; i < content.length; i++) {
    if (content.substr(i, 4) === '<div') openDivs++;
    if (content.substr(i, 5) === '</div') {
      openDivs--;
      if (openDivs === 0) {
        endIndex = i + 6; // include </div>
        break;
      }
    }
  }

  if (endIndex !== -1) {
    content = content.substring(0, startIndex) + finalSidebar + content.substring(endIndex);
  }

  fs.writeFileSync(filepath, content);
  console.log('Updated ' + filename);
}

files.forEach(processFile);
