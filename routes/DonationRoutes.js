const express = require('express');
const router = express.Router();
const donationController = require('../controllers/DonationController'); 

router.post('/', donationController.createDonation);
router.get('/searchels', donationController.searchels);
router.post('/search', donationController.search);
router.get('/', donationController.getAllDonations);
router.put('/:id', donationController.updateDonation);
router.get('/getAllDonationsByID/:id', donationController.getAllDonationsByID);
router.delete('/:id', donationController.deleteDonation);

module.exports = router;