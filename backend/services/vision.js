import OpenAI from "openai";
import fs from "fs/promises";
import { fromPath } from "pdf2pic";
import sharp from "sharp";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function processWithGPT4Vision(filePath, outputDir) {
  const mimeType = await getMimeType(filePath);

  if (mimeType === "application/pdf") {
    return await processPDF(filePath, outputDir);
  } else if (mimeType.startsWith("image/")) {
    return await processImage(filePath, outputDir);
  } else {
    throw new Error("Unsupported file type");
  }
}

async function getMimeType(filePath) {
  const header = await fs.readFile(filePath, { length: 4 });
  const hex = header.toString("hex");
  if (hex.startsWith("25504446")) return "application/pdf";
  const meta = await sharp(filePath).metadata();
  if (meta.format) return `image/${meta.format}`;
  throw new Error("Unsupported file type");
}

async function processPDF(filePath, outputDir) {
  // Create images directory inside the output directory
  const imagesDir = path.join(outputDir, "pages");
  await fs.mkdir(imagesDir, { recursive: true });

  const converter = fromPath(filePath, {
    density: 300,
    saveFilename: "page",
    savePath: imagesDir, // specify save path here
    format: "jpeg",
    width: 1500,
    height: 2000,
  });

  const totalPages = await getPdfPageCount(filePath);
  let extractedText = "";

  for (let i = 1; i <= totalPages; i++) {
    try {
      // Convert PDF page to image and save it
      const { path: imagePath } = await converter(i, { responseType: "image" });

      // Read the saved image
      const imageBuffer = await fs.readFile(imagePath);
      const pageText = await extractTextFromBuffer(imageBuffer);
      extractedText += `\n--- Page ${i} ---\n${pageText}\n`;

      // Images are now saved permanently; do NOT delete image files here
    } catch (error) {
      console.error(`Error processing page ${i}:`, error);
      throw new Error(`Failed processing page ${i}: ${error.message}`);
    }
  }

  return extractedText.trim();
}

async function processImage(filePath, outputDir) {
  const imagesDir = path.join(outputDir, "images");
  await fs.mkdir(imagesDir, { recursive: true });

  const imageName = path.basename(filePath, path.extname(filePath)) + ".jpeg";
  const savedImagePath = path.join(imagesDir, imageName);

  const imageBuffer = await sharp(filePath)
    .resize(1500, null, { withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toBuffer();

  // Save the image
  await fs.writeFile(savedImagePath, imageBuffer);

  return await extractTextFromBuffer(imageBuffer);
}

async function extractTextFromBuffer(imageBuffer) {
  const base64Image = imageBuffer.toString("base64");

  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract all screenplay/script text from this image accurately, preserving formatting.",
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
}

async function getPdfPageCount(filePath) {
  const pdfData = await fs.readFile(filePath);
  const match = pdfData.toString().match(/\/Type\s*\/Page\b/g);
  return match ? match.length : 1;
}
