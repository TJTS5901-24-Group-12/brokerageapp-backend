import { expect } from 'chai'
import supertest from 'supertest'
import app from '../index.js'

const request = supertest(app);

describe('API Endpoints', () => {
  it('should not add a bid', async () => {
    const response = await request.post('/addBid').send({ amount: 100, price: 50 });
    expect(response.status).to.equal(200);
    expect(response.text).to.include('Bid unsuccessful:');
  });


  it('should not add an offer', async () => {
    const response = await request.post('/addOffer').send({ amount: 150, price: 55 });
    expect(response.status).to.equal(200);
    expect(response.text).to.include('Offer unsuccessful:');
  });

  it('should add a bid', async () => {
    const response = await request.post('/addBid').send({ amount: 1, price: 170 });
    expect(response.status).to.equal(200);
    expect(response.text).to.equal('Bid added successfully');
  });


  it('should add an offer', async () => {
    const response = await request.post('/addOffer').send({ amount: 1, price: 170 });
    expect(response.status).to.equal(200);
    expect(response.text).to.equal('Offer added successfully');
  });
  
  it('should get bids and offers', async () => {
    const response = await request.get('/getBidsAndOffers');
    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('bids').that.is.an('array');
    expect(response.body.bids).to.have.lengthOf(1);
    expect(response.body.bids[0]).to.deep.equal({ amount: 100, price: 50 });
    
    expect(response.body).to.have.property('offers').that.is.an('array');
    expect(response.body.offers).to.have.lengthOf(1);
    expect(response.body.offers[0]).to.deep.equal({ amount: 150, price: 55 });
  }); 
});
