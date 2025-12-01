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
async function generateWatermarkedPDF(passData, hodName, hodDepartment = 'N/A') {
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
            console.error('Error generating QR code for PDF:', err);
            // Proceeding without QR code
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
    // Corrected from passData.reason to passData.request_reason
    page.drawText(`Reason: ${passData.request_reason || 'N/A'}`, { x: 50, y: currentY, font, size: 12, color: rgb(0, 0, 0) });
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

    // 2. Apply Digital Watermark (Corrected)
    // Use the hodDepartment passed into the function, which comes from the HOD's own record.
    const approvedDate = passData.approved_at ? new Date(passData.approved_at).toLocaleDateString() : 'N/A';
    const watermarkText = `APPROVED BY: ${hodName.toUpperCase()} - DEPT: ${hodDepartment.toUpperCase()} - ${approvedDate}`; 

    page.drawText(watermarkText, {
        x: 50,
        y: currentY,
        font,
        size: 14, // Adjusted size
        color: rgb(0.5, 0.5, 0.5), // Darker gray for readability
        opacity: 0.5,
    });
    currentY -= (lineHeight * 2);

    // 3. Add QR Code and OTP at the bottom (Corrected)
    const bottomY = 150; // Position near the bottom

    if (qrDataUrl) {
        const qrImage = await pdfDoc.embedPng(qrDataUrl);
        page.drawImage(qrImage, { x: 50, y: bottomY, width: 100, height: 100 });
    } else {
        page.drawText('QR Scan Not Required', { x: 50, y: bottomY + 40, font, size: 10, color: rgb(0.5, 0.5, 0.5) });
    }

    if (passData.one_time_pin) {
        page.drawText(`OTP: ${passData.one_time_pin}`, { x: 200, y: bottomY + 40, font, size: 16, color: rgb(0, 0, 0) });
    } else {
        page.drawText('OTP: N/A', { x: 200, y: bottomY + 40, font, size: 12, color: rgb(0.5, 0.5, 0.5) });
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

module.exports = { generateWatermarkedPDF, generateStudentActivityReportPDF };