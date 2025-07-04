

import { jsPDF } from 'jspdf';
import type { Report, City, Company, Dependency } from './types';

/**
 * Fetches a local image and converts it to a Base64 Data URL.
 * @param url The path to the local image (e.g., 'MacrisLogo.png').
 * @returns A promise that resolves with the data URL.
 */
async function getLocalImageAsDataUrl(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error(`Failed to fetch local image at ${url}:`, error);
        // Return a placeholder or empty string to prevent total failure
        return '';
    }
}


export async function generateReportPDF(
    report: Report,
    cities: City[],
    companies: Company[],
    dependencies: Dependency[],
    formatDate: (dateInput?: Date | string, includeTime?: boolean) => string
) {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;

    // --- PDF Generation Constants ---
    const margin = 15;
    const halfPage = pageWidth / 2;
    const contentWidth = pageWidth - (2 * margin);
    
    // Colors
    const primaryColor = '#1A237E'; // Dark blue
    const textColor = '#111111'; // Almost black
    const lightTextColor = '#555555';
    const borderColor = '#DDDDDD';

    // Fonts
    const mainTitleSize = 14;
    const subTitleSize = 10;
    const sectionTitleSize = 10;
    const fieldLabelSize = 8;
    const fieldValueSize = 9;

    let currentY = margin;

    // --- Helper Functions ---
    const addField = (label: string, value: string | undefined | null, x: number, y: number, maxWidth: number) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fieldLabelSize);
        doc.setTextColor(lightTextColor);
        doc.text(label, x, y);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fieldValueSize);
        doc.setTextColor(textColor);
        const textLines = doc.splitTextToSize(value || 'N/A', maxWidth);
        doc.text(textLines, x, y + 3);
        
        // Return height of this field
        return (textLines.length * 4) + 5;
    };
    
    // --- 1. Header ---
    try {
        const logoDataUrl = await getLocalImageAsDataUrl('MacrisLogo.png');
        if (logoDataUrl) {
            // Original dimensions: 1823x1440
            const aspectRatio = 1823 / 1440;
            const logoHeight = 15; // Fixed height in mm
            const logoWidth = logoHeight * aspectRatio; // Calculate width to maintain aspect ratio
            doc.addImage(logoDataUrl, 'PNG', margin, currentY, logoWidth, logoHeight);
        }
    } catch (e) {
        console.error("Could not load logo for PDF", e);
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(mainTitleSize);
    doc.setTextColor(primaryColor);
    doc.text('REPORTE DE SERVICIO TÉCNICO', pageWidth - margin, currentY + 5, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(subTitleSize);
    doc.setTextColor(lightTextColor);
    doc.text(`ID: ${report.id.substring(0, 13)}...`, pageWidth - margin, currentY + 11, { align: 'right' });
    
    currentY += 20;
    doc.setDrawColor(borderColor);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;

    // --- 2. Two-Column Layout (Info + Client) ---
    const col1X = margin;
    const col2X = halfPage + 5;
    const colWidth = halfPage - margin - 5;
    let col1Y = currentY;
    let col2Y = currentY;

    // Column 1
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(sectionTitleSize);
    doc.setTextColor(primaryColor);
    doc.text('CLIENTE Y UBICACIÓN', col1X, col1Y);
    col1Y += 5;
    const company = companies.find(c => c.id === report.companyId)?.name;
    const dependency = dependencies.find(d => d.id === report.dependencyId)?.name;
    const city = cities.find(c => c.id === report.cityId)?.name;

    col1Y += addField('Empresa:', company, col1X, col1Y, colWidth);
    col1Y += addField('Dependencia:', dependency, col1X, col1Y, colWidth);
    col1Y += addField('Ciudad:', city, col1X, col1Y, colWidth);

    // Column 2
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(sectionTitleSize);
    doc.setTextColor(primaryColor);
    doc.text('INFORMACIÓN DEL SERVICIO', col2X, col2Y);
    col2Y += 5;
    
    col2Y += addField('Fecha y Hora:', formatDate(report.timestamp), col2X, col2Y, colWidth);
    col2Y += addField('Tipo de Servicio:', report.serviceType === 'preventivo' ? 'Preventivo' : 'Correctivo', col2X, col2Y, colWidth);
    col2Y += addField('Técnico Responsable:', report.workerName, col2X, col2Y, colWidth);

    currentY = Math.max(col1Y, col2Y) + 5;
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;

    // --- 3. Equipment Details ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(sectionTitleSize);
    doc.setTextColor(primaryColor);
    doc.text('DETALLES DEL EQUIPO', margin, currentY);
    currentY += 5;

    let eqCol1Y = currentY;
    let eqCol2Y = currentY;
    
    eqCol1Y += addField('Modelo:', report.equipmentSnapshot.model, col1X, eqCol1Y, colWidth);
    eqCol1Y += addField('Marca:', report.equipmentSnapshot.brand, col1X, eqCol1Y, colWidth);
    eqCol1Y += addField('Tipo:', report.equipmentSnapshot.type, col1X, eqCol1Y, colWidth);

    eqCol2Y += addField('Capacidad:', report.equipmentSnapshot.capacity, col2X, eqCol2Y, colWidth);
    eqCol2Y += addField('Refrigerante:', report.equipmentSnapshot.refrigerant, col2X, eqCol2Y, colWidth);
    const eqId = report.equipmentSnapshot.id === 'MANUAL_NO_ID' ? 'N/A (Reporte Manual)' : report.equipmentSnapshot.id;
    eqCol2Y += addField('ID Original:', eqId.substring(0, 13) + (eqId.length > 13 ? '...' : ''), col2X, eqCol2Y, colWidth);
    
    currentY = Math.max(eqCol1Y, eqCol2Y) + 5;
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;
    
    // --- 4. Observations ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(sectionTitleSize);
    doc.setTextColor(primaryColor);
    doc.text('OBSERVACIONES', margin, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fieldValueSize);
    doc.setTextColor(textColor);
    const obsText = report.observations || 'Sin observaciones.';
    const obsLines = doc.splitTextToSize(obsText, contentWidth);
    const obsBoxHeight = (obsLines.length * 4) + 6;
    doc.setDrawColor(borderColor);
    doc.roundedRect(margin, currentY, contentWidth, obsBoxHeight, 2, 2, 'S');
    doc.text(obsLines, margin + 3, currentY + 5);
    currentY += obsBoxHeight + 10;

    // --- 5. Signature ---
    // Make sure there is enough space, otherwise add a new page (unlikely with this layout)
    if (currentY > pageHeight - 70) {
        doc.addPage();
        currentY = margin;
    }

    if (report.clientSignature) {
        try {
            const sigImgProps = doc.getImageProperties(report.clientSignature);
            const sigWidth = 60;
            const sigHeight = (sigImgProps.height * sigWidth) / sigImgProps.width;
            const sigX = pageWidth / 2 - (sigWidth / 2); // Center horizontally
            
            doc.addImage(report.clientSignature, 'PNG', sigX, currentY, sigWidth, sigHeight);
            currentY += sigHeight;
        } catch (e: any) {
            console.error("Error adding signature to PDF:", e.message || e);
            doc.text("Error al cargar firma.", pageWidth / 2, currentY + 15, { align: 'center' });
            currentY += 25;
        }
    } else {
         currentY += 25; // Add space if no signature image
    }

    doc.setDrawColor(textColor);
    doc.line(margin + 20, currentY, pageWidth - margin - 20, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fieldLabelSize);
    doc.setTextColor(lightTextColor);
    doc.text('Firma y Nombre del Cliente', pageWidth / 2, currentY, { align: 'center' });

    // --- 6. Footer ---
    const footerY = pageHeight - margin + 5;
    doc.setDrawColor(borderColor);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    doc.setFontSize(8);
    doc.setTextColor(lightTextColor);
    doc.text("Macris Ingeniería S.A.S - Reporte generado por la aplicación de mantenimiento.", pageWidth / 2, footerY + 5, { align: 'center' });
    doc.text(`Página 1 de 1`, pageWidth - margin, footerY + 5, { align: 'right' });


    // --- 7. Save PDF ---
    const filename = `Reporte_${company?.replace(/\s/g, '_') || 'General'}_${report.id.substring(0, 8)}.pdf`;
    
    // Generate the PDF as a Blob. This is more flexible than a data URI and is required for creating an object URL.
    const pdfBlob = doc.output('blob');

    // Create a temporary object URL for the blob. This is a robust way to handle file data in the browser.
    const url = URL.createObjectURL(pdfBlob);

    // The most reliable method for mobile, especially iOS, is to open the content in a new tab.
    // The user can then use the browser's native UI to save or share the PDF.
    // We attempt to open the blob URL in a new window/tab.
    const newWindow = window.open(url, '_blank');

    // Check if the window failed to open (due to popup blockers).
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // If opening a new tab fails, fall back to the traditional download link method.
        // This works well on most desktop browsers.
        console.log('Popup blocked, falling back to download link method.');
        const link = document.createElement('a');
        link.href = url;
        link.download = filename; // The 'download' attribute prompts the browser to save the file.
        link.style.display = 'none'; // The link doesn't need to be visible.
        document.body.appendChild(link);
        link.click();

        // Clean up by removing the link from the DOM.
        document.body.removeChild(link);
    }

    // IMPORTANT: We must not revoke the object URL immediately.
    // The new tab or the download process needs time to access the blob data.
    // A timeout provides a safe buffer. 5 seconds is very conservative.
    setTimeout(() => {
        window.URL.revokeObjectURL(url);
    }, 5000);
}