const express = require("express");
const nodemailer = require("nodemailer");

const router = express.Router();

// configure transporter
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "playitforpubg@gmail.com",
    pass: "rvfn gmpy wodu kait" // App password
  }
});

// POST /send-reset
router.post("/send-reset", (req, res) => {
  const { email } = req.body;
  const resetLink = `http://localhost:5173/forget`;

  const mailOptions = {
    from: '"Paperless Campus" <no-reply@gmail.com>',
    to: email,
    subject: "Password Reset Request",
    html: `<p>Click here to reset: <a href="${resetLink}">${resetLink}</a></p>`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error(err);
      return res.status(500).send("❌ Error sending mail");
    }
    res.send("✅ Reset email sent to " + email);
  });
});

module.exports = router;
