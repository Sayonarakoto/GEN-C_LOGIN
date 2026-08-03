/**
 * Umzug Database Migration Runner for MongoDB / Express.
 * Tracks executed migration files in the 'schema_migrations' collection to ensure
 * development schema updates execute safely and deterministically in production without errors.
 */
const { Umzug } = require('umzug');
const mongoose = require('mongoose');
const logger = require('../../utils/logger');
const path = require('path');

/**
 * Custom Mongoose Storage for Umzug 3.x
 */
class MongooseUmzugStorage {
  constructor(collectionName = 'schema_migrations') {
    this.collectionName = collectionName;
  }

  get collection() {
    if (!mongoose.connection || !mongoose.connection.db) {
      throw new Error('Mongoose is not connected to MongoDB.');
    }
    return mongoose.connection.db.collection(this.collectionName);
  }

  async executed() {
    try {
      const records = await this.collection.find({}).toArray();
      return records.map((r) => r.name);
    } catch (error) {
      logger.error({ error }, 'Failed to fetch executed migrations from MongoDB');
      return [];
    }
  }

  async logMigration({ name }) {
    try {
      await this.collection.insertOne({
        name,
        migratedAt: new Date(),
      });
      logger.info(`[MIGRATION SUCCESS] Logged migration: ${name}`);
    } catch (error) {
      logger.error({ error, name }, 'Failed to log executed migration');
    }
  }

  async unlogMigration({ name }) {
    try {
      await this.collection.deleteOne({ name });
      logger.info(`[MIGRATION UNLOGGED] Reverted migration: ${name}`);
    } catch (error) {
      logger.error({ error, name }, 'Failed to unlog migration');
    }
  }
}

const createUmzugInstance = () => {
  return new Umzug({
    migrations: {
      glob: path.join(__dirname, '20*/**/*.js'),
    },
    storage: new MongooseUmzugStorage(),
    logger: console,
  });
};

/**
 * Execute pending database migrations.
 */
const runMigrations = async () => {
  const startTime = Date.now();
  logger.logMethodCall('Migrator', 'runMigrations');

  try {
    const umzug = createUmzugInstance();
    const pending = await umzug.pending();

    if (pending.length === 0) {
      logger.info('✅ Database schema is up to date. No pending migrations.');
      logger.logMethodSuccess('Migrator', 'runMigrations', Date.now() - startTime);
      return { success: true, executed: [] };
    }

    logger.info(`🚀 Found ${pending.length} pending database migrations. Running migrations...`);
    const executed = await umzug.up();

    const executedNames = executed.map((m) => m.name);
    logger.info(`✅ Successfully executed ${executed.length} database migrations: ${executedNames.join(', ')}`);
    logger.logMethodSuccess('Migrator', 'runMigrations', Date.now() - startTime);

    return { success: true, executed: executedNames };
  } catch (error) {
    logger.logMethodError('Migrator', 'runMigrations', error, Date.now() - startTime);
    console.error('❌ Umzug Migration Execution Failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { runMigrations, createUmzugInstance };
