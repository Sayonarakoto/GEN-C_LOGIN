const { PDFDocument, rgb, StandardFonts, degrees } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const fetch = require('node-fetch');
const Student = require('../../Genc.DAL/models/student');

/**
 * @function generateWatermarkedPDF
 * @description Generates a digitally signed (watermarked) PDF document of the approved Pass, including a QR code and OTP.
 * @param {object} passData - The fully approved Pass record.
 * @param {string} hodName - The full name of the approving HOD.
 * @returns {Promise<Uint8Array>} The generated PDF bytes.
 */
async function generateWatermarkedPDF(passData, hodName, hodDepartment = 'N/A') {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // Standard A4 size
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // --- 1. Background Watermark ---
    const watermarkText = 'GEN-C OFFICIAL';
    page.drawText(watermarkText, {
        x: width / 2 - 200,
        y: height / 2,
        size: 60,
        font: boldFont,
        color: rgb(0.85, 0.85, 0.85),
        rotate: degrees(45),
        opacity: 0.3,
    });

    // --- 2. Institutional Header ---
    const headerHeight = 80;
    page.drawRectangle({
        x: 0,
        y: height - headerHeight,
        width: width,
        height: headerHeight,
        color: rgb(0.1, 0.15, 0.3), // Dark Blue
    });

    // Header Text
    page.drawText('GEN-C CAMPUS', {
        x: 30,
        y: height - 45,
        size: 24,
        font: boldFont,
        color: rgb(1, 1, 1),
    });
    
    page.drawText('OFFICIAL GATE PASS SYSTEM', {
        x: 30,
        y: height - 65,
        size: 10,
        font,
        color: rgb(0.8, 0.8, 0.8),
    });

    const dateStr = new Date().toLocaleDateString();
    page.drawText(`Issued: ${dateStr}`, {
        x: width - 150,
        y: height - 50,
        size: 12,
        font,
        color: rgb(1, 1, 1),
    });

    // --- 3. Content Layout ---
    const contentStartY = height - 120;
    
    // Resolve Student Data
    let student = passData.student_id;
    if (!student || !student.fullName || !student.department) {
        try {
            let idToFetch = student?._id || student || passData.studentId;
            if (idToFetch) {
                const fetched = await Student.findById(idToFetch);
                if (fetched) student = fetched;
            }
        } catch (e) { console.error("PDF Student Fetch Error:", e); }
    }
    student = student || {};

    // Student Photo (Left Column)
    let photoAdded = false;
    const photoPath = student.profilePictureUrl || student.profilePhoto;
    
    if (photoPath) {
        try {
            let profileImage;
            
            // Check if photoPath is a URL (Blob storage) or a local file path
            if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
                const response = await fetch(photoPath);
                if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
                const imageBytes = await response.arrayBuffer();
                
                // Infer type from URL or default to JPG
                const isPng = photoPath.toLowerCase().endsWith('.png');
                profileImage = isPng ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);
            } else {
                // Legacy local path
                let relativePath = photoPath.startsWith('/') ? photoPath.slice(1) : photoPath;
                relativePath = relativePath.replace(/^(server|src)[\/]/, '');
                const fullPath = path.join(__dirname, '..', relativePath);
                if (fs.existsSync(fullPath)) {
                    const imageBytes = fs.readFileSync(fullPath);
                    const isPng = fullPath.toLowerCase().endsWith('.png');
                    profileImage = isPng ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);
                } else {
                    throw new Error("Local file not found");
                }
            }

            page.drawImage(profileImage, {
                x: 50,
                y: contentStartY - 120,
                width: 120,
                height: 120,
            });
            photoAdded = true;
        } catch (e) {
            console.error("Error embedding photo:", e);
        }
    }

    if (!photoAdded) {
        page.drawRectangle({
            x: 50,
            y: contentStartY - 120,
            width: 120,
            height: 120,
            color: rgb(0.9, 0.9, 0.9),
            borderColor: rgb(0.6, 0.6, 0.6),
            borderWidth: 1,
        });
        page.drawText('No Photo', { x: 75, y: contentStartY - 60, size: 12, font, color: rgb(0.5, 0.5, 0.5) });
    }

    // Student Details (Right Column)
    const textX = 200;
    let textY = contentStartY - 10;
    const lineHeight = 20;

    page.drawText(`NAME: ${student.fullName || 'N/A'}`, { x: textX, y: textY, size: 14, font: boldFont });
    textY -= lineHeight;
    page.drawText(`ID: ${student.studentId || 'N/A'}`, { x: textX, y: textY, size: 12, font });
    textY -= lineHeight;
    page.drawText(`DEPT: ${student.department || 'N/A'}`, { x: textX, y: textY, size: 12, font });
    textY -= lineHeight;
    page.drawText(`YEAR: ${student.year || 'N/A'}`, { x: textX, y: textY, size: 12, font });

    // Divider Line
    textY -= 30;
    page.drawLine({ start: { x: 50, y: textY }, end: { x: width - 50, y: textY }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    textY -= 30;

    // Pass Information
    page.drawText(`PASS TYPE: ${passData.pass_type || 'Pass'}`, { x: 50, y: textY, size: 14, font: boldFont, color: rgb(0, 0.2, 0.4) });
    textY -= 25;
    
    const validFrom = new Date(passData.date_valid_from).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
    page.drawText(`VALID FROM: ${validFrom}`, { x: 50, y: textY, size: 12, font });
    textY -= lineHeight;

    if (passData.date_valid_to) {
        const validTo = new Date(passData.date_valid_to).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
        page.drawText(`VALID TO: ${validTo}`, { x: 50, y: textY, size: 12, font });
    } else {
        page.drawText(`VALID TO: N/A (One Way)`, { x: 50, y: textY, size: 12, font });
    }
    textY -= lineHeight;
    page.drawText(`REASON: ${passData.reason || 'N/A'}`, { x: 50, y: textY, size: 12, font });

    // --- 4. Security Features (Footer) ---
    const footerY = textY - 80;

    // OTP Display
    const otpCode = passData.one_time_pin || passData.otp || passData.verification_otp;
    if (otpCode) {
        page.drawText('OTP', { x: width / 2 - 20, y: footerY + 30, size: 10, font, color: rgb(0.5, 0.5, 0.5) });
        page.drawText(`${otpCode}`, { x: width / 2 - 35, y: footerY, size: 36, font: boldFont, color: rgb(0, 0, 0) });
    }

    // Dynamic QR Code
    const qrData = JSON.stringify({
        id: passData._id,
        uid: student.studentId,
        type: passData.pass_type,
        valid: true
    });
    try {
        const qrUrl = await QRCode.toDataURL(qrData);
        const qrImageBytes = Buffer.from(qrUrl.split(',')[1], 'base64');
        const qrImage = await pdfDoc.embedPng(qrImageBytes);
        page.drawImage(qrImage, { x: 50, y: footerY - 20, width: 80, height: 80 });
        page.drawText('Scan to Verify', { x: 55, y: footerY - 35, size: 8, font, color: rgb(0.5, 0.5, 0.5) });
    } catch (e) {
        console.error("Error generating QR for PDF:", e);
    }

    // Digital Stamp
    const stampX = width - 150;
    const stampY = footerY + 20;
    
    page.drawCircle({ x: stampX + 40, y: stampY + 10, size: 40, borderColor: rgb(0, 0.6, 0), borderWidth: 2, opacity: 0, borderOpacity: 0.8 });
    page.drawText('APPROVED', { x: stampX + 10, y: stampY, size: 12, font: boldFont, color: rgb(0, 0.6, 0), rotate: degrees(15), opacity: 0.8 });
    page.drawText(`By: ${hodName}`, { x: stampX, y: stampY - 20, size: 8, font, color: rgb(0, 0.6, 0), opacity: 0.8 });

    return await pdfDoc.save();
}

async function generateStudentActivityReportPDF(studentDetails, reportData, startDate, endDate) {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let currentY = height - 50;
    const margin = 50;
    const sectionSpacing = 20;
    const defaultFontSize = 10;
    const headerFontSize = 12;
    const titleFontSize = 20;
    const usableWidth = width - (2 * margin);

    const advanceY = (amount) => {
        if (currentY - amount < margin) {
            page = pdfDoc.addPage();
            currentY = height - margin;
        }
        currentY -= amount;
    };

    const drawTextAndAdvance = (text, options = {}) => {
        const { size = defaultFontSize, isBold = false, color = rgb(0, 0, 0), x = margin, wrapWidth = width - (2 * margin), lineGap = 2, afterSpacing = 0 } = options;
        const textFont = isBold ? boldFont : font;
        const words = text.split(' ');
        let lines = [];
        let currentLine = '';
        for (const word of words) {
            const potentialLine = currentLine === '' ? word : `${currentLine} ${word}`;
            if (textFont.widthOfTextAtSize(potentialLine, size) < wrapWidth) {
                currentLine = potentialLine;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        if (currentLine !== '') lines.push(currentLine);
        for (const line of lines) {
            if (currentY - textFont.heightAtSize(size) - lineGap < margin) {
                page = pdfDoc.addPage();
                currentY = height - margin;
            }
            page.drawText(line, { x, y: currentY, font: textFont, size, color });
            currentY -= (textFont.heightAtSize(size) + lineGap);
        }
        if (afterSpacing > 0) advanceY(afterSpacing);
    };

    // Table drawing helpers simplified to omit disk writes
    drawTextAndAdvance('Student Activity Report', { size: titleFontSize, isBold: true, color: rgb(0, 0.53, 0.71), afterSpacing: sectionSpacing });
    drawTextAndAdvance(`Name: ${studentDetails.fullName} | ID: ${studentDetails.studentId}`, { size: headerFontSize, isBold: true, afterSpacing: sectionSpacing });

    // ... (tables drawing logic for special passes, late entries, gate passes)
    
    return await pdfDoc.save();
}

async function generateLibraryPassPDF(passData) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([300, 180]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.95, 0.97, 1) });
    page.drawRectangle({ x: 0, y: height - 40, width, height: 40, color: rgb(0.1, 0.14, 0.49) });
    page.drawText('DIGITAL LIBRARY PASS', { x: 20, y: height - 25, font: boldFont, size: 14, color: rgb(1, 1, 1) });
    
    const requester = passData.requester || {};
    page.drawText(requester.fullName || 'N/A', { x: 20, y: height - 70, font: boldFont, size: 16 });
    page.drawText(`ID: ${requester.studentId || 'N/A'}`, { x: 20, y: height - 100, font: boldFont, size: 10 });

    return await pdfDoc.save();
}

module.exports = { generateWatermarkedPDF, generateStudentActivityReportPDF, generateLibraryPassPDF };
