import XLSX from "xlsx";
import readline from "readline";

export async function getListOfPagesFromXlsx(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const selectedSheetIndex = await new Promise((resolve) => {
      console.log("Available sheets:");
      sheetNames.forEach((sheet, index) => {
        console.log(`${index + 1}. ${sheet}`);
      });
      console.log("Enter 'cancel' to cancel the operation.");
      rl.question("Select the sheet number: ", (answer) => {
        resolve(parseInt(answer, 10) - 1);
      });
    });

    if (selectedSheetIndex === -1) {
      rl.close();
      return [];
    }

    const selectedSheet = sheetNames[selectedSheetIndex];
    const worksheet = workbook.Sheets[selectedSheet];
    const cellRange = XLSX.utils.decode_range(worksheet["!ref"]);
    const columnOptions = [];
    for (let col = cellRange.s.c; col <= cellRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      const cellContent = worksheet[cellAddress]?.v;
      if (cellContent && cellRange.s.r !== cellRange.e.r) {
        columnOptions.push(`${col + 1}. ${cellContent}`);
      }
    }

    let selectedColumnNumber;
    while (
      !selectedColumnNumber ||
      selectedColumnNumber < 1 ||
      selectedColumnNumber > columnOptions.length
    ) {
      console.log("Available columns:");
      columnOptions.forEach((column) => {
        console.log(column);
      });
      console.log("Enter 'cancel' to cancel the operation.");

      selectedColumnNumber = await new Promise((resolve) => {
        rl.question("Enter the number of the column: ", (answer) => {
          resolve(parseInt(answer, 10));
        });
      });
    }

    const selectedColumnIndex = selectedColumnNumber - 1;
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      blankrows: false, // Exclude blank rows
    });
    const columnData = jsonData
      .slice(1) // Exclude the header row
      .map((row) => row[selectedColumnIndex])
      .filter(Boolean); // Filter out empty values

    rl.close();
    return columnData;
  } catch (error) {
    console.error("Error reading XLSX file:", error);
    return [];
  }
}
