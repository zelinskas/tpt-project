const puppeteer = require("puppeteer-extra");
const Cheerio = require("cheerio");
const express = require("express");
var cors = require('cors')
const {executablePath} = require('puppeteer')
const port = 3000;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
  origin: '*'
}));


const minimal_args = [
  '--autoplay-policy=user-gesture-required',
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-breakpad',
  '--disable-client-side-phishing-detection',
  '--disable-component-update',
  '--disable-default-apps',
  '--disable-dev-shm-usage',
  '--disable-domain-reliability',
  '--disable-extensions',
  '--disable-features=AudioServiceOutOfProcess',
  '--disable-hang-monitor',
  '--disable-ipc-flooding-protection',
  '--disable-notifications',
  '--disable-offer-store-unmasked-wallet-cards',
  '--disable-popup-blocking',
  '--disable-print-preview',
  '--disable-prompt-on-repost',
  '--disable-renderer-backgrounding',
  '--disable-setuid-sandbox',
  '--disable-speech-api',
  '--disable-sync',
  '--hide-scrollbars',
  '--ignore-gpu-blacklist',
  '--metrics-recording-only',
  '--mute-audio',
  '--no-default-browser-check',
  '--no-first-run',
  '--no-pings',
  '--no-sandbox',
  '--no-zygote',
  '--password-store=basic',
  '--use-gl=swiftshader',
  '--use-mock-keychain',
];

app.post("/getresultnumber", async (req, res) => {
  let data = req.body.terms
  console.log(data)
  data = data.split(',')
  let results = []
  const browser = await openBrowser();
  const page = await browser.newPage();
  if(!browser || !page) return res.status(500).send('Error opening browser')
  for(let i = 0; i < data.length; i++){
    results.push(await getResultNumber(data[i].trim(), browser))
  }
  if(browser) await closeBrowser(browser)
  res.status(200).send(results);

});

app.get("/getsuggestions", async (req, res) => {
  var q = req.query.q;
  res.status(200).send(await scrapData(q));
});

async function openBrowser() {
  try{
    return await puppeteer.launch({
      userDataDir: "./cache",
      headless: true,
      executablePath: executablePath(),
      args: minimal_args,
      ignoreHTTPSErrors: true,
      dumpio: false,
    });
  }
  catch(e){
    return false
  }
}

async function closeBrowser(browser) {
  await browser.close();
}

async function getResultNumber(q, browser){
  const LINK = `https://www.teacherspayteachers.com/Browse/Search:${q}`;
  try {

    const page = await browser.newPage();
    await page.setRequestInterception(true);

    page.on('request', (req) => {
      if(req.resourceType() === 'image' ||
         req.resourceType() === 'stylesheet' ||
         req.resourceType() === 'font' ||
         req.url().startsWith('https://cdn.siftscience.com/s.js') ||
         req.url().startsWith('https://cdn.heapanalytics.com/js/heap-3064244106.js') ||
         req.url().startsWith('https://www.googletagmanager.com') ||
         req.url().startsWith('https://sessions.bugsnag.com') ||
         req.url().startsWith('https://a11000223989.cdn.optimizely.com') ||
         req.url().startsWith('https://cdn.transcend.io') ||
         req.url().startsWith('https://retail.googleapis.com') ||
         req.url().startsWith('https://www.facebook.com') || 
         req.url().startsWith('https://cdn3.optimizely.com') ||
         req.url().startsWith('https://logx.optimizely.com') ||
         req.url().startsWith('https://www.teacherspayteachers.com/graph/graphql') ||
         req.url().startsWith('https://tapi.optimizely.com') ||
         req.url().startsWith('https://static1.teacherspayteachers.com/tpt-frontend/optimizelyjs') ||
         req.url().startsWith('https://suggest-production.teacherspayteachers.com/suggestions') ||
         req.url().startsWith('https://www.teacherspayteachers.com/gateway/graphql') ||
         req.url().startsWith('https://static1.teacherspayteachers.com/tpt-frontend/releases/production/current/tpt-frontend.Drawer') ||
         req.url().startsWith('https://static1.teacherspayteachers.com/tpt-frontend/releases/production/current/tpt-frontend') ||
         req.url().startsWith('https://static1.teacherspayteachers.com/tpt-frontend/releases/production/current/tpt-frontend') ||
         req.url().startsWith('https://static1.teacherspayteachers.com/tpt-frontend/releases/production/current/tpt-frontend') ||
         req.url().startsWith('https://static1.teacherspayteachers.com/tpt-frontend/releases/production/current/tpt-frontend') ||
         req.url().startsWith('https://static1.teacherspayteachers.com/tpt-frontend/releases/production/current/tpt-frontend') ||
         req.url().startsWith('https://static1.teacherspayteachers.com/tpt-frontend/releases/production/current/tpt-frontend')
        ){
        req.abort();
      }
      else {
        console.log(req.url())
            req.continue();
      }})

    await page.goto(LINK, {waitUntil: 'load', timeout: 0});
    let html = await page.$eval('.ResultsForSearchResultHeader', (element) => {
      return element.innerHTML;
    })

    var $ = Cheerio.load(html);
    var result = $('.Text-module__noMarginBottom--VJdLv').text();
    var resultNumber = result.split(' ')[0];
    console.log(resultNumber)
    return {q, resultNumber};

  } catch (error) {
    console.log(error)
    return { msg: "some error occured" };
  }
}

async function scrapData(q) {
  const LINK = 'https://www.teacherspayteachers.com/';
  try {
    const browser = await puppeteer.launch({
      userDataDir: './cache',
      headless: true,
      executablePath: executablePath(),
      args: minimal_args,
      ignoreHTTPSErrors: true,
      dumpio: false,
    });
    const page = await browser.newPage();
    await page.setRequestInterception(true);

    page.on('request', (req) => {
      if(req.resourceType() === 'image' ||
         req.resourceType() === 'stylesheet' ||
         req.resourceType() === 'font' ||
         req.url().startsWith('https://cdn.siftscience.com/s.js') ||
         req.url().startsWith('https://cdn.heapanalytics.com/js/heap-3064244106.js') ||
         req.url().startsWith('https://www.googletagmanager.com') ||
         req.url().startsWith('https://sessions.bugsnag.com') ||
         req.url().startsWith('https://a11000223989.cdn.optimizely.com') ||
         req.url().startsWith('https://cdn.transcend.io') ||
         req.url().startsWith('https://retail.googleapis.com') ||
         req.url().startsWith('https://www.facebook.com') || 
         req.url().startsWith('https://cdn3.optimizely.com') ||
         req.url().startsWith('https://logx.optimizely.com') ||
         req.url().startsWith('https://www.teacherspayteachers.com/graph/graphql') ||
         req.url().startsWith('https://tapi.optimizely.com') ||
         req.url().startsWith('https://static1.teacherspayteachers.com/tpt-frontend/optimizelyjs')
        ){ 
        req.abort();
      }
      else {
        console.log(req.url())
            req.continue();
        }})

    await page.goto(LINK);
    await page.type('.react-autosuggest__input', q);
    await page.waitForTimeout(500)

    await page.waitForSelector('.react-autosuggest__suggestions-list')
    let html = await page.$eval('.react-autosuggest__suggestions-container--open', (element) => {
      return element.innerHTML
    })

    var $ = Cheerio.load(html);
    let suggestions = [];
    $('.react-autosuggest__section-container').each((el, i)=>{
      let title = $(i).find('.react-autosuggest__section-title').text();
        if(title === 'Suggestions'){
          let list = $(i).find('.react-autosuggest__suggestions-list');
          let li = list.children();
          li.each((i, el) => {
            suggestions.push($(el).text());
          })
        }
    });

    // console.log("data scraped");
    await browser.close();
    return suggestions;
  } catch (error) {
    console.log(error)
    return { msg: "some error occured" };
  }
}

app.get("/", async (req, res) => {
  res.status(200).send("running");
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`server running at ${port}/`);
});
