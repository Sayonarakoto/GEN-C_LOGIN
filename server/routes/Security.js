const express = require('express');
const router = express.Router();
const Security = require('../models/security'); // Adjust the path if needed

// Route to handle passkey submission
router.post('/api/security/submit-passkey', async (req, res) => {
  try {
    const { passkey } = req.body;

    if (!passkey) {
      return res.status(400).json({ error: 'Passkey is required' });
    }

    // Create new security entry; pre-save hook will hash passkey
    const securityEntry = new Security({ passkey });

    await securityEntry.save();

    res.status(201).json({ message: 'Passkey saved successfully' });
  } catch (error) {
    console.error('Error saving passkey:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
