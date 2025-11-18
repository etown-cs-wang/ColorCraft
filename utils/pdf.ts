import { jsPDF } from "jspdf";
import { ColoringPage } from "../types";

export const generatePDF = (childName: string, pages: ColoringPage[]) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // 1. Cover Page
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, width, height, "F");

  // Decorative Border
  doc.setDrawColor(59, 130, 246); // Blue-500
  doc.setLineWidth(2);
  doc.rect(10, 10, width - 20, height - 20, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(37, 99, 235); // Blue-600
  doc.text(`${childName}'s`, width / 2, height / 3, { align: "center" });
  
  doc.setFontSize(24);
  doc.setTextColor(236, 72, 153); // Pink-500
  doc.text("Coloring Book", width / 2, height / 3 + 15, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text("Created with ColorCraft AI", width / 2, height - 30, { align: "center" });

  // 2. Content Pages
  pages.forEach((page, index) => {
    if (page.imageUrl) {
      doc.addPage();
      
      // Page Number
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(`Page ${index + 1}`, width - 20, height - 10, { align: "right" });

      // Image
      // A4 is 210 x 297 mm. 
      // We want margins. 
      const margin = 20;
      const imgWidth = width - (margin * 2);
      const imgHeight = height - (margin * 2) - 20; // Leave space for caption if we wanted

      // Fit image nicely
      doc.addImage(page.imageUrl, "PNG", margin, margin, imgWidth, imgHeight, undefined, 'FAST');
    }
  });

  doc.save(`${childName}_coloring_book.pdf`);
};