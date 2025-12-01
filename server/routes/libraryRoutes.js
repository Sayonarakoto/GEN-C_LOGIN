const express = require('express');
const router = express.Router();
const { 
    fetchBorrowings, 
    getPendingPasses, 
    approvePass, 
    // Other actions like renew/block/notify will be here
} = require('../controllers/libraryController');
// const { protect } = require('../middleware/auth'); // Placeholder for middleware

// 4. /api/borrowings (GET with filters)
router.route('/borrowings').get(fetchBorrowings);

// 5. /api/librarypass/pending (librarian auth)
router.route('/librarypass/pending').get(getPendingPasses);

// 6. /api/librarypass/approve/:id (generate PNG)
router.route('/librarypass/approve/:id').put(approvePass);

module.exports = router;