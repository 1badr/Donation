const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const mongoosastic = require('mongoosastic');
const Donation = require('../models/DonationModel'); 
const axios = require('axios'); 
const https = require('https');


async function processDonation() {
  const options = {
    method: 'GET',
    url: 'https://virtual-accounts-api.p.rapidapi.com/api/v1/accountsrvc/virtualaccounts/transactions/account/0dd3a3be-7783-4f87-b347-d9aed69a4334/all',
    headers: {
      'x-rapidapi-key': 'fae673538dmshf3866cf7b5709cbp1f16ebjsn816b5b5850b6',
      'x-rapidapi-host': 'virtual-accounts-api.p.rapidapi.com',
      Accept: 'application/json'
    }
  };

  try {
    const response = await axios.request(options);
    console.log('Response:', response.data); 
  } catch (error) {
    console.error('Error:', error);
  }
}

module.exports = {
    processDonation
}