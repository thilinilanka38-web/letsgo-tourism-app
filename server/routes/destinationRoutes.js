const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destinationController');
const verifyAdminToken = require('../middleware/auth');

router.get('/', destinationController.getAllDestinations);
router.get('/:id', destinationController.getDestinationById);
router.post('/', verifyAdminToken, destinationController.createDestination);
router.put('/:id', verifyAdminToken, destinationController.updateDestination);
router.delete('/:id', verifyAdminToken, destinationController.deleteDestination);

module.exports = router;
