import { expect } from 'chai'
import supertest from 'supertest'
import app from '../index.js'
import nock from 'nock'

const request = supertest(app);

// Universal address to mock the api calls
const scope = nock(/.*/)

describe('API Endpoints', function() {
  beforeEach(() => {
    nock('https://api.marketdata.app')
      .get('/v1/stocks/quotes/AAPL/')
      .reply(200, { last: 170 }); // Set the desired latestStockPrice
  });

  it('should not add a bid', async () => {
    // Arrange

    // Act
    const response = await request.post('/addBid').send({ amount: 100, price: 50 });
    
    // Assert
    expect(response.status).to.equal(200);
    expect(response.text).to.include('Bid unsuccessful:');
  });


  it('should not add an offer', async () => {
    // Arrange

    // Act
    const response = await request.post('/addOffer').send({ amount: 150, price: 55 });

    // Assert
    expect(response.status).to.equal(200);
    expect(response.text).to.include('Offer unsuccessful:');
  });

  it('should add a bid', async () => {
    // Arrange

    // Act
    const response = await request.post('/addBid').send({ amount: 1, price: 170 });

    // Assert
    expect(response.status).to.equal(200);
    expect(response.text).to.equal('Bid added successfully');
  });


  it('should add an offer', async () => {
    // Arrange

    // Act
    const response = await request.post('/addOffer').send({ amount: 1, price: 170 });
    
    // Assert
    expect(response.status).to.equal(200);
    expect(response.text).to.equal('Offer added successfully');
  });
  
  it('should get bids and offers', async () => {
    // Arrange
    const mockResponse = {
      "bids": [{ amount: 100, price: 160 }],
      "offers": [{ amount: 150, price: 180 }]
    }
  
    scope.get('/getBidsAndOffers').reply(200, mockResponse);

    // Act
    const response = await request.get('/getBidsAndOffers');

    // Assert
    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('bids').that.is.an('array');
    expect(response.body.bids).to.have.lengthOf(1);
    expect(response.body.bids[0]).to.deep.equal({ amount: 100, price: 160 });
    
    expect(response.body).to.have.property('offers').that.is.an('array');
    expect(response.body.offers).to.have.lengthOf(1);
    expect(response.body.offers[0]).to.deep.equal({ amount: 150, price: 180 });
  }); 
});