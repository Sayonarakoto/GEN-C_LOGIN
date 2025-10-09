const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

/**
 * @function generateWatermarkedPDF
 * @description Generates a digitally signed (watermarked) PDF document of the approved Special Pass, including a QR code and OTP.
 * @param {object} passData - The fully approved SpecialPass record, containing qr_code_jwt and verification_otp.
 * @param {string} hodName - The full name of the approving HOD.
 * @returns {object} An object containing success status and the file path of the generated PDF.
 */
async function generateWatermarkedPDF(passData, hodName) {
    const uploadDir = path.join(__dirname, '..', 'generated_pdfs');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    const PDF_PATH = path.join(uploadDir, `${passData._id}.pdf`);

    // Generate QR Code Image Data if a token exists
    let qrDataUrl = null;
    if (passData.qr_code_jwt) {
        try {
            qrDataUrl = await QRCode.toDataURL(passData.qr_code_jwt);
        } catch (err) {
            console.error('Failed to generate QR code:', err);
            // Proceeding without QR code, but this could be a critical failure.
        }
    }

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(PDF_PATH));

        // 1. Add Pass Details
        doc.fontSize(18).text('OFFICIAL SPECIAL PASS', { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(12)
           .text(`Pass ID: ${passData._id}`)
           .text(`Student ID: ${passData.student_id?.studentId || passData.student_id}`)
           .text(`Pass Type: ${passData.pass_type}`)
           .text(`Reason: ${passData.request_reason}`)
           .text(`Valid From: ${new Date(passData.date_valid_from).toDateString()}`)
           .text(`Valid To: ${new Date(passData.date_valid_to).toDateString()}`);
           
        doc.moveDown(2);
        
        // 2. Apply Digital Watermark
        const departmentCode = passData.department || 'N/A';
        const approvedDate = passData.approved_at ? new Date(passData.approved_at).toLocaleDateString() : 'N/A';
        const watermarkText = `APPROVED BY: ${hodName.toUpperCase()} - DEPT: ${departmentCode} - ${approvedDate}`; 

        doc.rotate(-45, { origin: [200, 300] })
           .fillColor('gray')
           .opacity(0.3)
           .fontSize(24)
           .text(watermarkText, 50, 280, { width: 500, align: 'center' })
           .opacity(1)
           .rotate(45, { origin: [200, 300] });

        // Reset fill color and opacity for subsequent content
        doc.fillColor('black').opacity(1);

        // 3. Add QR Code and OTP at the bottom
        if (qrDataUrl && passData.verification_otp) {
            const bottomY = doc.page.height - 150; // Position near the bottom
            doc.image(qrDataUrl, 50, bottomY, { width: 100 });
            doc.fontSize(16).text(`OTP: ${passData.verification_otp}`, 200, bottomY + 40);
        }

        // 4. Finalize and Save
        doc.end();

        doc.on('end', () => resolve({ success: true, filePath: PDF_PATH }));
        doc.on('error', (err) => reject({ success: false, error: err.message }));
    });
}

module.exports = { generateWatermarkedPDF };