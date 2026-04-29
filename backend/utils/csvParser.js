const ExcelJS = require('exceljs');
const { Readable } = require('stream');

// Parse from disk file path (legacy, kept for reference)
exports.parseXLSX = async (filePath) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const ext = filePath.split('.').pop().toLowerCase();

    let worksheet;
    if (ext === 'csv') {
      worksheet = await workbook.csv.readFile(filePath);
    } else {
      await workbook.xlsx.readFile(filePath);
      worksheet = workbook.worksheets[0];
    }

    return _extractRows(worksheet);
  } catch (error) {
    throw new Error('Failed to parse file: ' + error.message);
  }
};

// Parse from Buffer (memory storage - no disk write needed)
exports.parseXLSXBuffer = async (buffer, originalname) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const ext = (originalname || '').split('.').pop().toLowerCase();

    let worksheet;
    const stream = Readable.from(buffer);

    if (ext === 'csv') {
      worksheet = await workbook.csv.read(stream);
    } else {
      await workbook.xlsx.read(stream);
      worksheet = workbook.worksheets[0];
    }

    return _extractRows(worksheet);
  } catch (error) {
    throw new Error('Failed to parse buffer: ' + error.message);
  }
};

function _extractRows(worksheet) {
  const data = [];
  let headers = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      headers = row.values; // 1-indexed
    } else {
      let obj = {};
      headers.forEach((h, index) => {
        if (h && index > 0) {
          let headerName = h.toString().trim().toLowerCase();
          obj[headerName] = row.values[index];
        }
      });
      data.push(obj);
    }
  });

  return data;
}
