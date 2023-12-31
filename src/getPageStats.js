import puppeteer from "puppeteer";
import { AddHTTPSIfNotPresent } from "./processBatches";

export async function getPageStats(pageLink) {
  const timeoutOptions = { timeout: 5000 };
  const followerSelector = ".group_friends_count";
  const postsSelector =
    "div.post > div > div.post_content > div > div.like_wrap > div > div.like_views.like_views--inActionPanel > span._views";
  const pageNameSelector = "h1";
  const groupMemberSelector = `span.header_count.fl_l`;

  const browser = await puppeteer.launch({ headless: "new" });
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

    //Delete the first post for avoid the PIN post or a post with 0 views
    postElements.shift();

    // Calculate the average views
    let totalViews = 0;
    postElements.forEach((view) => {
      totalViews += interpretNumberString(view);
    });

    const averageViews = totalViews / postElements.length;
    const followers = parseInt(followerValue.replace(/,/g, ""), 10);
    const views = Math.floor(parseInt(averageViews, 10) / 1000) * 1000;

    const VKStats = {
      Page: pageNameValue,
      URL: AddHTTPSIfNotPresent(pageLink),
      Followers: followers,
      Views: views,
      Platform: "Vkontakte",
      Format: "Пост",
      ViewRatio: (views / followers) * 100,
    };

    await browser.close();
    return VKStats;
  } catch (e) {
    await browser.close();
    throw e;
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
