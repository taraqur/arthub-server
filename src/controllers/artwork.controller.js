import { getDb } from '../config/db.js';
import { ObjectId } from 'mongodb';

export const createArtwork = async (req, res) => {
  try {
    const { title, description, price, category, imageUrl, tags } = req.body;
    
    // Ensure user is authenticated (handled by isArtist middleware)
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const newArtwork = {
      title,
      description,
      price: Number(price),
      category,
      imageUrl,
      tags: tags || [],
      artistId: req.user.id,
      artistName: req.user.name,
      status: 'available',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await getDb().collection('artworks').insertOne(newArtwork);
    res.status(201).json({ ...newArtwork, _id: result.insertedId });
  } catch (error) {
    console.error("Error creating artwork:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getArtworks = async (req, res) => { 
  try {
    const { search, category, sort, artistId, minPrice, maxPrice } = req.query;
    
    let query = {};
    
    if (search) {
        query.title = { $regex: search, $options: 'i' };
    }
    
    if (category && category !== 'All') {
        query.category = category;
    }
    
    if (artistId) {
        query.artistId = artistId;
    }

    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'price_asc') sortObj = { price: 1 };
    if (sort === 'price_desc') sortObj = { price: -1 };
    if (sort === 'newest') sortObj = { createdAt: -1 };

    const artworks = await getDb().collection('artworks').find(query).sort(sortObj).toArray();
    res.json(artworks);
  } catch (error) {
    console.error("Error fetching artworks:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getArtworkById = async (req, res) => {
  try {
    const artwork = await getDb().collection('artworks').findOne({ _id: new ObjectId(req.params.id) });
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }
    res.json(artwork);
  } catch (error) {
    console.error("Error fetching artwork:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateArtwork = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Check ownership
    const artwork = await getDb().collection('artworks').findOne({ _id: new ObjectId(id) });
    if (!artwork) {
        return res.status(404).json({ message: 'Artwork not found' });
    }
    
    if (artwork.artistId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden: You can only edit your own artworks" });
    }

    updateData.updatedAt = new Date();
    await getDb().collection('artworks').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
    );
    
    const updatedArtwork = await getDb().collection('artworks').findOne({ _id: new ObjectId(id) });
    res.json(updatedArtwork);
  } catch (error) {
    console.error("Error updating artwork:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteArtwork = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check ownership
    const artwork = await getDb().collection('artworks').findOne({ _id: new ObjectId(id) });
    if (!artwork) {
        return res.status(404).json({ message: 'Artwork not found' });
    }
    
    if (artwork.artistId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden: You can only delete your own artworks" });
    }

    await getDb().collection('artworks').deleteOne({ _id: new ObjectId(id) });
    res.json({ message: 'Artwork deleted successfully' });
  } catch (error) {
    console.error("Error deleting artwork:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
