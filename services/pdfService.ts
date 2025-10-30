import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Group, ReportData, Evaluation, GroupReportSummary } from '../types';
import PdfTemplate from '../components/PdfTemplate';
import { getImageAsBase64 } from './imageUtils';

export const exportReportToPDF = async (group: Group, reportData: ReportData[], evaluations: Evaluation[], groupSummary: GroupReportSummary) => {
  const logoBase64 = await getImageAsBase64('/logo.png');

  const templateContainer = document.createElement('div');
  templateContainer.style.position = 'absolute';
  templateContainer.style.left = '-9999px';
  document.body.appendChild(templateContainer);

  const root = ReactDOM.createRoot(templateContainer);
  
  await new Promise<void>((resolve) => {
    root.render(
      React.createElement(
        React.StrictMode,
        null,
        React.createElement(PdfTemplate, { group, reportData, logoBase64, evaluations, groupSummary, ref: (el) => { if (el) resolve(); } })
      )
    );
  });
  
  await new Promise(resolve => setTimeout(resolve, 500));

  const canvas = await html2canvas(templateContainer, {
    scale: 2,
    useCORS: true,
  });

  root.unmount();
  document.body.removeChild(templateContainer);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const ratio = pdfWidth / canvasWidth;
  const canvasHeightInPdf = canvasHeight * ratio;
  const totalPages = Math.ceil(canvasHeightInPdf / pdfHeight);

  for (let i = 0; i < totalPages; i++) {
    if (i > 0) {
      pdf.addPage();
    }
    
    const pageCanvas = document.createElement('canvas');
    const pageCtx = pageCanvas.getContext('2d');
    if (!pageCtx) continue;

    const sliceHeightOnCanvas = pdfHeight / ratio;
    
    pageCanvas.width = canvasWidth;
    pageCanvas.height = sliceHeightOnCanvas;
    
    const srcY = i * sliceHeightOnCanvas;
    
    pageCtx.drawImage(canvas, 0, srcY, canvasWidth, sliceHeightOnCanvas, 0, 0, canvasWidth, sliceHeightOnCanvas);
    
    const pageDataUrl = pageCanvas.toDataURL('image/png');
    
    pdf.addImage(pageDataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
  }

  pdf.save(`reporte_${group.name.replace(/\s/g, '_')}.pdf`);
};