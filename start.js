// third party libraries
const express = require('express');
const puppeteer = require('puppeteer');

// env vars
const { PASSWORD, PORT, USERNAME } = process.env;

// constants
const BALANCE_SELECTOR = '.CurrentBalance:not(.a11y-context)';

const app = express();

app.get('/', async (req, res) => {
  let browser;

  try {
    browser = await puppeteer.launch();
    const page = await browser.newPage();

    // go to login page
    await page.goto('https://banking.westpac.com.au/wbc/banking/handler');

    // sign in
    await page.evaluate((username) => {
      document.getElementById('username').value = username;
    }, USERNAME);
    await page.evaluate((password) => {
      document.getElementById('password').value = password;
    }, PASSWORD);
    await page.click('#signin');


    // wait for balances screen to load
    await page.waitForSelector(BALANCE_SELECTOR);

    // scrape balances
    const balances = await page.evaluate((balanceSelector) => {
      return Array.from(document.querySelectorAll(balanceSelector)).map((node) => node.innerText.match(/^\$(\d*\.\d{2})/)[1]);
    }, BALANCE_SELECTOR);

    res.json({
      balances
    });

    console.log('fetched balances');
  } catch (error) {
    console.error('error while fetching balances', {
      error
    });
    res.sendStatus(500);
  } finally {
    browser.close();
  }
});

const server = app.listen(parseInt(PORT, 10) || 8080, () => {
  console.log('listening', {
    port: server.address().port
  });
});
