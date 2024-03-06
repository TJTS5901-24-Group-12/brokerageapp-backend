import express from 'express'
import bodyParser from 'body-parser'
import fetch from 'node-fetch'
import cors from 'cors'

const app = express();
app.use(cors())
const port = 3000;

app.use(bodyParser.json());

// State arrays for bids and offers
let bids = [];
let offers = [];
let deals = [];

let latestStockPrice = 0;

setInterval(updateStockPrice, 1000 * 60 * 60);

async function updateStockPrice() {
  fetchPrice()
    .then((price) => { latestStockPrice = price; })
    .catch((error) => { console.error('Error fetching stock data:', error) })
}

await updateStockPrice()

// API endpoint to add a bid
app.post('/addBid', (req, res) => {
  const { amount, price } = req.body;
  try {
    validateTransaction(amount, price, latestStockPrice)
    bids.push({ amount, price });
    res.send('Bid added successfully');
  }
  catch (e) {
    res.send('Bid unsuccessful: ' + e)
  }
});

// API endpoint to add an offer
app.post('/addOffer', (req, res) => {
  const { amount, price } = req.body;
  try {
    validateTransaction(amount, price, latestStockPrice)
    offers.push({ amount, price });
    res.send('Offer added successfully');
  }
  catch (e) {
    res.send('Offer unsuccessful: ' + e)
  }
});

// API endpoint to get bids and offers
app.get('/getBidsAndOffers', (req, res) => {
  res.json({ bids, offers });
});

// API endpoint to get the latest stock price
app.get('/getLatestStockPrice', (req, res) => {
  res.json(latestStockPrice);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

function fetchPrice() {
  const result = fetch('https://api.marketdata.app/v1/stocks/quotes/AAPL/')
    .then(response => response.json())
    .then((data) => { return Number.parseFloat(data.last) })
    .catch((error) => { throw new Error('Error fetching data:', error) })

  return result
}

function validateTransaction(amount, price, lastPrice) {
  console.log(price)
  console.log(lastPrice)
  // These are the maximum and minimum amounts of what the user could give as input
  const maxPrice = lastPrice * 1.1
  const minPrice = lastPrice * 0.9

  // Validates that amount is given
  if (!amount)
    throw new Error('Invalid amount of stocks')

  if (!Number.isInteger(amount))
    throw new Error('Quantity cannot be a float.')

  // Validate that price cannot go higher or lower than max price
  if (!price || price < minPrice || price > maxPrice)
    throw new Error('Price must be +-10% of the last traded price!')

  return true
}

export default app