const Destination = require('../models/Destination');
const { haversineDistance, MADAKUMBURA_CENTER } = require('../services/itineraryService');

exports.getAllDestinations = async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.categoryId = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const destinations = await Destination.find(filter).sort({ name: 1 });
    res.json(destinations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve destinations', details: error.message });
  }
};

exports.getDestinationById = async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination) return res.status(404).json({ error: 'Destination not found' });
    res.json(destination);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching destination', details: error.message });
  }
};

exports.createDestination = async (req, res) => {
  try {
    const {
      name,
      categoryId,
      latitude,
      longitude,
      operatingHours,
      description,
      imageUrl,
      recommendedStayMinutes,
      address,
      contactNumber,
    } = req.body;

    const distanceKm = haversineDistance(
      MADAKUMBURA_CENTER.latitude,
      MADAKUMBURA_CENTER.longitude,
      Number(latitude),
      Number(longitude)
    );

    if (distanceKm > 25.0) {
      return res.status(400).json({
        error: `Coordinates are ${distanceKm} km away, exceeding the 25 km operational radius of Madakumbura!`,
      });
    }

    const newDest = new Destination({
      name,
      categoryId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      location: {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      },
      operatingHours,
      description,
      imageUrl,
      recommendedStayMinutes: Number(recommendedStayMinutes) || 60,
      distanceFromMadakumburaKm: distanceKm,
      address,
      contactNumber,
    });

    const saved = await newDest.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: 'Schema validation error', details: error.message });
  }
};

exports.updateDestination = async (req, res) => {
  try {
    const updated = await Destination.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: 'Destination not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update destination', details: error.message });
  }
};

exports.deleteDestination = async (req, res) => {
  try {
    const deleted = await Destination.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Destination not found' });
    res.json({ message: 'Destination deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete destination', details: error.message });
  }
};
