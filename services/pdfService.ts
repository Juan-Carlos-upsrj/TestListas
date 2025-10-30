import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Group, ReportData } from '../types';
import PdfTemplate from '../components/PdfTemplate';
import { getImageAsBase64 } from './imageUtils';

export const exportReportToPDF = async (group: Group, reportData: ReportData[]) => {
  // First, get the logo as a Base64 string to ensure it renders correctly
  const logoBase64 = await getImageAsBase64('/logo.png');

  // Create a temporary container for our template
  const templateContainer = document.createElement('div');
  templateContainer.style.position = 'absolute';
  templateContainer.style.left = '-9999px'; // Position off-screen
  document.body.appendChild(templateContainer);

  // Render the React component into the container
  const root = ReactDOM.createRoot(templateContainer);
  
  // Use a promise to wait for the component to render
  await new Promise<void>((resolve) => {
    const onRender = (el: HTMLDivElement | null) => {
      if (el) {
        resolve();
      }
    };

    root.render(
      React.createElement(
        React.StrictMode,
        null,
        React.createElement(PdfTemplate, { group, reportData, logoBase64, ref: onRender })
      )
    );
  });
  
  // A brief timeout can help ensure all styles and images are loaded
  await new Promise(resolve => setTimeout(resolve, 100));

  const canvas = await html2canvas(templateContainer, {
    scale: 2, // Higher scale for better quality
    useCORS: true, 
  });

  // Clean up the temporary container
  root.unmount();
  document.body.removeChild(templateContainer);

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const ratio = canvasWidth / canvasHeight;

  let imgWidth = pdfWidth;
  let imgHeight = imgWidth / ratio;
  
  // If the image is too tall for the page, scale it down.
  if (imgHeight > pdfHeight) {
      imgHeight = pdfHeight;
      imgWidth = imgHeight * ratio;
  }

  const x = (pdfWidth - imgWidth) / 2;
  const y = 0;

  pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
  pdf.save(`reporte_${group.name.replace(/\s/g, '_')}.pdf`);
};