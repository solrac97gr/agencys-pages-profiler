import XLSX from "xlsx";

export function writeArrayToXLSX(dataArray, filePath) {
  const worksheet = XLSX.utils.json_to_sheet(dataArray);
  // Set the font and font size for the worksheet
  const defaultCellStyle = {
    font: { name: "Calibri", sz: 11 },
    alignment: { vertical: "center", horizontal: "center" },
  };
  // Apply the cell style to each cell in the worksheet
  for (const cellAddress in worksheet) {
    if (cellAddress[0] === "!") continue;
    const cell = worksheet[cellAddress];
    cell.s = defaultCellStyle;
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, filePath);
}
