import { getListOfPagesFromXlsx } from "./getListOfPagesFromXlsx.js";
import { writeArrayToXLSX } from "./writeArrayToXLSX.js";
import { splitIntoBatches } from "./splitIntoBatches.js";
import { processBatches } from "./processBatches.js";
import { createOutFolderIfNotExist } from "./createOutFolderIfNotExist.js";

const filePath = "./"+(process.env.INPUT_FILE || "input.xlsx");
const outPutFileName = process.env.OUTPUT_FILE || "output.xlsx";
const outputFilePath =  "./out/"+outPutFileName;

createOutFolderIfNotExist();

getListOfPagesFromXlsx(filePath).then((pageLinks) => {
  console.log(pageLinks);
  const batches = splitIntoBatches(pageLinks, 10);
  processBatches(batches).then((batchStats) => {
    const stats = batchStats.flat();
    writeArrayToXLSX(stats, outputFilePath);
  });
});
