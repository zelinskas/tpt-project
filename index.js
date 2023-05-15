const bodyParser = require("body-parser");
var cors = require("cors");

const express = require("express");
const { chromium } = require("playwright");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(bodyParser.json());
app.use(cors());


app.get("/", (req, res) => {
  res.send("Running!");
});
// POST request handler
app.post("/numbers", async (req, res) => {
  const url = "https://www.teacherspayteachers.com/";
  let labels = req.body;

  try {
    res.send(await run(labels));
  } catch (e) {
    res.status(500).send(e);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

async function run(labels) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const scrapingPromises = labels.map(async (label) => {
    const page = await context.newPage();
    await page.route("**/*", (route) => {
      const pageLink = route.request().url();
      const resourceType = route.request().resourceType();

      if (
        resourceType === "image" ||
        resourceType === "stylesheet" ||
        resourceType === "font" ||
        pageLink.includes("https://cdn.siftscience.com/s.js") ||
        pageLink.includes(
          "https://cdn.heapanalytics.com/js/heap-3064244106.js"
        ) ||
        pageLink.includes("https://www.googletagmanager.com") ||
        pageLink.includes("https://sessions.bugsnag.com") ||
        pageLink.includes("https://a11000223989.cdn.optimizely.com") ||
        pageLink.includes("https://cdn.transcend.io") ||
        pageLink.includes("https://retail.googleapis.com") ||
        pageLink.includes("https://www.facebook.com") ||
        pageLink.includes("https://cdn3.optimizely.com") ||
        pageLink.includes("https://logx.optimizely.com") ||
        pageLink.includes(
          "https://www.teacherspayteachers.com/graph/graphql"
        ) ||
        pageLink.includes("https://tapi.optimizely.com") ||
        pageLink.includes(
          "https://static1.teacherspayteachers.com/tpt-frontend/optimizelyjs"
        ) ||
        pageLink.includes(
          "https://suggest-production.teacherspayteachers.com/suggestions"
        ) ||
        pageLink.includes(
          "https://www.teacherspayteachers.com/gateway/graphql"
        ) ||
        pageLink.includes(
          "https://static1.teacherspayteachers.com/tpt-frontend/releases/production/current/tpt-frontend.Drawer"
        ) ||
        pageLink.includes(
          "https://static1.teacherspayteachers.com/tpt-frontend/releases/production/current/tpt-frontend"
        ) ||
        pageLink.includes("https://cdn.attn.tv/") ||
        pageLink.includes("https://events.attentivemobile.com") ||
        pageLink.includes("https://www.teacherspayteachers.com/cdn-cgi/")
      ) {
        route.abort();
      } else {
        route.continue();
      }
    });

    try {
      console.log(`Opening ${label} page`)
      await page.goto(
        "https://www.teacherspayteachers.com/Browse/Search:" + label,
        { waitUntil: "domcontentloaded" }
      );
      await page.waitForSelector(
        ".ResultsForSearchResultHeader .Text-module__root--Jk_wf"
      );
      console.log(`Scraping ${label} page`)
      const html = await page.$eval(
        ".ResultsForSearchResultHeader div",
        (element) => {
          return element.textContent;
        }
      );
      const resultNumber = html.split(" ")[0];
      console.log(`Scraped ${label} page`)
      return { label, resultNumber };
    } catch (error) {
      return { label, resultNumber: "N/A" };
    } finally {
      await page.close();
    }
  });

  const results = await Promise.all(scrapingPromises);

  await browser.close();
  return results;
}
