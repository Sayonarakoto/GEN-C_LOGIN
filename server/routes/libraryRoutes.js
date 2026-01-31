const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { 
    fetchBorrowings, 
    getPendingPasses, 
    approvePass,
    rejectPass,
    requestLibraryPass,
    createActivationRequest,
    getDashboardStats,
    exportDashboardStats,
    requestBookBorrow,
    getAllBooks,
    addBook,
    deleteBook,
    getRequestStatus,
    downloadLibraryPass,
    getLibraryMembers,
    getMemberDetails,
    deactivateLibraryCard
} = require('../controllers/libraryController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Multer Configuration for ID Proof Uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Ensure this directory exists in your server root
    },
    filename: function (req, file, cb) {
        cb(null, 'lib-id-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// All routes in this file require a logged-in user
router.use(requireAuth);

// Librarian routes
router.get('/borrowings', requireRole('librarian'), fetchBorrowings);
router.get('/librarypass/pending', requireRole('librarian'), getPendingPasses);
router.get('/dashboard/stats', requireRole('librarian'), getDashboardStats);
router.get('/dashboard/stats/export', requireRole('librarian'), exportDashboardStats);
router.get('/books', requireRole('librarian'), getAllBooks);
router.post('/books', requireRole('librarian'), addBook);
router.delete('/books/:id', requireRole('librarian'), deleteBook);
router.put('/librarypass/approve/:id', requireRole('librarian'), approvePass);
router.put('/librarypass/reject/:id', requireRole('librarian'), rejectPass);
router.get('/members', requireRole('librarian'), getLibraryMembers);
router.get('/members/:userId', requireRole('librarian'), getMemberDetails);
router.put('/members/:userId/deactivate', requireRole('librarian'), deactivateLibraryCard);

// Student and Faculty routes
router.post('/request-pass', requireRole('student', 'faculty', 'hod'), requestLibraryPass);
router.post('/request-borrow', requireRole('student'), requestBookBorrow);

// Download Library Pass
router.get('/pass/download/:id', requireAuth, downloadLibraryPass);

// Get Status for a specific user
router.get('/status/:userId', requireAuth, getRequestStatus);

// New Activation Request Route (Matches the frontend call)
router.post('/activation-request', requireAuth, upload.single('idProof'), createActivationRequest);

module.exports = router;