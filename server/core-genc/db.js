const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectMongo = async (mongoUri) => {
  const uri = mongoUri || process.env.MONGO_URI || 'mongodb://localhost:27017/paperlessCampus';

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 5000,
    });

    logger.info('✅ MongoDB connected via core-genc/db');
    return mongoose.connection;
  } catch (error) {
    logger.error('❌ MongoDB connection failed in core-genc/db:', error);
    throw error;
  }
};

const getMongoose = () => mongoose;

module.exports = {
  connectMongo,
  getMongoose,
};
