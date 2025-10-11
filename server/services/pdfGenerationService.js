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
           .text(`Valid Date: ${new Date(passData.date_valid_from).toLocaleDateString('en-GB', { dateStyle: 'short' })}`)
           .text(`Start Time (IST): ${new Date(passData.date_valid_from).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}`)
           .text(`End Time (IST): ${new Date(passData.date_valid_to).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}`);
           
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

/**
 * @function generateStudentActivityReportPDF
 * @description Generates a PDF document for a student's activity report, including special passes, late entries, and gate passes.
 * @param {object} studentDetails - Details of the student (e.g., fullName, studentId, department, year).
 * @param {object} reportData - An object containing arrays of specialPasses, lateEntries, and gatePasses.
 * @param {string} startDate - The start date of the report period (YYYY-MM-DD).
 * @param {string} endDate - The end date of the report period (YYYY-MM-DD).
 * @returns {Promise<string>} A promise that resolves with the path to the generated PDF file.
 */
async function generateStudentActivityReportPDF(studentDetails, reportData, startDate, endDate) {
    const uploadDir = path.join(__dirname, '..', 'generated_pdfs');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    const PDF_PATH = path.join(uploadDir, `activity_report_${studentDetails.studentId}_${Date.now()}.pdf`);

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(PDF_PATH));

        doc.fontSize(20).text('Student Activity Report', { align: 'center' });
        doc.moveDown();

        // Student Details Section
        doc.fontSize(14).text('Student Details:', { underline: true });
        doc.fontSize(12)
           .text(`Name: ${studentDetails.fullName}`)
           .text(`Student ID: ${studentDetails.studentId}`)
           .text(`Department: ${studentDetails.department}`)
           .text(`Year: ${studentDetails.year}`);
        doc.moveDown();

        // Report Period
        doc.fontSize(12).text(`Report Period: ${startDate || 'N/A'} to ${endDate || 'N/A'}`);
        doc.moveDown();

        // Approved Special Passes Section
        doc.fontSize(14).text('Approved Special Passes:', { underline: true });
        if (reportData.specialPasses && reportData.specialPasses.length > 0) {
            reportData.specialPasses.forEach(pass => {
                doc.fontSize(10)
                   .text(`  - Pass Type: ${pass.pass_type}, Reason: ${pass.request_reason}, Approved By: ${pass.hod_approver_id?.fullName || 'N/A'}, Approved At: ${new Date(pass.approved_at).toLocaleString()}`);
            });
        } else {
            doc.fontSize(10).text('  No approved special passes found for the selected period.');
        }
        doc.moveDown();

        // Late Entries Section
        doc.fontSize(14).text('Late Entries:', { underline: true });
        if (reportData.lateEntries && reportData.lateEntries.length > 0) {
            reportData.lateEntries.forEach(entry => {
                doc.fontSize(10)
                   .text(`  - Date: ${new Date(entry.date).toLocaleDateString()}, Reason: ${entry.reason}, Status: ${entry.status}, Faculty: ${entry.facultyId?.fullName || 'N/A'}, HOD: ${entry.HODId?.fullName || 'N/A'}`);
            });
        } else {
            doc.fontSize(10).text('  No late entries found for the selected period.');
        }
        doc.moveDown();

        // Gate Passes Section
        doc.fontSize(14).text('Gate Passes:', { underline: true });
        if (reportData.gatePasses && reportData.gatePasses.length > 0) {
            reportData.gatePasses.forEach(pass => {
                doc.fontSize(10)
                   .text(`  - Destination: ${pass.destination}, Reason: ${pass.reason}, Faculty Status: ${pass.faculty_status}, HOD Status: ${pass.hod_status}, From: ${new Date(pass.date_valid_from).toLocaleString()}, To: ${new Date(pass.date_valid_to).toLocaleString()}`);
            });
        } else {
            doc.fontSize(10).text('  No gate passes found for the selected period.');
        }
        doc.moveDown();

        doc.end();

        doc.on('end', () => resolve(PDF_PATH));
        doc.on('error', (err) => reject(err));
    });
}

module.exports = { generateWatermarkedPDF, generateStudentActivityReportPDF };