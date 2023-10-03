import ExcelJS from "exceljs";

export async function writeArrayToXLSX(dataArray, filePath) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet1");
  // Set the font and font size for the worksheet
  const defaultCellStyle = {
    font: { name: "Calibri", size: 11 },
    alignment: { vertical: "middle", horizontal: "center" },
  };
  // Get the column keys from the first row of dataArray
  const columnKeys = Object.keys(dataArray[0]);

  // Apply the cell style to each cell in the worksheet
  worksheet.columns = columnKeys.map((key) => ({
    key,
    header: key,
    width: 15,
    style: defaultCellStyle,
    numFmt: key === "ViewRatio" ? "0.00%" : undefined, // Set percent format for "ViewRatio" column
  }));

  // Add the data rows to the worksheet
  worksheet.addRows(dataArray);

  // Format the cells in the "ViewRatio" column as percentages
  const viewRatioColumn = worksheet.getColumn("ViewRatio");
  viewRatioColumn.eachCell({ includeEmpty: true }, (cell) => {
    if (cell.value && typeof cell.value === "number") {
      cell.value = cell.value / 100; // Convert the value to a decimal
      cell.numFmt = "0.00%"; // Set the percentage format
    }
  });

  await workbook.xlsx.writeFile(filePath);
}