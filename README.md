# Westpac Balance Scraper
A simple Express server that uses Puppeteer to scrape all account balances from Westpac AU and serializes them as JSON.

## Usage
`PORT=8080 USERNAME=foo PASSWORD=bar yarn start`

POST to / of the Express server, optionally with a JSON request body of { password, username } if these are are not defined as env vars.
