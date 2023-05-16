const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");
const pLimit = require("p-limit");

const Cheerio = require("cheerio");
var cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

const minimal_args = [
  "--autoplay-policy=user-gesture-required",
  "--disable-background-networking",
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-breakpad",
  "--disable-client-side-phishing-detection",
  "--disable-component-update",
  "--disable-default-apps",
  "--disable-dev-shm-usage",
  "--disable-domain-reliability",
  "--disable-extensions",
  "--disable-features=AudioServiceOutOfProcess",
  "--disable-hang-monitor",
  "--disable-ipc-flooding-protection",
  "--disable-notifications",
  "--disable-offer-store-unmasked-wallet-cards",
  "--disable-popup-blocking",
  "--disable-print-preview",
  "--disable-prompt-on-repost",
  "--disable-renderer-backgrounding",
  "--disable-setuid-sandbox",
  "--disable-speech-api",
  "--disable-sync",
  "--hide-scrollbars",
  "--ignore-gpu-blacklist",
  "--metrics-recording-only",
  "--mute-audio",
  "--no-default-browser-check",
  "--no-first-run",
  "--no-pings",
  "--no-sandbox",
  "--no-zygote",
  "--password-store=basic",
  "--use-gl=swiftshader",
  "--use-mock-keychain",
];

// Initialize the browser instance outside the handler
const browserPromise = puppeteer.launch({
  headless: true,
  args: minimal_args,
  ignoreHTTPSErrors: true,
  dumpio: false,
});

// POST request handler
app.post("/numbers", async (req, res) => {
  const url = "https://www.teacherspayteachers.com/";
  const outputPath = "example_screenshot.png";
  const labels = req.body;
  const browser = await browserPromise;
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    // ... (request interception logic)
  });
  console.log(labels);
  const limit = pLimit(5); // Limiting to 5 concurrent requests, you can adjust this value

  const scrapePromises = labels.map((label) =>
    limit(() => scrapeData(label, page))
  );
  const results = await Promise.all(scrapePromises);
  res.send(results);

  await page.close(); // Close the page after all requests are complete
});

async function scrapeData(label, page) {
  const LINK = "https://www.teacherspayteachers.com/Browse/Search:";
  console.log(`Scraping ${label}`);

  await page.goto(LINK + encodeURIComponent(label), {
    waitUntil: "networkidle2",
  });
  const html = await page.$eval(".ResultsForSearchResultHeader", (element) => {
    return element.innerHTML;
  });

  const $ = cheerio.load(html);
  const result = $(".Text-module__noMarginBottom--VJdLv").text();
  const resultNumber = result.split(" ")[0];
  console.log(`Scraped ${label}`);
  return { label: decodeURIComponent(label), resultNumber };
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
