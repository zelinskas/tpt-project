const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");
const Cheerio = require("cheerio");
var cors = require('cors')

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

// POST request handler
app.post("/numbers", async (req, res) => {
  const url = "https://www.teacherspayteachers.com/";
  const outputPath = "example_screenshot.png";
  const results = [];
  let labels = req.body;
  const browser = await puppeteer.launch({
    headless: true,
    args: minimal_args,
    ignoreHTTPSErrors: true,
    dumpio: false,
  });
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (
      req.resourceType() === "image" ||
      req.resourceType() === "stylesheet" ||
      req.resourceType() === "font" ||
      req.url().startsWith("https://cdn.siftscience.com/s.js") ||
      req
        .url()
        .startsWith("https://cdn.heapanalytics.com/js/heap-3064244106.js") ||
      req.url().startsWith("https://www.googletagmanager.com") ||
      req.url().startsWith("https://sessions.bugsnag.com") ||
      req.url().startsWith("https://a11000223989.cdn.optimizely.com") ||
      req.url().startsWith("https://cdn.transcend.io") ||
      req.url().startsWith("https://retail.googleapis.com") ||
      req.url().startsWith("https://www.facebook.com") ||
      req.url().startsWith("https://cdn3.optimizely.com") ||
      req.url().startsWith("https://logx.optimizely.com") ||
      req
        .url()
        .startsWith("https://www.teacherspayteachers.com/graph/graphql") ||
      req.url().startsWith("https://tapi.optimizely.com") ||
      req
        .url()
        .startsWith(
          "https://static1.teacherspayteachers.com/tpt-frontend/optimizelyjs"
        ) ||
      req
        .url()
        .startsWith(
          "https://suggest-production.teacherspayteachers.com/suggestions"
        ) ||
      req
        .url()
        .startsWith("https://www.teacherspayteachers.com/gateway/graphql") ||
      req
        .url()
        .startsWith(
          "https://static1.teacherspayteachers.com/tpt-frontend/releases/production/current/tpt-frontend.Drawer"
        ) ||
      req
        .url()
        .startsWith(
          "https://static1.teacherspayteachers.com/tpt-frontend/releases/production/current/tpt-frontend"
        ) ||
      req.url().startsWith("https://cdn.attn.tv/") ||
      req.url().startsWith("https://events.attentivemobile.com") ||
      req.url().startsWith("https://www.teacherspayteachers.com/cdn-cgi/")
    ) {
      req.abort();
    } else {
      console.log(req.url());
      req.continue();
    }
  });
  console.log(labels)
  labels = labels.map((element) => encodeURIComponent(element));
  for(let i = 0; i < labels.length; i++) {
    results.push(await scrapeData(labels[i], page))
    if(results.length === labels.length) {
      res.send(results);
      await browser.close();
    }
  }
});

async function scrapeData(label, page) {
  const data = [];
  const LINK = "https://www.teacherspayteachers.com/Browse/Search:";
  console.log(`Scraping ${label}`)
  
  await page.goto(LINK + label, { waitUntil: "networkidle2" });
  let html = await page.$eval('.ResultsForSearchResultHeader', (element) => {
    return element.innerHTML;
  })

  var $ = Cheerio.load(html);
  var result = $('.Text-module__noMarginBottom--VJdLv').text();
  var resultNumber = result.split(' ')[0];
  console.log(`Scraped ${label}`);
  return { label: decodeURIComponent(label) , resultNumber};
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
