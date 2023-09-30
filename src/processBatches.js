import fs from "fs";
import { getPageStats } from "./getPageStats.js";

const errorFile = "./out/error.out";

export async function processBatches(batches) {
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