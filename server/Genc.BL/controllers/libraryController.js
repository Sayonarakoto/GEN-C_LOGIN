const Borrowing = require('../../Genc.DAL/models/Borrowing');
const LibraryPass = require('../../Genc.DAL/models/LibraryPass');
const Book = require('../../Genc.DAL/models/Book');
const { generateLibraryPassPDF } = require('../services/pdfGenerationService');
const mongoose = require('mongoose');

// @desc    Fetch all borrowings
// @route   GET /api/library/borrowings
// @access  Private (Librarian)
exports.fetchBorrowings = async (req, res, next) => {
    try {
        const borrowings = await Borrowing.find().populate('studentId', 'fullName studentId');
        res.status(200).json({ success: true, data: borrowings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Handle Library ID Activation Request (with file upload)
// @route   POST /api/library/activation-request
// @access  Private
exports.createActivationRequest = async (req, res) => {
    try {
        const { fullName, role, department, institutionId, email, passType } = req.body;
        const idProofPath = req.file ? `/uploads/${req.file.filename}` : null;

        // Check if user already has a pending or approved request
        if (!passType || passType === 'Digital Library Card') {
            const existingRequest = await LibraryPass.findOne({
                requester: req.user.id,
                passType: 'Digital Library Card',
                status: { $in: ['Pending', 'Approved'] }
            });

            if (existingRequest) {
                return res.status(400).json({ 
                    success: false, 
                    message: existingRequest.status === 'Approved' ? 'You already have an active Library ID.' : 'You have a pending request.' 
                });
            }
        }

        // Create the pass request
        // We store the snapshot of details provided in the form
        let newPass = await LibraryPass.create({
            requester: req.user.id,
            requesterModel: req.user.role === 'student' ? 'Student' : 'Faculty',
            passType: passType || 'Digital Library Card',
            status: 'Pending',
            // Assuming your LibraryPass model allows mixed fields or you have updated the schema.
            // If strict, these might not save, but the 'requester' link is the most important.
            idProofPath: idProofPath
        });

        // Populate requester details for the socket event and response
        newPass = await newPass.populate('requester', 'fullName studentId employeeId department profilePictureUrl profilePhoto year');

        // Notify librarians via socket
        if (req.io) {
            req.io.emit('newLibraryPassRequest', newPass);
        }

        res.status(201).json({ success: true, data: newPass, message: 'Activation request submitted successfully' });
    } catch (error) {
        console.error('Library Activation Request Error:', error);
        res.status(500).json({ success: false, message: 'Server Error processing request' });
    }
};

// @desc    Get all pending library passes
// @route   GET /api/library/librarypass/pending
// @access  Private (Librarian)
exports.getPendingPasses = async (req, res, next) => {
    try {
        const passes = await LibraryPass.find({ status: 'Pending' })
            .populate('requester', 'fullName studentId employeeId department profilePictureUrl profilePhoto year')
            .sort({ requestedAt: -1 });
        res.status(200).json({ success: true, data: passes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Approve a library pass
// @route   PUT /api/library/librarypass/approve/:id
// @access  Private (Librarian)
exports.approvePass = async (req, res) => {
    const io = req.io;
    const passId = req.params.id;
    try {
        let pass = await LibraryPass.findById(passId);
        if (!pass) {
            return res.status(404).json({ success: false, message: 'Pass not found' });
        }

        // Logic for "Book Borrow" requests (Crowdsourcing Inventory)
        if (pass.passType === 'Book Borrow') {
            // 1. Add/Update Book in Inventory
            // Check if book exists by ISBN (if provided) or Title
            let book = await Book.findOne({ 
                $or: [
                    { isbn: pass.bookISBN }, 
                    { title: { $regex: new RegExp(`^${pass.bookTitle}$`, 'i') } }
                ]
            });

            if (!book) {
                book = await Book.create({
                    title: pass.bookTitle,
                    author: pass.bookAuthor,
                    isbn: pass.bookISBN,
                    category: pass.bookCategory,
                    addedBy: pass.requester,
                    totalCopies: 1,
                    availableCopies: 0 // Immediately borrowed
                });
            } else {
                // If book exists, we assume this is a new copy being registered
                book.totalCopies += 1;
                await book.save();
            }

            // 2. Create Borrowing Record (Assuming Borrowing model exists)
            const duration = pass.borrowDuration || 14;
            await Borrowing.create({
                studentId: pass.requester,
                bookId: book._id, // Assuming Borrowing links to Book
                bookTitle: book.title, // Fallback if schema differs
                issueDate: new Date(),
                dueDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000), // Use requested duration
                status: 'Issued'
            });
        }

        pass.status = 'Approved';
        pass.approvedBy = req.user.id;
        await pass.save();
        
        // Emit socket event to notify user
        io.to(pass.requester.toString()).emit('passStatusUpdate', { passId, status: 'Approved' });

        res.status(200).json({ success: true, data: pass });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Reject a library pass
// @route   PUT /api/library/librarypass/reject/:id
// @access  Private (Librarian)
exports.rejectPass = async (req, res) => {
    const io = req.io;
    const passId = req.params.id;
    try {
        const pass = await LibraryPass.findByIdAndUpdate(passId, { status: 'Rejected', approvedBy: req.user.id }, { new: true });
        if (!pass) {
            return res.status(404).json({ success: false, message: 'Pass not found' });
        }

        // Emit socket event to notify user
        io.to(pass.requester.toString()).emit('passStatusUpdate', { passId, status: 'Rejected' });

        res.status(200).json({ success: true, data: pass });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Request a new library pass
// @route   POST /api/library/request-pass
// @access  Private (Student, Faculty)
exports.requestLibraryPass = async (req, res) => {
    const { passType } = req.body;
    const { id, role } = req.user;

    // The role from the JWT is 'student' or 'faculty'. The model name is 'Student' or 'Faculty'.
    const requesterModel = role.charAt(0).toUpperCase() + role.slice(1);

    try {
        const newPass = await LibraryPass.create({
            requester: id,
            requesterModel: requesterModel,
            passType,
        });

        // Notify librarians via socket
        req.io.emit('newLibraryPassRequest', newPass);

        res.status(201).json({ success: true, data: newPass });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Request to borrow a book (and add to inventory)
// @route   POST /api/library/request-borrow
// @access  Private (Student)
exports.requestBookBorrow = async (req, res) => {
    const { bookTitle, bookAuthor, bookISBN, bookCategory, borrowDuration } = req.body;
    
    try {
        // Check if user has an active Digital Library Card
        const requesterModel = req.user.role === 'student' ? 'Student' : 'Faculty';
        const activeCard = await LibraryPass.findOne({
            requester: req.user.id,
            requesterModel: requesterModel,
            passType: 'Digital Library Card',
            status: { $regex: /^Approved$/i }
        });

        if (!activeCard) {
            return res.status(403).json({ success: false, message: 'You must have an active Digital Library Card to borrow books.' });
        }

        const newPass = await LibraryPass.create({
            requester: req.user.id,
            requesterModel: requesterModel,
            passType: 'Book Borrow',
            status: 'Pending',
            bookTitle,
            bookAuthor,
            bookISBN,
            bookCategory,
            borrowDuration: borrowDuration || 14
        });

        // Populate for socket
        await newPass.populate('requester', 'fullName studentId department year');

        if (req.io) req.io.emit('newLibraryPassRequest', newPass);

        res.status(201).json({ success: true, data: newPass, message: 'Borrow request submitted' });
    } catch (error) {
        console.error('Borrow Request Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get Librarian Dashboard Stats
// @route   GET /api/library/dashboard/stats
// @access  Private (Librarian)
exports.getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 6);
        last7Days.setHours(0, 0, 0, 0);

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // 1. Pending Requests
        const pendingRequests = await LibraryPass.countDocuments({ status: 'Pending' });

        // 2. Overdue Books (Books with dueDate < now and still Issued)
        const overdueBooks = await Borrowing.countDocuments({ 
            dueDate: { $lt: new Date() }, 
            status: 'Issued' 
        });

        // 3. Issued Today
        const issuedToday = await Borrowing.countDocuments({ 
            issueDate: { $gte: today } 
        });

        // 4. New Members (Approved Library Passes this month)
        const newMembers = await LibraryPass.countDocuments({
            status: 'Approved',
            passType: 'Digital Library Card', // Fix: Only count ID activations, not book borrows
            requestedAt: { $gte: startOfMonth }
        });

        // 5. Borrowing Trend (Last 7 Days Aggregation)
        const trendAgg = await Borrowing.aggregate([
            {
                $match: {
                    issueDate: { $gte: last7Days }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$issueDate" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Format for Chart: Fill in missing days with 0
        const borrowingTrend = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

            const found = trendAgg.find(item => item._id === dateStr);
            borrowingTrend.push({
                name: dayName,
                books: found ? found.count : 0
            });
        }

        res.status(200).json({
            success: true,
            data: {
                overdueBooks,
                pendingRequests,
                issuedToday,
                newMembers,
                borrowingTrend    // Added trend data
            }
        });
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ success: false, message: 'Server Error fetching stats' });
    }
};

// @desc    Export Librarian Dashboard Stats as CSV
// @route   GET /api/library/dashboard/stats/export
// @access  Private (Librarian)
exports.exportDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 6);
        last7Days.setHours(0, 0, 0, 0);

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Fetch Stats (Same logic as getDashboardStats)
        const pendingRequests = await LibraryPass.countDocuments({ status: 'Pending' });
        const overdueBooks = await Borrowing.countDocuments({ dueDate: { $lt: new Date() }, status: 'Issued' });
        const issuedToday = await Borrowing.countDocuments({ issueDate: { $gte: today } });
        const newMembers = await LibraryPass.countDocuments({ 
            status: 'Approved', 
            passType: 'Digital Library Card', // Fix: Only count ID activations
            requestedAt: { $gte: startOfMonth } 
        });

        const trendAgg = await Borrowing.aggregate([
            { $match: { issueDate: { $gte: last7Days } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$issueDate" } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Format Trend Data
        const borrowingTrend = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const found = trendAgg.find(item => item._id === dateStr);
            borrowingTrend.push({ name: dayName, books: found ? found.count : 0 });
        }

        // Construct CSV String
        let csv = 'Metric,Value\n';
        csv += `Overdue Books,${overdueBooks}\n`;
        csv += `Pending Requests,${pendingRequests}\n`;
        csv += `Issued Today,${issuedToday}\n`;
        csv += `New Members (This Month),${newMembers}\n`;
        csv += '\n'; // Empty line separator
        csv += 'Date,Books Borrowed\n';
        borrowingTrend.forEach(day => {
            csv += `"${day.name}",${day.books}\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment(`library_report_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);

    } catch (error) {
        console.error('Export Stats Error:', error);
        res.status(500).json({ success: false, message: 'Server Error exporting stats' });
    }
};

// @desc    Get all books in inventory
// @route   GET /api/library/books
// @access  Private (Librarian)
exports.getAllBooks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const sortBy = req.query.sortBy || 'createdAt';

        let sortOptions = { createdAt: -1 };
        if (sortBy === 'title') sortOptions = { title: 1 };
        else if (sortBy === 'author') sortOptions = { author: 1 };
        else if (sortBy === 'availability') sortOptions = { availableCopies: -1 };

        let query = {};
        if (search) {
            query = {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { author: { $regex: search, $options: 'i' } },
                    { isbn: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const total = await Book.countDocuments(query);
        const books = await Book.find(query).sort(sortOptions).skip((page - 1) * limit).limit(limit);

        res.status(200).json({ success: true, data: books, total, page, limit });
    } catch (error) {
        console.error("Get Books Error:", error);
        res.status(500).json({ success: false, message: 'Server Error fetching books' });
    }
};

// @desc    Add a new book manually
// @route   POST /api/library/books
// @access  Private (Librarian)
exports.addBook = async (req, res) => {
    try {
        const { title, author, isbn, category, totalCopies } = req.body;
        const book = await Book.create({
            title,
            author,
            isbn,
            category,
            totalCopies: totalCopies || 1,
            availableCopies: totalCopies || 1,
            addedBy: req.user.id
        });
        res.status(201).json({ success: true, data: book });
    } catch (error) {
        console.error("Add Book Error:", error);
        res.status(500).json({ success: false, message: 'Server Error adding book' });
    }
};

// @desc    Get status of library activation request
// @route   GET /api/library/status/:userId
// @access  Private
exports.getRequestStatus = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId || userId === 'undefined' || userId === 'null' || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid User ID' });
        }

        // Find the most recent activation request (Digital Library Card only)
        const request = await LibraryPass.findOne({ 
            requester: userId,
            passType: 'Digital Library Card' 
        }).sort({ requestedAt: -1 }).populate('approvedBy', 'fullName');
        
        res.status(200).json({ success: true, data: request });
    } catch (error) {
        console.error('Get Request Status Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete a book
// @route   DELETE /api/library/books/:id
// @access  Private (Librarian)
exports.deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ success: false, message: 'Book not found' });
        }
        await book.deleteOne();
        res.status(200).json({ success: true, message: 'Book deleted successfully' });
    } catch (error) {
        console.error("Delete Book Error:", error);
        res.status(500).json({ success: false, message: 'Server Error deleting book' });
    }
};

// @desc    Download Library Pass PDF
// @route   GET /api/library/pass/download/:id
// @access  Private
exports.downloadLibraryPass = async (req, res) => {
    try {
        const { id } = req.params;
        const pass = await LibraryPass.findById(id)
            .populate('requester', 'fullName studentId employeeId department profilePictureUrl profilePhoto')
            .populate('approvedBy', 'fullName');
        
        if (!pass) {
            return res.status(404).json({ success: false, message: 'Pass not found' });
        }

        const pdfBytes = await generateLibraryPassPDF(pass);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="library_card_${id}.pdf"`);
        res.send(Buffer.from(pdfBytes));
    } catch (error) {
        console.error('Download Library Pass Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all users with an active library card
// @route   GET /api/library/members
// @access  Private (Librarian)
exports.getLibraryMembers = async (req, res) => {
    try {
        const approvedPasses = await LibraryPass.find({
            passType: 'Digital Library Card',
            status: 'Approved'
        })
        .populate('requester', 'fullName studentId employeeId department year profilePictureUrl profilePhoto role');

        const members = approvedPasses.map(pass => pass.requester).filter(Boolean); // Filter out any null/deleted requesters

        res.status(200).json({ success: true, data: members });
    } catch (error) {
        console.error('Get Library Members Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get detailed profile for a library member
// @route   GET /api/library/members/:userId
// @access  Private (Librarian)
exports.getMemberDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const pass = await LibraryPass.findOne({ requester: userId, passType: 'Digital Library Card' })
            .populate('requester', 'fullName studentId employeeId department year email profilePictureUrl profilePhoto role');

        if (!pass) {
            return res.status(404).json({ success: false, message: 'No library membership found for this user.' });
        }

        const borrowingCount = await Borrowing.countDocuments({ studentId: userId, status: 'Issued' });

        res.status(200).json({
            success: true,
            data: {
                profile: pass.requester,
                passStatus: pass.status,
                borrowingCount
            }
        });
    } catch (error) {
        console.error('Get Member Details Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Deactivate a user's library card
// @route   PUT /api/library/members/:userId/deactivate
// @access  Private (Librarian)
exports.deactivateLibraryCard = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;

        const pass = await LibraryPass.findOneAndUpdate({ requester: userId, passType: 'Digital Library Card', status: 'Approved' }, { status: 'Rejected', rejectionReason: reason || 'Card deactivated by librarian.', approvedBy: req.user.id }, { new: true });

        if (!pass) return res.status(404).json({ success: false, message: 'Active library card not found for this user.' });
        
        res.status(200).json({ success: true, message: 'Library card has been deactivated.' });
    } catch (error) {
        console.error('Deactivate Card Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};