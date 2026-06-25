import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const database = client.db('test'); // Or your database name if different
    const artworks = database.collection('artworks');

    // Clean up existing seeded artworks first
    await artworks.deleteMany({ artistId: null });

    const sampleData = [
      {
        title: "Ethereal Echoes",
        description: "A mesmerizing abstract piece with deep, rich textures.",
        price: 350,
        category: "Digital Art",
        tags: ["abstract", "ethereal"],
        imageUrl: "/featured/artwork1.jpg",
        artistId: null,
        likes: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Cyber City Dreams",
        description: "A vibrant neon cityscape from the year 2077.",
        price: 890,
        category: "Digital Art",
        tags: ["cyberpunk", "cityscape"],
        imageUrl: "/featured/artwork2.jpg",
        artistId: null,
        likes: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "The Quiet Forest",
        description: "A serene painting of a quiet forest at dawn.",
        price: 150,
        category: "Illustration",
        tags: ["nature", "forest"],
        imageUrl: "/featured/artwork3.jpg",
        artistId: null,
        likes: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Galactic Voyage",
        description: "A stunning visualization of deep space exploration.",
        price: 1200,
        category: "Digital Art",
        tags: ["space", "sci-fi"],
        imageUrl: "/featured/artwork4.jpg",
        artistId: null,
        likes: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Vintage Camera",
        description: "High-resolution 3D model of a classic vintage camera.",
        price: 45,
        category: "3D Model",
        tags: ["vintage", "camera", "3d"],
        imageUrl: "/featured/artwork5.jpg",
        artistId: null,
        likes: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Neon Samurai",
        description: "A character concept art for a neon samurai.",
        price: 250,
        category: "Illustration",
        tags: ["character", "samurai", "neon"],
        imageUrl: "/featured/artwork6.jpg",
        artistId: null,
        likes: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Abstract Waves",
        description: "Flowing abstract waves in a colorful vector format.",
        price: 75,
        category: "Vector",
        tags: ["abstract", "waves", "vector"],
        imageUrl: "/featured/artwork7.jpg",
        artistId: null,
        likes: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const result = await artworks.insertMany(sampleData);
    console.log(`${result.insertedCount} artworks were inserted`);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
