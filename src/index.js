import { getListOfPagesFromXlsx } from "./getListOfPagesFromXlsx.js";
import {writeArrayToXLSX} from "./writeArrayToXLSX.js"
import { splitIntoBatches } from "./splitIntoBatches.js";
import { processBatches } from "./processBatches.js";




const filePath = "./example.xlsx";

getListOfPagesFromXlsx(filePath).then((pageLinks) => {
  console.log(pageLinks);
  const batches = splitIntoBatches(pageLinks, 10);
  processBatches(batches).then((batchStats) => {
    const stats = batchStats.flat();
    writeArrayToXLSX(stats, "./output.xlsx");
  });
});


