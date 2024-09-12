const Donation = require('../models/DonationModel');
const { Client } = require('@elastic/elasticsearch');

const client = new Client({ node: 'http://localhost:9200' });

const searchels = async (req, res) => {
  try {
    const response = await client.info();
    res.status(200).json(response); 
    console.log('Elasticsearch Info:', response);
  } catch (error) {
    console.error('Connection error:', error); 
    process.exit(1);
  }
};

module.exports = { searchels };

const mongoose = require('mongoose');
const Fawn = require('fawn');

Fawn.init("mongodb://127.0.0.1:27017/donations");

const createDonation = async (req, res) => {
  const { sender_id, receiver_id, amount, message } = req.body;

  const donation = new Donation({ sender_id, receiver_id, amount, message });

  const task = new Fawn.Task();

  task
    .save('donations', donation)
    .run()
    .then(() => res.status(201).json(donation))
    .catch(err => res.status(400).json({ message: err.message }));
};

const getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find().populate('sender_id'); 
    res.status(200).json(donations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllDonationsByID = async (req, res) => {
  const { senderId } = req.params; 

  try {
    const donations = await Donation.find({ sender_id: senderId }).populate('sender_id'); // استعلام عن التبرعات بناءً على sender_id
    res.status(200).json(donations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const search = async (req, res) => {
  try {
    await client.ping();
    console.log("Connection to ES Server successful");

    const { body: indices } = await client.cat.indices({ format: 'json' });
    const wazuhIndices = indices
      .filter(index => index.index.startsWith(ALERTS_PREFIX)) 
      .map(index => index.index);

    console.log('Wazuh Indices:', wazuhIndices);

    const { query } = req.body; 

    const { body } = await client.search({
      index: 'donations', 
      body: {
        query: {
          match: { sender_id: query },
        },
      },
    });

    res.status(200).json(body.hits.hits); 
  } catch (error) {
    console.error('Error during search:', error); 
    res.status(500).json({ error: error.message }); 
  }
};

const getDonationById = async (req, res) => {
  try {
    const { query } = req.body; 

    const { body } = await client.search({
      index: 'donations', 
      body: {
        query: {
          match: { sender_id: query }, 
        },
      },
    });

    res.status(200).json(body.hits.hits); 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateDonation = async (req, res) => {
  try {
    const donation = await Donation.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    res.status(200).json(donation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findByIdAndDelete(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createDonation,
  getAllDonations,
  search,
  getDonationById,
  updateDonation,
  deleteDonation,
  getAllDonationsByID,
  searchels
};