const GatePassQR = require('../models/GatePassQR');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_with_secure_secret';

// ADMIN: create a pass and return QR token (JWT)
exports.createPass = async (req, res) => {
    const { holderName, passType, validForMinutes = 60, meta } = req.body;

    try {
        const expiresAt = new Date(Date.now() + validForMinutes * 60 * 1000);
        const pass = await GatePassQR.create({ holderName, passType, expiresAt, meta });

        const payload = { passId: pass._id.toString(), holderName, expiresAt: expiresAt.toISOString() };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: Math.ceil((expiresAt - Date.now()) / 1000) });

        res.json({ ok: true, token, pass });
    } catch (error) {
        console.error('Error creating QR gate pass:', error);
        res.status(500).json({ ok: false, message: 'Error creating QR gate pass', error: error.message });
    }
};

// GATE: verify scanned QR token
exports.verifyPass = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ ok: false, message: 'No token provided' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const pass = await GatePassQR.findById(payload.passId);

        if (!pass) {
            return res.status(404).json({ ok: false, message: 'Pass not found' });
        }

        if (pass.status !== 'active') {
            return res.json({ ok: false, allowed: false, reason: `status:${pass.status}` });
        }

        if (new Date() > new Date(pass.expiresAt)) {
            return res.json({ ok: false, allowed: false, reason: 'expired' });
        }

        // Optionally mark used
        pass.status = 'used'; // or don't auto-use if you want single-scan
        await pass.save();

        return res.json({ ok: true, allowed: true, pass: { holderName: pass.holderName, passType: pass.passType, expiresAt: pass.expiresAt } });

    } catch (err) {
        console.error('Error verifying QR gate pass:', err);
        return res.status(400).json({ ok: false, message: 'Invalid token', error: err.message });
    }
};
