const express = require('express');
const { handleUpload } = require('@vercel/blob/client');

const router = express.Router();

router.post('/profile-picture-upload', async (req, res) => {
  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/jpeg', 'image/png'],
      }),
    });

    return res.json(jsonResponse);
  } catch (error) {
    console.error('Blob upload error:', error);
    return res.status(400).json({
      success: false,
      message: "The upload couldn't be completed. Please try again.",
      code: 'UPLOAD_FAILED',
    });
  }
});

module.exports = router;
