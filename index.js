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
  if (process.env.NODE_ENV === 'test') {
    latestStockPrice = 170; // Use the mocked value during testing
  } else {
    try {
      fetchPrice()
        .then((price) => { latestStockPrice = price; })
        .catch((error) => { console.error('Error fetching stock data:', error) })
    } catch (error) {
      console.error('Error fetching stock data:', error);
    }
  }
}

await updateStockPrice()

// API endpoint to add a bid
app.post('/addBid', (req, res) => {
  const { amount, price } = req.body;
  const amountLeft = amount
  const id = bids.length
  try {
    validateTransaction(amount, price, latestStockPrice)
    bids.push({ id, amount, price, amountLeft })
    attemptDeal(bids, offers)
    res.send('Bid added successfully')
  }
  catch (e) {
    res.send('Bid unsuccessful: ' + e)
  }
});

// API endpoint to add an offer
app.post('/addOffer', (req, res) => {
  const { amount, price } = req.body
  const amountLeft = amount
  const id = offers.length
  try {
    validateTransaction(amount, price, latestStockPrice)
    offers.push({ id, amount, price, amountLeft })
    attemptDeal(bids, offers)
    res.send('Offer added successfully')
    
  }
  catch (e) {
    res.send('Offer unsuccessful: ' + e)
  }
});

// API endpoint to get bids and offers
app.get('/getBidsOffersAndDeals', (req, res) => {
  res.json({ bids, offers, deals });
});

// API endpoint to get the latest stock price
app.get('/getLatestStockPrice', (req, res) => {
  res.json(latestStockPrice);
});

// Resets all transactions
app.post('/reset', (req, res) => {
  bids = [];
  offers = [];
  deals = [];

  res.send('Reset successful')
})

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

function fetchPrice() {
  const result = fetch('https://api.marketdata.app/v1/stocks/quotes/AAPL/')
    .then(response => response.json())
    .then((data) => { 
      console.log('Fetched new price for AAPL: ' + Number.parseFloat(data.last))
      return Number.parseFloat(data.last)
    })
    .catch((error) => { throw new Error('Error fetching data:', error) })

  return result
}

function validateTransaction(amount, price, lastPrice) {
  // These are the maximum and minimum amounts of what the user could give as input
  const maxPrice = (lastPrice * 1.1)?.toFixed(2) ?? lastPrice * 1.1
  const minPrice = (lastPrice * 0.9)?.toFixed(2) ?? lastPrice * 0.9
  const inputPrice = price?.toFixed(2) ?? price

  // Validates that amount is given
  if (!amount)
    throw new Error('Invalid amount of stocks')

  if (!Number.isInteger(amount))
    throw new Error('Quantity cannot be a float.')

  // Validate that price cannot go higher or lower than max price
  if (!inputPrice || inputPrice < minPrice || inputPrice > maxPrice)
    throw new Error('Price must be +-10% of the last traded price!')

  return true
}

function attemptDeal(bids, offers) {
  if (bids.length === 0 || offers.length === 0) {
    return
  }

  const sortArrays = (array) => array.sort((a, b) => {
    if (a.price !== b.price) {
      return (array === bids) ? b.price - a.price : a.price - b.price;
    }
    return a.id - b.id;
  });

  bids = sortArrays(bids)
  offers = sortArrays(offers)

  for (let bid of bids) {
    if (bid.amountLeft === 0) continue

    for (let offer of offers) {
      if (offer.price <= bid.price && offer.amountLeft > 0) {
        const dealAmount = Math.min(bid.amountLeft, offer.amountLeft);
        bid.amountLeft -= dealAmount;
        offer.amountLeft -= dealAmount;
        const time = getCurrentDateTime()
        deals.push({ bidId: bid.id, offerId: offer.id, amountSold: dealAmount,
        price: offer.price, timeOfDeal: time })

        if (bid.amountLeft === 0) break
      }
    }
  }

  const sortArraysBack = (array) => array.sort((a,b) => { return a.id - b.id })
  bids = sortArraysBack(bids)
  offers = sortArraysBack(offers)
}

function getCurrentDateTime() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const hours = String(currentDate.getHours()).padStart(2, '0');
  const minutes = String(currentDate.getMinutes()).padStart(2, '0');
  const seconds = String(currentDate.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export default app