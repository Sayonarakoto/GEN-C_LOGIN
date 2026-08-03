const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const navigationController = require('../Genc.BL/controllers/navigationController');

router.get('/me', requireAuth, navigationController.getUserNavigation);

module.exports = router;
