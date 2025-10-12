const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode'); // Keep QRCode for generateWatermarkedPDF if it uses it.
const fetch = require('node-fetch'); // For embedding images if needed later

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
        try {
            qrDataUrl = await QRCode.toDataURL(passData.qr_code_id);
        } catch (err) {
            // Proceeding without QR code, but this could be a critical failure.
        }
    }

    // Using pdf-lib for watermarked PDF as well for consistency
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // 1. Add Pass Details
    let passTitle = 'OFFICIAL GATE PASS'; // Default to Gate Pass
    const specialPassTypes = ['ID Lost', 'Improper Uniform', 'Other', 'HOD Initiated']; // These are considered 'special'
    if (specialPassTypes.includes(passData.pass_type)) {
        passTitle = 'OFFICIAL SPECIAL PASS';
    }
    page.drawText(passTitle, { x: 50, y: height - 50, font, size: 18, color: rgb(0, 0, 0) });

    let currentY = height - 100;
    const lineHeight = 15;

    page.drawText(`Student Name: ${passData.student_id && passData.student_id.fullName ? passData.student_id.fullName : 'N/A'}`, { x: 50, y: currentY, font, size: 12, color: rgb(0, 0, 0) });
    currentY -= lineHeight;
    page.drawText(`Pass Type: ${passData.pass_type || 'Gate Pass'}`, { x: 50, y: currentY, font, size: 12, color: rgb(0, 0, 0) });
    currentY -= lineHeight;
    page.drawText(`Reason: ${passData.reason}`, { x: 50, y: currentY, font, size: 12, color: rgb(0, 0, 0) });
    currentY -= lineHeight;
    page.drawText(`Valid Date: ${new Date(passData.date_valid_from).toLocaleDateString('en-GB', { dateStyle: 'short' })}`, { x: 50, y: currentY, font, size: 12, color: rgb(0, 0, 0) });
    currentY -= lineHeight;
    page.drawText(`Start Time (IST): ${new Date(passData.date_valid_from).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}`, { x: 50, y: currentY, font, size: 12, color: rgb(0, 0, 0) });
    currentY -= lineHeight;
           
    if (passData.date_valid_to) {
        page.drawText(`End Time (IST): ${new Date(passData.date_valid_to).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}`, { x: 50, y: currentY, font, size: 12, color: rgb(0, 0, 0) });
        currentY -= lineHeight;
    } else {
        page.drawText(`End Time (IST): N/A (Return Not Required)`, { x: 50, y: currentY, font, size: 12, color: rgb(0, 0, 0) });
        currentY -= lineHeight;
    }

    currentY -= (lineHeight * 2); // Move down 2 lines

    // 2. Apply Digital Watermark
    const departmentCode = passData.department_id || 'N/A';
    const approvedDate = passData.updatedAt ? new Date(passData.updatedAt).toLocaleDateString() : 'N/A';
    const watermarkText = `APPROVED BY: ${hodName.toUpperCase()} - DEPT: ${departmentCode} - ${approvedDate}`; 

    // pdf-lib doesn't have direct rotate and opacity for text like pdfkit.
    // This is a simplified watermark. For a true rotated watermark, you'd need to draw it as an image or use more complex transformations.
    page.drawText(watermarkText, {
        x: 50,
        y: currentY,
        font,
        size: 18,
        color: rgb(0.7, 0.7, 0.7), // Light gray
        opacity: 0.3,
    });
    currentY -= (lineHeight * 2);

    // 3. Add QR Code and OTP at the bottom
    const bottomY = 150; // Position near the bottom

    if (qrDataUrl) {
        const qrImage = await pdfDoc.embedPng(qrDataUrl);
        page.drawImage(qrImage, { x: 50, y: bottomY, width: 100, height: 100 });
    } else {
        page.drawText('QR Code not available.', { x: 50, y: bottomY + 40, font, size: 10, color: rgb(0, 0, 0) });
    }

    if (passData.one_time_pin) {
        page.drawText(`OTP: ${passData.one_time_pin}`, { x: 200, y: bottomY + 40, font, size: 16, color: rgb(0, 0, 0) });
    } else {
        page.drawText('OTP not available.', { x: 200, y: bottomY + 40, font, size: 10, color: rgb(0, 0, 0) });
    }

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(PDF_PATH, pdfBytes);
    return { success: true, filePath: PDF_PATH };
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

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let currentY = height - 50; // Start from top with some margin
    const margin = 50;
    const lineHeight = 12;
    const sectionSpacing = 20;
    const itemSpacing = 10;

    const addText = (text, size, isBold = false, color = rgb(0, 0, 0)) => {
        page.drawText(text, {
            x: margin,
            y: currentY,
            font: isBold ? font : font, // pdf-lib doesn't have bold variants for StandardFonts directly, need to embed bold font if truly needed
            size,
            color,
        });
        currentY -= (size + 5); // Move Y down based on font size
    };

    const checkPageBreak = (heightNeeded) => {
        if (currentY - heightNeeded < margin) { // If not enough space, add new page
            page = pdfDoc.addPage();
            currentY = height - 50; // Reset Y for new page
        }
    };

    // Title
    checkPageBreak(30);
    addText('Student Activity Report', 20, true, rgb(0, 0.53, 0.71)); // Blue color
    currentY -= sectionSpacing;

    // Student Details Section
    checkPageBreak(80);
    addText('Student Details:', 14, true);
    addText(`Name: ${studentDetails.fullName}`, 12);
    addText(`Student ID: ${studentDetails.studentId}`, 12);
    addText(`Department: ${studentDetails.department}`, 12);
    addText(`Year: ${studentDetails.year}`, 12);
    currentY -= sectionSpacing;

    // Report Period
    checkPageBreak(30);
    addText(`Report Period: ${startDate || 'N/A'} to ${endDate || 'N/A'}`, 12);
    currentY -= sectionSpacing;

    // Approved Special Passes Section
    checkPageBreak(30);
    addText('Approved Special Passes:', 14, true);
    if (reportData.specialPasses && reportData.specialPasses.length > 0) {
        for (const pass of reportData.specialPasses) {
            const passText = `  - Pass Type: ${pass.pass_type}, Reason: ${pass.request_reason}, Approved By: ${pass.hod_approver_id?.fullName || 'N/A'}, Approved At: ${new Date(pass.approved_at).toLocaleString()}`;
            checkPageBreak(lineHeight + itemSpacing);
            addText(passText, 10);
            currentY -= itemSpacing;
        }
    }
    else {
        checkPageBreak(lineHeight + itemSpacing);
        addText('  No approved special passes found for the selected period.', 10);
        currentY -= itemSpacing;
    }
    currentY -= sectionSpacing;

    // Late Entries Section
    checkPageBreak(30);
    addText('Late Entries:', 14, true);
    if (reportData.lateEntries && reportData.lateEntries.length > 0) {
        for (const entry of reportData.lateEntries) {
            const entryText = `  - Date: ${new Date(entry.date).toLocaleDateString()}, Reason: ${entry.reason}, Status: ${entry.status}, Faculty: ${entry.facultyId?.fullName || 'N/A'}, HOD: ${entry.HODId?.fullName || 'N/A'}`;
            checkPageBreak(lineHeight + itemSpacing);
            addText(entryText, 10);
            currentY -= itemSpacing;
        }
    }
    else {
        checkPageBreak(lineHeight + itemSpacing);
        addText('  No late entries found for the selected period.', 10);
        currentY -= itemSpacing;
    }
    currentY -= sectionSpacing;

    // Gate Passes Section
    checkPageBreak(30);
    addText('Gate Passes:', 14, true);
    if (reportData.gatePasses && reportData.gatePasses.length > 0) {
        for (const pass of reportData.gatePasses) {
            const passText = `  - Destination: ${pass.destination}, Reason: ${pass.reason}, Faculty Status: ${pass.faculty_status}, HOD Status: ${pass.hod_status}, From: ${new Date(pass.date_valid_from).toLocaleString()}, To: ${new Date(pass.date_valid_to).toLocaleString()}`;
            checkPageBreak(lineHeight + itemSpacing);
            addText(passText, 10);
            currentY -= itemSpacing;
        }
    }
    else {
        checkPageBreak(lineHeight + itemSpacing);
        addText('  No gate passes found for the selected period.', 10);
        currentY -= itemSpacing;
    }
    currentY -= sectionSpacing;

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(PDF_PATH, pdfBytes);
    return PDF_PATH;
}

module.exports = { generateWatermarkedPDF, generateStudentActivityReportPDF };