// Script to add sample categories to the database
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/category');
const { connectDB } = require('./config/database');

const addSampleCategories = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Database connected successfully');

    // Sample categories
    const categories = [
      {
        name: 'Web Development',
        description: 'Learn to build websites and web applications'
      },
      {
        name: 'Mobile Development',
        description: 'Create apps for iOS and Android'
      },
      {
        name: 'Data Science',
        description: 'Learn data analysis, machine learning, and AI'
      },
      {
        name: 'Design',
        description: 'UI/UX design, graphic design, and more'
      },
      {
        name: 'Business',
        description: 'Marketing, management, and entrepreneurship'
      }
    ];

    // Check if categories already exist
    const existingCategories = await Category.find({});
    
    if (existingCategories.length > 0) {
      console.log('Categories already exist:', existingCategories.map(c => c.name).join(', '));
      mongoose.connection.close();
      return;
    }

    // Add categories to database
    const result = await Category.insertMany(categories);
    console.log(`${result.length} categories added successfully:`, result.map(c => c.name).join(', '));
    
    // Close database connection
    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error adding categories:', error);
    mongoose.connection.close();
  }
};

// Run the function
addSampleCategories(); 