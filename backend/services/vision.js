import OpenAI from "openai";
import { createReadStream } from "fs";
import { PDFDocument } from "pdf-lib";
import fs from "fs/promises";
import sharp from "sharp";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Process a file with GPT-4 Vision API
 * @param {string} filePath Path to the file to process
 * @returns {Promise<string>} Extracted text from the file
 */
export async function processWithGPT4Vision(filePath) {
  try {
    const mimeType = await getMimeType(filePath);

    if (mimeType === "application/pdf") {
      return await processPDF(filePath);
    } else if (mimeType.startsWith("image/")) {
      return await processImage(filePath);
    } else {
      throw new Error("Unsupported file type");
    }
  } catch (error) {
    console.error("Error in processWithGPT4Vision:", error);
    throw error;
  }
}

/**
 * Process a PDF file by extracting images from each page
 * @param {string} filePath Path to the PDF file
 * @returns {Promise<string>} Combined extracted text from all pages
 */
async function processPDF(filePath) {
  const pdfBytes = await fs.readFile(filePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();
  let extractedText = "";

  for (let i = 0; i < pageCount; i++) {
    // Convert PDF page to image
    const page = pdfDoc.getPages()[i];
    const { width, height } = page.getSize();

    // Save page as PNG using sharp
    const pageImage = await sharp(Buffer.from(await page.toPng()))
      .resize(1500, null, {
        // Resize to reasonable width while maintaining aspect ratio
        withoutEnlargement: true,
      })
      .toBuffer();

    // Process the page image with GPT-4 Vision
    const pageText = await extractTextFromImage(pageImage);
    extractedText += `\n--- Page ${i + 1} ---\n${pageText}\n`;
  }

  return extractedText.trim();
}

/**
 * Process an image file
 * @param {string} filePath Path to the image file
 * @returns {Promise<string>} Extracted text from the image
 */
async function processImage(filePath) {
  // Optimize image before sending to GPT-4 Vision
  const optimizedImage = await sharp(filePath)
    .resize(1500, null, {
      // Resize to reasonable width while maintaining aspect ratio
      withoutEnlargement: true,
    })
    .toBuffer();

  return await extractTextFromImage(optimizedImage);
}

/**
 * Extract text from an image using GPT-4 Vision API
 * @param {Buffer} imageBuffer Image buffer to process
 * @returns {Promise<string>} Extracted text from the image
 */
async function extractTextFromImage(imageBuffer) {
  try {
    const base64Image = imageBuffer.toString("base64");

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all screenplay/script text from the provided image clearly and accurately. Preserve formatting where possible (scene headings, actions, character dialogue, parentheticals).",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 4096,
    });

    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Error in extractTextFromImage:", error);
    throw new Error("Failed to extract text from image");
  }
}

/**
 * Get the MIME type of a file
 * @param {string} filePath Path to the file
 * @returns {Promise<string>} MIME type of the file
 */
async function getMimeType(filePath) {
  const fileInfo = await sharp(filePath).metadata();
  if (fileInfo.format) {
    return `image/${fileInfo.format}`;
  }

  // Check if it's a PDF by reading the first few bytes
  const buffer = await fs.readFile(filePath, { length: 4 });
  if (buffer.toString("hex").startsWith("25504446")) {
    return "application/pdf";
  }

  throw new Error("Unsupported file type");
}
