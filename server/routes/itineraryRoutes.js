const express = require('express');
const router = express.Router();
const Destination = require('../models/Destination');
const { sequenceNearestNeighbor, buildSchedule } = require('../services/itineraryService');

router.post('/', async (req, res) => {
  try {
    const { destinationIds, startTime } = req.body;

    if (!destinationIds || !Array.isArray(destinationIds) || destinationIds.length < 2) {
      return res.status(400).json({
        error: 'Please select at least 2 destinations to generate a 1-day itinerary.',
      });
    }

    if (destinationIds.length > 6) {
      return res.status(400).json({
        error: 'Maximum 6 destinations allowed per single-day plan (REQ-10).',
      });
    }

    const places = await Destination.find({ _id: { $in: destinationIds } });
    if (places.length !== destinationIds.length) {
      return res.status(404).json({ error: 'One or more selected destinations were not found.' });
    }

    const ordered = sequenceNearestNeighbor(places);
    const itinerary = buildSchedule(ordered, startTime || '08:30 AM');

    res.json(itinerary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate itinerary', details: error.message });
  }
});

module.exports = router;
