import * as pdfjsLib from 'pdfjs-dist';

let workerInitialized = false;

function initializePDFWorker() {
  if (!workerInitialized) {
    // Use the worker from a CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    workerInitialized = true;
  }
}

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    initializePDFWorker();

    const arrayBuffer = await file.arrayBuffer();
    
    console.log('Loading PDF document...');
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    console.log(`PDF loaded. Total pages: ${pdf.numPages}`);

    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i}/${pdf.numPages}`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Extract text with better spacing
      const pageText = textContent.items
        .map((item: any) => {
          // Check if item has str property
          if (item.str) {
            return item.str;
          }
          return '';
        })
        .filter((str: string) => str.trim().length > 0)
        .join(' ');
      
      text += pageText + '\n\n';
    }

    console.log(`Extraction complete. Total characters: ${text.length}`);
    return text.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function extractTextFromFile(file: File): Promise<string> {
  console.log('Extracting text from file:', file.name, 'Type:', file.type, 'Size:', file.size);
  
  // Check if it's a PDF by file extension if MIME type is not set correctly
  const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  
  if (isPDF) {
    return extractTextFromPDF(file);
  } else if (file.type.startsWith('text/') || 
             file.name.endsWith('.txt') || 
             file.name.endsWith('.md')) {
    const text = await file.text();
    console.log('Text file extracted:', text.length, 'characters');
    return text;
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
             file.name.endsWith('.docx')) {
    return `[Word Document: ${file.name}]\nWord document text extraction is not yet supported. Please convert to PDF or paste the text content.`;
  } else {
    throw new Error(`Unsupported file type: ${file.type || 'unknown'} for file: ${file.name}`);
  }
}
