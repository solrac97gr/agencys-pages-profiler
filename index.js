import puppeteer from "puppeteer";
import XLSX from "xlsx";
import readline from "readline";
import fs from "fs";

async function getListOfPagesFromXlsx(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    let selectedSheetIndex = -1;
    while (selectedSheetIndex < 0 || selectedSheetIndex >= sheetNames.length) {
      console.log("Available sheets:");
      sheetNames.forEach((sheet, index) => {
        console.log(`${index + 1}. ${sheet}`);
      });
      console.log("Enter 'cancel' to cancel the operation.");
      const selectedSheetNumber = await new Promise((resolve) => {
        rl.question("Select the sheet number: ", (answer) => {
          resolve(answer);
        });
      });
      if (selectedSheetNumber === "cancel") {
        rl.close();
        return [];
      }
      selectedSheetIndex = parseInt(selectedSheetNumber, 10) - 1;
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
      const selectedColumn = await new Promise((resolve) => {
        rl.question("Enter the number of the column: ", (answer) => {
          resolve(answer);
        });
      });
      if (selectedColumn === "cancel") {
        rl.close();
        return [];
      }
      selectedColumnNumber = parseInt(selectedColumn, 10);
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

async function getPageStats(pageLink) {
  const timeoutOptions = { timeout: 5000 };
  const followerSelector = ".group_friends_count";
  const postsSelector =
    "div.post > div > div.post_content > div > div.like_wrap > div > div.like_views.like_views--inActionPanel > span._views";
  const pageNameSelector = "h1";
  const groupMemberSelector = `span.header_count.fl_l`;

  const browser = await puppeteer.launch({ headless: false });
  try {
    const page = await browser.newPage();
    await page.goto(pageLink);
    const pageNameElement = await page.waitForSelector(
      pageNameSelector,
      timeoutOptions
    );

    const pageNameValue = await page.evaluate(
      (element) => element.textContent,
      pageNameElement
    );

    let followerElement;
    try {
      followerElement = await page.waitForSelector(
        followerSelector,
        timeoutOptions
      );
    } catch (error) {
      try {
        followerElement = await page.waitForSelector(
          groupMemberSelector,
          timeoutOptions
        );
      } catch (error) {
        console.error(pageLink, error);
        return null;
      }
    }
    const followerValue = await page.evaluate(
      (element) => element.textContent,
      followerElement
    );
    // Wait for the elements to load
    await page.waitForSelector(postsSelector, timeoutOptions);
    const postElements = await page.evaluate((selector) => {
      let elements = Array.from(document.querySelectorAll(selector));
      return elements.map((element) => element.textContent);
    }, postsSelector);
    // Calculate the average views
    let totalViews = 0;
    postElements.forEach((view) => {
      totalViews += interpretNumberString(view);
    });
    const averageViews = totalViews / postElements.length;
    const VKStats = {
      Page: pageNameValue,
      URL: pageLink,
      Followers: parseInt(followerValue.replace(/,/g, ""), 10),
      Views: averageViews,
      Platform: "вк",
    };
    await browser.close();
    return VKStats;
  } catch (e) {
    await browser.close();
    throw e;
    return null;
  }
}

function interpretNumberString(numberString) {
  const suffixes = {
    K: 1000,
    M: 1000000,
  };
  const suffix = numberString.slice(-1).toUpperCase();
  const number = parseFloat(numberString);
  if (suffixes.hasOwnProperty(suffix)) {
    return number * suffixes[suffix];
  }
  return number;
}

function writeArrayToXLSX(dataArray, filePath) {
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

function splitIntoBatches(array, batchSize) {
  const batches = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

async function processBatches(batches) {
  const results = [];
  for (const batch of batches) {
    const batchStats = [];
    await Promise.all(
      batch.map(async (pageLink) => {
        if (IsVKURL(pageLink)) {
          try {
            console.log(`Getting VK info of: ${pageLink}`);
            const VKStats = await getPageStats(AddHTTPSIfNotPresent(pageLink));
            batchStats.push(VKStats);
          } catch (error) {
            console.error(pageLink + ": ", error);
            fs.appendFileSync(errorFile, `${pageLink}: ${error}\n`);
            batchStats.push({
              URL: pageLink,
              Followers: 0,
              Views: 0,
              Platform: "вк",
            });
          }
        } else {
          console.log(`Skipping non-VK URL: ${pageLink}`);
          batchStats.push({
            URL: pageLink,
            Followers: 0,
            Views: 0,
            Platform: "тг",
          });
        }
      })
    );
    results.push(batchStats);
  }
  return results;
}

// Example usage:
const filePath = "./example.xlsx";
const errorFile = "./error.out";
getListOfPagesFromXlsx(filePath).then((pageLinks) => {
  console.log(pageLinks);
  const batches = splitIntoBatches(pageLinks, 10);
  processBatches(batches).then((batchStats) => {
    const stats = batchStats.flat();
    writeArrayToXLSX(stats, "./output.xlsx");
  });
});

function IsVKURL(URL) {
  // Check if the URL contains "vk.com" or "m.vk.com"
  if (URL.includes("vk.com") || URL.includes("m.vk.com")) {
    return true;
  }
  return false;
}

function AddHTTPSIfNotPresent(URL) {
  // Check if the URL starts with "http://" or "https://"
  if (URL.startsWith("http://") || URL.startsWith("https://")) {
    return URL;
  }
  // Add "https://" to the URL if it's not already present
  return "https://" + URL;
}
