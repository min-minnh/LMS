const text = `passage,question,optionA,optionB,optionC,optionD,correct
"If you'd like to improve your English considerably, the first thing you need to do is to build up your vocabulary. In order to do this, you have to read a lot. You can read short stories, newspapers, magazines or anything else that interests you. When you read, you should try to guess the meaning of new words from the context. If you cannot, then look them up in an English-English dictionary. Avoid translating everything into your own language. This will slow you down and prevent you from thinking in English. Listening is also very important. You should listen to English programs on the radio, watch English movies or TV shows, and try to understand what you hear. Speaking is the most important skill. Try to practice speaking as much as possible. Don't be afraid of making mistakes. Remember that practice makes perfect.",What is the main idea of this passage?,What we can do to improve our English,The difficulties in learning English,Problems of learning a second language,The best way of communicating in English,A
"If you'd like to improve your English considerably, the first thing you need to do is to build up your vocabulary. In order to do this, you have to read a lot. You can read short stories, newspapers, magazines or anything else that interests you. When you read, you should try to guess the meaning of new words from the context. If you cannot, then look them up in an English-English dictionary. Avoid translating everything into your own language. This will slow you down and prevent you from thinking in English. Listening is also very important. You should listen to English programs on the radio, watch English movies or TV shows, and try to understand what you hear. Speaking is the most important skill. Try to practice speaking as much as possible. Don't be afraid of making mistakes. Remember that practice makes perfect.",The word "considerably" in the passage is closest in meaning to ________,slightly,significantly,carefully,quickly,B`;

const parseCSV = (text) => {
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      currentField += '"';
      i++; 
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = "";
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++; 
      currentRow.push(currentField.trim());
      if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== "")) {
      rows.push(currentRow);
    }
  }
  return rows;
};

const rows = parseCSV(text);
console.log("Total rows:", rows.length);
rows.forEach((r, i) => console.log(`Row ${i} cols:`, r.length));

let headers = rows[0];
let data = [];
for (let i = 1; i < rows.length; i++) {
  let cols = rows[i];
  let obj = {};
  headers.forEach((h, idx) => {
    obj[h.trim()] = cols[idx] || "";
  });
  data.push(obj);
}

console.log("First data object keys:", Object.keys(data[0]));
console.log("First data 'question':", data[0].question);
console.log("First data 'correct':", data[0].correct);
