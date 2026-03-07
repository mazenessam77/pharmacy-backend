import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { matchMedicines } from './medicine-matcher.service';
import { logger } from '../utils/logger';

interface OCRResult {
  extractedText: string;
  extractedMeds: { name: string; confidence: number; matchedMedicineId?: string }[];
}

export const processPrescriptionImage = async (imageBuffer: Buffer): Promise<OCRResult> => {
  // Step 1: Preprocess image with Sharp
  const processedBuffer = await preprocessImage(imageBuffer);

  // Step 2: Run Tesseract OCR
  const extractedText = await runOCR(processedBuffer);

  // Step 3: Extract medicine names from text
  const rawNames = extractMedicineNames(extractedText);

  // Step 4: Match against medicine catalog
  const extractedMeds = await matchMedicines(rawNames);

  return { extractedText, extractedMeds };
};

async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF
      .grayscale()
      .normalize() // Increase contrast
      .sharpen()
      .resize(2000, null, { withoutEnlargement: true }) // Resize for ~300 DPI equivalent
      .png()
      .toBuffer();
  } catch (error) {
    logger.warn('Image preprocessing failed, using original:', error);
    return buffer;
  }
}

async function runOCR(imageBuffer: Buffer): Promise<string> {
  try {
    const { data } = await Tesseract.recognize(imageBuffer, 'eng', {
      logger: (info) => {
        if (info.status === 'recognizing text') {
          logger.debug(`OCR progress: ${Math.round(info.progress * 100)}%`);
        }
      },
    });
    return data.text;
  } catch (error) {
    logger.error('OCR processing failed:', error);
    throw new Error('Failed to process prescription image');
  }
}

function extractMedicineNames(text: string): string[] {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 2);

  const medicineNames: string[] = [];

  // Common patterns in prescriptions
  const rxPatterns = [
    /(?:Tab|Cap|Syp|Inj|Susp|Oint|Cream|Gel|Drop|Sol)\s*\.?\s*(.+?)(?:\d+\s*(?:mg|ml|g|mcg|iu)|$)/gi,
    /(?:Rx|℞)\s*:?\s*(.+)/gi,
    /^\d+[\.\)]\s*(.+?)(?:\s+\d+\s*(?:mg|ml|g|mcg|iu)|\s+x\s*\d+|$)/gim,
  ];

  for (const line of lines) {
    let matched = false;

    for (const pattern of rxPatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(line);
      if (match && match[1]) {
        const name = match[1].trim().replace(/[^\w\s.-]/g, '').trim();
        if (name.length >= 3) {
          medicineNames.push(name);
          matched = true;
          break;
        }
      }
    }

    // If no pattern matched, check if the line looks like a medicine name
    if (!matched) {
      const cleaned = line.replace(/[^\w\s.-]/g, '').trim();
      if (
        cleaned.length >= 3 &&
        cleaned.length <= 50 &&
        /[a-zA-Z]/.test(cleaned) &&
        !/^(dr|doctor|patient|name|date|age|address|diagnosis|sig|disp)/i.test(cleaned)
      ) {
        // Check for dose indicators that suggest this is a medicine line
        if (/\d+\s*(?:mg|ml|g|mcg|iu|tab|cap)/i.test(line)) {
          const medName = cleaned.replace(/\d+\s*(?:mg|ml|g|mcg|iu|tab|cap).*$/i, '').trim();
          if (medName.length >= 3) {
            medicineNames.push(medName);
          }
        }
      }
    }
  }

  // Deduplicate
  return [...new Set(medicineNames)];
}

export const processImageFromUrl = async (imageUrl: string): Promise<OCRResult> => {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error('Failed to download prescription image');
  const buffer = Buffer.from(await response.arrayBuffer());
  return processPrescriptionImage(buffer);
};
