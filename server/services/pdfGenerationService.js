const { PDFDocument, rgb, StandardFonts, degrees } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode'); // Keep QRCode for generateWatermarkedPDF if it uses it.
const fetch = require('node-fetch'); // For embedding images if needed later
const Student = require('../models/student');







/**
 * @function generateWatermarkedPDF
 * @description Generates a digitally signed (watermarked) PDF document of the approved Gate Pass, including a QR code and OTP.
 * @param {object} passData - The fully approved GatePass record, containing qr_code_id and one_time_pin.
 * @param {string} hodName - The full name of the approving HOD.
 * @returns {object} An object containing success status and the file path of the generated PDF.
 */
async function generateWatermarkedPDF(passData, hodName, hodDepartment = 'N/A') {
    const uploadDir = path.join(__dirname, '..', 'generated_pdfs');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    const PDF_PATH = path.join(uploadDir, `${passData._id}.pdf`);

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
    
    // Resolve Student Data: Fetch if missing or incomplete (e.g. HOD initiated passes)
    let student = passData.student_id;
    if (!student || !student.fullName || !student.department) {
        try {
            let idToFetch = null;
            if (student && student._id) idToFetch = student._id;
            else if (student) idToFetch = student; // Assuming it's an ID string/ObjectId
            else if (passData.studentId) idToFetch = passData.studentId;

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
            let relativePath = photoPath.startsWith('/') || photoPath.startsWith('\\') ? photoPath.slice(1) : photoPath;
            // Remove 'server' or 'src' prefix if present to avoid incorrect path resolution
            relativePath = relativePath.replace(/^(server|src)[\\/]/, '');
            const fullPath = path.join(__dirname, '..', relativePath);
            if (fs.existsSync(fullPath)) {
                const imageBytes = fs.readFileSync(fullPath);
                const isPng = fullPath.toLowerCase().endsWith('.png');
                const profileImage = isPng ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);
                
                page.drawImage(profileImage, {
                    x: 50,
                    y: contentStartY - 120,
                    width: 120,
                    height: 120,
                });
                // Photo Border
                page.drawRectangle({
                    x: 50,
                    y: contentStartY - 120,
                    width: 120,
                    height: 120,
                    borderColor: rgb(0, 0, 0),
                    borderWidth: 1,
                    opacity: 0,
                    borderOpacity: 1
                });
                photoAdded = true;
            }
        } catch (e) {
            console.error("Error embedding photo in Gate Pass:", e);
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
    page.drawText(`PASS TYPE: ${passData.pass_type || 'Gate Pass'}`, { x: 50, y: textY, size: 14, font: boldFont, color: rgb(0, 0.2, 0.4) });
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
    page.drawText(`REASON: ${passData.request_reason || 'N/A'}`, { x: 50, y: textY, size: 12, font });

    // --- 4. Security Features (Footer) ---
    const footerY = textY - 80;

    // OTP Display
    const otpCode = passData.one_time_pin || passData.otp;
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
        // Remove header "data:image/png;base64,"
        const qrImageBytes = Buffer.from(qrUrl.split(',')[1], 'base64');
        const qrImage = await pdfDoc.embedPng(qrImageBytes);
        page.drawImage(qrImage, {
            x: 50,
            y: footerY - 20,
            width: 80,
            height: 80,
        });
        page.drawText('Scan to Verify', { x: 55, y: footerY - 35, size: 8, font, color: rgb(0.5, 0.5, 0.5) });
    } catch (e) {
        console.error("Error generating QR for PDF:", e);
    }

    // Digital Stamp
    const stampX = width - 150;
    const stampY = footerY + 20;
    
    page.drawCircle({
        x: stampX + 40,
        y: stampY + 10,
        size: 40,
        borderColor: rgb(0, 0.6, 0), // Green
        borderWidth: 2,
        opacity: 0,
        borderOpacity: 0.8
    });
    
    page.drawText('APPROVED', {
        x: stampX + 10,
        y: stampY,
        size: 12,
        font: boldFont,
        color: rgb(0, 0.6, 0),
        rotate: degrees(15),
        opacity: 0.8
    });
    
    page.drawText(`By: ${hodName}`, {
        x: stampX,
        y: stampY - 20,
        size: 8,
        font,
        color: rgb(0, 0.6, 0),
        opacity: 0.8
    });

    // Footer Text
    page.drawText(`Pass ID: ${passData._id}`, { x: 50, y: 30, size: 8, font, color: rgb(0.5, 0.5, 0.5) });
    page.drawText('System Generated - Possession does not guarantee exit.', { x: width / 2 - 100, y: 30, size: 8, font, color: rgb(0.5, 0.5, 0.5) });

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
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let currentY = height - 50; // Start from top with some margin
    const margin = 50;
    const itemSpacing = 5;
    const sectionSpacing = 20;
    const defaultFontSize = 10;
    const headerFontSize = 12;
    const titleFontSize = 20;

    const usableWidth = width - (2 * margin);

    const advanceY = (amount) => {
        if (currentY - amount < margin) { // Check if advancing this amount would go below the margin
            page = pdfDoc.addPage();
            currentY = height - margin; // Reset Y for new page (top margin)
        }
        currentY -= amount;
    };

    const splitTextIntoLines = (text, textFont, size, maxWidth) => {
        const words = text.split(' ');
        let lines = [];
        let currentLine = '';

        for (const word of words) {
            const potentialLine = currentLine === '' ? word : `${currentLine} ${word}`;
            const potentialLineWidth = textFont.widthOfTextAtSize(potentialLine, size);

            if (potentialLineWidth < maxWidth) {
                currentLine = potentialLine;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        if (currentLine !== '') {
            lines.push(currentLine);
        }
        return lines;
    };

    // Helper to add text and manage page breaks
    const drawTextAndAdvance = (text, options = {}) => {
        const { size = defaultFontSize, isBold = false, color = rgb(0, 0, 0), x = margin, wrapWidth = width - (2 * margin), lineGap = 2, afterSpacing = 0 } = options;
        const textFont = isBold ? boldFont : font;
        
        const lines = splitTextIntoLines(text, textFont, size, wrapWidth);

        for (const line of lines) {
            const textHeight = textFont.heightAtSize(size);
            // Check if there is enough space for the next line
            if (currentY - textHeight - lineGap < margin) { 
                page = pdfDoc.addPage();
                currentY = height - margin; // Reset Y for new page (top margin)
            }
            page.drawText(line, { x, y: currentY, font: textFont, size, color });
            currentY -= (textHeight + lineGap);
        }
        if (afterSpacing > 0) {
            advanceY(afterSpacing);
        }
    };

    // Helper to draw a table header row
    const drawTableHeader = (headers, columnWidths, columnStart, options = {}) => {
        const { size = headerFontSize, color = rgb(0, 0, 0), fillColor = rgb(0.9, 0.9, 0.9), borderColor = rgb(0, 0, 0), borderWidth = 0.5, afterSpacing = 0 } = options;

        const cellPadding = 5;
        const minHeaderHeight = 20; // Minimum height for a header row

        // Calculate actual header row height based on wrapped text in cells
        let actualHeaderHeight = minHeaderHeight;
        const wrappedHeaderTexts = [];
        for (let i = 0; i < headers.length; i++) {
            const header = headers[i];
            const colWidth = columnWidths[i];
            const lines = splitTextIntoLines(header, boldFont, size, colWidth - (2 * cellPadding));
            wrappedHeaderTexts.push(lines);
            actualHeaderHeight = Math.max(actualHeaderHeight, (lines.length * (boldFont.heightAtSize(size) + 2)) + (2 * cellPadding));
        }

        if (currentY - actualHeaderHeight < margin) { // Page break before header if not enough space
            page = pdfDoc.addPage();
            currentY = height - margin;
        }

        let xPointer = columnStart;
        for (let i = 0; i < headers.length; i++) {
            const colWidth = columnWidths[i];

            // Draw cell background
            page.drawRectangle({
                x: xPointer,
                y: currentY - actualHeaderHeight,
                width: colWidth,
                height: actualHeaderHeight,
                color: fillColor,
                borderColor: borderColor,
                borderWidth: borderWidth
            });

            // Draw text within cell, vertically centered
            let textY = currentY - cellPadding - boldFont.heightAtSize(size); // Top padding for text
            for (const line of wrappedHeaderTexts[i]) {
                page.drawText(line, { x: xPointer + cellPadding, y: textY, font: boldFont, size, color });
                textY -= (boldFont.heightAtSize(size) + 2);
            }

            xPointer += colWidth;
        }
        currentY -= actualHeaderHeight; // Move Y down by actual header height
        if (afterSpacing > 0) {
            advanceY(afterSpacing);
        }
    };

    // Helper to draw a table data row
    const drawTableRow = (rowData, columnWidths, columnStart, options = {}) => {
        const { size = defaultFontSize, color = rgb(0, 0, 0), fillColor = rgb(1, 1, 1), borderColor = rgb(0, 0, 0), borderWidth = 0.5, afterSpacing = 0 } = options;
        
        let xPointer = columnStart;
        const cellPadding = 5;
        const minRowHeight = 20; // Minimum height for a row

        // Calculate actual row height based on wrapped text in cells
        let actualRowHeight = minRowHeight;
        const wrappedTextsInCells = []; // Renamed to avoid confusion with internal 'lines' array

        for (let i = 0; i < rowData.length; i++) {
            const text = rowData[i];
            const colWidth = columnWidths[i];
            // Use the new helper function
            const lines = splitTextIntoLines(text, font, size, colWidth - (2 * cellPadding));
            wrappedTextsInCells.push(lines);
            actualRowHeight = Math.max(actualRowHeight, (lines.length * (font.heightAtSize(size) + 2)) + (2 * cellPadding));
        }

        if (currentY - actualRowHeight < margin) { // Page break if not enough space for the whole row
            page = pdfDoc.addPage();
            currentY = height - margin;
        }

        // Draw cells and text
        xPointer = columnStart; // Reset xPointer for drawing
        for (let i = 0; i < rowData.length; i++) {
            const text = rowData[i];
            const colWidth = columnWidths[i];

            // Draw cell background and border
            page.drawRectangle({
                x: xPointer,
                y: currentY - actualRowHeight,
                width: colWidth,
                height: actualRowHeight,
                color: fillColor,
                borderColor: borderColor,
                borderWidth: borderWidth
            });

            // Draw text within cell
            let textY = currentY - cellPadding - font.heightAtSize(size); // Top padding for text
            for (const line of wrappedTextsInCells[i]) { // Use the renamed array
                page.drawText(line, { x: xPointer + cellPadding, y: textY, font, size, color });
                textY -= (font.heightAtSize(size) + 2);
            }
            xPointer += colWidth;
        }
        currentY -= actualRowHeight; // Move Y down by actual row height
        if (afterSpacing > 0) {
            advanceY(afterSpacing);
        }
    };

    // Title
    drawTextAndAdvance('Student Activity Report', { size: titleFontSize, isBold: true, color: rgb(0, 0.53, 0.71), afterSpacing: sectionSpacing });

    // Student Details Section
    drawTextAndAdvance('Student Details:', { size: headerFontSize, isBold: true });
    drawTextAndAdvance(`Name: ${studentDetails.fullName}`, { size: defaultFontSize });
    drawTextAndAdvance(`Student ID: ${studentDetails.studentId}`, { size: defaultFontSize });
    drawTextAndAdvance(`Department: ${studentDetails.department}`, { size: defaultFontSize });
    drawTextAndAdvance(`Year: ${studentDetails.year}`, { size: defaultFontSize, afterSpacing: sectionSpacing });

    // Report Period
    drawTextAndAdvance(`Report Period: ${startDate || 'N/A'} to ${endDate || 'N/A'}`, { size: defaultFontSize, afterSpacing: sectionSpacing });

    // Approved Special Passes Section
    drawTextAndAdvance('Approved Special Passes:', { size: headerFontSize, isBold: true });
    if (reportData.specialPasses && reportData.specialPasses.length > 0) {
        const specialPassHeaders = ['Pass Type', 'Reason', 'Approved By', 'Approved At', 'Status'];
        const totalSpecialPassRatio = 0.15 + 0.30 + 0.20 + 0.20 + 0.10; // 0.95
        const specialPassColWidths = [
            usableWidth * (0.15 / totalSpecialPassRatio),
            usableWidth * (0.30 / totalSpecialPassRatio),
            usableWidth * (0.20 / totalSpecialPassRatio),
            usableWidth * (0.20 / totalSpecialPassRatio),
            usableWidth * (0.10 / totalSpecialPassRatio)
        ]; // Proportional widths to usableWidth
        const tableStart = margin;

        drawTableHeader(specialPassHeaders, specialPassColWidths, tableStart);

        for (const pass of reportData.specialPasses) {
            const rowData = [
                pass.pass_type || 'N/A',
                pass.request_reason || 'N/A',
                pass.hod_approver_id?.fullName || 'N/A',
                new Date(pass.approved_at).toLocaleString() || 'N/A',
                pass.status || 'N/A'
            ];
            drawTableRow(rowData, specialPassColWidths, tableStart);
        }
        advanceY(sectionSpacing); // Add spacing after the table
    } else {
        drawTextAndAdvance('No approved special passes found for the selected period.', { size: defaultFontSize, afterSpacing: sectionSpacing });
    }

    // Late Entries Section
    drawTextAndAdvance('Late Entries:', { size: headerFontSize, isBold: true });
    if (reportData.lateEntries && reportData.lateEntries.length > 0) {
        const lateEntryHeaders = ['Date', 'Reason', 'Status', 'Faculty', 'HOD'];
        const totalLateEntryRatio = 0.15 + 0.30 + 0.15 + 0.20 + 0.15; // 0.95
        const lateEntryColWidths = [
            usableWidth * (0.15 / totalLateEntryRatio),
            usableWidth * (0.30 / totalLateEntryRatio),
            usableWidth * (0.15 / totalLateEntryRatio),
            usableWidth * (0.20 / totalLateEntryRatio),
            usableWidth * (0.15 / totalLateEntryRatio)
        ];
        const tableStart = margin;

        drawTableHeader(lateEntryHeaders, lateEntryColWidths, tableStart);

        for (const entry of reportData.lateEntries) {
            const rowData = [
                new Date(entry.date).toLocaleDateString() || 'N/A',
                entry.reason || 'N/A',
                entry.status || 'N/A',
                entry.facultyId?.fullName || 'N/A',
                entry.HODId?.fullName || 'N/A'
            ];
            drawTableRow(rowData, lateEntryColWidths, tableStart);
        }
        advanceY(sectionSpacing); // Add spacing after the table
    } else {
        drawTextAndAdvance('No late entries found for the selected period.', { size: defaultFontSize, afterSpacing: sectionSpacing });
    }

    // Gate Passes Section
    drawTextAndAdvance('Gate Passes:', { size: headerFontSize, isBold: true });
    if (reportData.gatePasses && reportData.gatePasses.length > 0) {
        const gatePassHeaders = ['Destination', 'Reason', 'Faculty', 'HOD', 'From', 'To'];
        const totalGatePassRatio = 0.15 + 0.25 + 0.15 + 0.15 + 0.15 + 0.15; // 1.00
        const gatePassColWidths = [
            usableWidth * (0.15 / totalGatePassRatio),
            usableWidth * (0.25 / totalGatePassRatio),
            usableWidth * (0.15 / totalGatePassRatio),
            usableWidth * (0.15 / totalGatePassRatio),
            usableWidth * (0.15 / totalGatePassRatio),
            usableWidth * (0.15 / totalGatePassRatio)
        ];
        const tableStart = margin;

        drawTableHeader(gatePassHeaders, gatePassColWidths, tableStart);

        for (const pass of reportData.gatePasses) {
            const rowData = [
                pass.destination || 'N/A',
                pass.reason || 'N/A',
                pass.faculty_approver_id?.fullName || 'N/A',
                pass.hod_approver_id?.fullName || 'N/A',
                new Date(pass.date_valid_from).toLocaleString() || 'N/A',
                new Date(pass.date_valid_to).toLocaleString() || 'N/A'
            ];
            drawTableRow(rowData, gatePassColWidths, tableStart);
        }
        advanceY(sectionSpacing); // Add spacing after the table
    } else {
        drawTextAndAdvance('No gate passes found for the selected period.', { size: defaultFontSize, afterSpacing: sectionSpacing });
    }


    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(PDF_PATH, pdfBytes);
    return PDF_PATH;
}

/**
 * @function generateLibraryPassPDF
 * @description Generates a PDF for the Digital Library Card.
 * @param {object} passData - The populated library pass data.
 * @returns {Promise<object>} - { success: true, filePath: string }
 */
async function generateLibraryPassPDF(passData) {
    const uploadDir = path.join(__dirname, '..', 'generated_pdfs');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    const PDF_PATH = path.join(uploadDir, `library_card_${passData._id}.pdf`);

    const pdfDoc = await PDFDocument.create();
    // Create a small card-sized page (approx 3.375 x 2.125 inches -> 243 x 153 points)
    // We'll make it slightly larger for better readability: 300 x 180
    const page = pdfDoc.addPage([300, 180]); 
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Background
    page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.95, 0.97, 1) });

    // Header Strip
    page.drawRectangle({ x: 0, y: height - 40, width, height: 40, color: rgb(0.1, 0.14, 0.49) });
    page.drawText('DIGITAL LIBRARY PASS', { x: 20, y: height - 25, font: boldFont, size: 14, color: rgb(1, 1, 1) });
    page.drawText('GEN-C CAMPUS LIBRARY', { x: 20, y: height - 38, font, size: 8, color: rgb(0.8, 0.8, 0.8) });

    // User Info
    const requester = passData.requester || {};
    
    // Embed Profile Picture
    let photoPath = requester.profilePictureUrl || requester.profilePhoto;
    if (photoPath) {
        try {
            // Normalize path: remove leading slash if present to make it relative to root for path.join
            // Assuming uploads are stored in 'uploads/' at the project root
            // If path is like 'uploads/file.jpg' or '/uploads/file.jpg'
            let relativePath = photoPath.startsWith('/') || photoPath.startsWith('\\') ? photoPath.slice(1) : photoPath;
            // Remove 'server' or 'src' prefix if present to avoid incorrect path resolution
            relativePath = relativePath.replace(/^(server|src)[\\/]/, '');
            const fullPath = path.join(__dirname, '..', relativePath);

            if (fs.existsSync(fullPath)) {
                const imageBytes = fs.readFileSync(fullPath);
                // Simple check for extension, ideally use file signature
                const isPng = fullPath.toLowerCase().endsWith('.png');
                const profileImage = isPng ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);
                
                // Draw image on the right side
                page.drawImage(profileImage, { x: width - 80, y: height - 90, width: 60, height: 60 });
            }
        } catch (err) {
            console.error('Error embedding profile picture in PDF:', err);
        }
    }

    page.drawText(requester.fullName || 'N/A', { x: 20, y: height - 70, font: boldFont, size: 16, color: rgb(0, 0, 0) });
    page.drawText(`${passData.requesterModel} | ${requester.department || 'N/A'}`, { x: 20, y: height - 85, font, size: 10, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(`ID: ${requester.studentId || requester.employeeId || 'N/A'}`, { x: 20, y: height - 100, font: boldFont, size: 10, color: rgb(0, 0, 0) });

    // Footer / Approved By
    page.drawText(`Approved By: ${passData.approvedBy?.fullName || 'Librarian Staff'}`, { x: 20, y: 20, font, size: 8, color: rgb(0.5, 0.5, 0.5) });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(PDF_PATH, pdfBytes);
    return { success: true, filePath: PDF_PATH };
}

module.exports = { generateWatermarkedPDF, generateStudentActivityReportPDF, generateLibraryPassPDF };