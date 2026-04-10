const ExcelJS = require('exceljs');

exports.parseXLSX = async (filePath) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const ext = filePath.split('.').pop().toLowerCase();

    let worksheet;
    if (ext === 'csv') {
      worksheet = await workbook.csv.readFile(filePath);
    } else {
      await workbook.xlsx.readFile(filePath);
      worksheet = workbook.worksheets[0]; // first sheet
    }

    const data = [];
    let headers = [];

    worksheet.eachRow((row, rowNumber) => {
      // exceljs row.values is 1-indexed, so row.values[1] is the first column
      if (rowNumber === 1) {
        headers = row.values;
      } else {
        let obj = {};
        headers.forEach((h, index) => {
          if (h && index > 0) { // ignoring the empty 0th index
            let headerName = h.toString().trim();
            obj[headerName] = row.values[index];
          }
        });
        data.push(obj);
      }
    });

    return data;
  } catch (error) {
    throw new Error('Failed to parse file: ' + error.message);
  }
};
