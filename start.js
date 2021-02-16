// third party libraries
const bodyParser = require('body-parser');
const express = require('express');
const puppeteer = require('puppeteer');

// env vars
const { PASSWORD, PORT, USERNAME } = process.env;

// constants
const ACCOUNT_SELECTOR = '.widget.accounts-dashboardaccountwidget';
const BALANCE_SELECTOR = '.CurrentBalance:not(.a11y-context)';
const NAME_SELECTOR = 'h2';

const app = express();
const needCredsInRequest = !(USERNAME && PASSWORD);

app.use(bodyParser.json());

app.post('/', async (req, res) => {
  const { password, username } = req.body;
  const hasCreds = !!(username && password);
  console.log('request', {
    hasCreds,
    needCredsInRequest
  });

  if (needCredsInRequest && !hasCreds) {
    res.sendStatus(400);
    return;
  }

  let browser;

  try {
    browser = await puppeteer.launch();
    const page = await browser.newPage();

    // go to login page
    await page.goto('https://banking.westpac.com.au/wbc/banking/handler');

    // sign in
    await page.evaluate((username) => {
      document.getElementById('username').value = username;
    }, hasCreds ? username : USERNAME);
    await page.evaluate((password) => {
      document.getElementById('password').value = password;
    }, hasCreds ? password : PASSWORD);
    await page.click('#signin');


    // wait for accounts screen to load
    await page.waitForSelector(BALANCE_SELECTOR);

    // scrape accounts
    const accounts = await page.evaluate((accountSelector, balanceSelector, nameSelector) => {
      return Array.from(document.querySelectorAll(accountSelector)).map((node) => ({
        name: node.querySelector(nameSelector).innerText,
        balance: node.querySelector(balanceSelector).innerText.match(/^\$(\d*\.\d{2})/)[1]
      }));
    }, ACCOUNT_SELECTOR, BALANCE_SELECTOR, NAME_SELECTOR);

    res.json({
      accounts
    });

    console.log('fetched accounts');
  } catch (error) {
    console.error('error while fetching accounts', {
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
