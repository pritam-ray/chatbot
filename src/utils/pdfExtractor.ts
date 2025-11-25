import * as pdfjsLib from 'pdfjs-dist';

let workerInitialized = false;

function initializePDFWorker() {
  if (!workerInitialized) {
    const pdfjsWorkerSrc = `//cdn.jsdelivr.net/npm/pdfjs-dist@${(pdfjsLib as any).version}/build/pdf.worker.min.js`;
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;
    workerInitialized = true;
  }
}

export async function extractTextFromPDF(file: File): Promise<string> {
  initializePDFWorker();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let text = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    text += pageText + '\n';
  }

  return text;
}

export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    return extractTextFromPDF(file);
  } else if (file.type.startsWith('text/')) {
    return file.text();
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return `[Word Document: ${file.name}]\nPlease paste the text content or convert to PDF for text extraction.`;
  } else {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
}
