const schedule = require('node-schedule');
const SpecialPass = require('../models/SpecialPass'); // To update the pass status

/**
 * @function schedulePassCleanup
 * @description Schedules a job to update a rejected pass's status to 'Expired' after a delay.
 * @param {string} passId - The ID of the SpecialPass to clean up.
 * @param {Date} cleanupTime - The time at which the cleanup should occur.
 */
async function schedulePassCleanup(passId, cleanupTime) {
    schedule.scheduleJob(cleanupTime, async () => {
        try {
            const pass = await SpecialPass.findById(passId);
            if (pass && pass.status === 'Rejected') {
                pass.status = 'Expired';
                await pass.save();
                console.log(`Pass ${passId} status updated to Expired.`);
            }
        } catch (error) {
            console.error(`Error during scheduled cleanup for pass ${passId}:`, error);
        }
    });
    console.log(`Cleanup for pass ${passId} scheduled for ${cleanupTime}`);
}

module.exports = { schedulePassCleanup };