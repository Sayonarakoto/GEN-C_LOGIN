const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
/**
 * @function generateWatermarkedPDF
 * @description Generates a digitally signed (watermarked) PDF document of the approved Gate Pass, including a QR code and OTP.
 * @param {object} passData - The fully approved GatePass record, containing qr_code_id and one_time_pin.
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
    if (passData.qr_code_id) { // Use qr_code_id
        console.log(`[PDF Service] Attempting to generate QR code for: ${passData.qr_code_id}`);
        try {
            qrDataUrl = await QRCode.toDataURL(passData.qr_code_id);
        } catch (err) {
            console.error('[PDF Service] Failed to generate QR code:', err);
            // Proceeding without QR code, but this could be a critical failure.
        }
    }

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(PDF_PATH));

        // 1. Add Pass Details
        let passTitle = 'OFFICIAL GATE PASS'; // Default to Gate Pass
        const specialPassTypes = ['ID Lost', 'Improper Uniform', 'Other', 'HOD Initiated']; // These are considered 'special'
        if (specialPassTypes.includes(passData.pass_type)) {
            passTitle = 'OFFICIAL SPECIAL PASS';
        }
        doc.fontSize(18).text(passTitle, { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(12)
           
           .text(`Student Name: ${passData.student_id && passData.student_id.fullName ? passData.student_id.fullName : 'N/A'}`)
           .text(`Pass Type: ${passData.pass_type || 'Gate Pass'}`) // Provide default if pass_type is missing
           .text(`Reason: ${passData.reason}`) // Use passData.reason
           .text(`Valid Date: ${new Date(passData.date_valid_from).toLocaleDateString('en-GB', { dateStyle: 'short' })}`)
           .text(`Start Time (IST): ${new Date(passData.date_valid_from).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}`);
           
        if (passData.date_valid_to) { // Conditionally render End Time
            doc.text(`End Time (IST): ${new Date(passData.date_valid_to).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}`);
        } else {
            doc.text(`End Time (IST): N/A (Return Not Required)`);
        }

        doc.moveDown(2);
        
        // 2. Apply Digital Watermark
        const departmentCode = passData.department_id || 'N/A';
        const approvedDate = passData.updatedAt ? new Date(passData.updatedAt).toLocaleDateString() : 'N/A';
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
        const bottomY = doc.page.height - 150; // Position near the bottom

        if (qrDataUrl) {
            doc.image(qrDataUrl, 50, bottomY, { width: 100 });
        } else {
            doc.fontSize(10).text('QR Code not available.', 50, bottomY + 40);
        }

        if (passData.one_time_pin) {
            doc.fontSize(16).text(`OTP: ${passData.one_time_pin}`, 200, bottomY + 40);
        } else {
            doc.fontSize(10).text('OTP not available.', 200, bottomY + 40);
        }

        // 4. Finalize and Save
        doc.end();

        doc.on('end', () => resolve({ success: true, filePath: PDF_PATH }));
        doc.on('error', (err) => reject({ success: false, error: err.message }));
    });
}

module.exports = { generateWatermarkedPDF };