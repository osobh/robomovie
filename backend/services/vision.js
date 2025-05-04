import OpenAI from "openai";
import fs from "fs/promises";
import { fromPath } from "pdf2pic";
import sharp from "sharp";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function processWithGPT4Vision(filePath, outputDir, onProgress) {
  try {
    const mimeType = await getMimeType(filePath);

    if (mimeType === "application/pdf") {
      return await processPDF(filePath, outputDir, onProgress);
    } else if (mimeType.startsWith("image/")) {
      return await processImage(filePath, outputDir, onProgress);
    } else {
      throw new Error("Unsupported file type");
    }
  } catch (error) {
    throw new Error(`File processing failed: ${error.message}`);
  }
}

async function getMimeType(filePath) {
  try {
    const header = await fs.readFile(filePath, { length: 4 });
    const hex = header.toString("hex");
    if (hex.startsWith("25504446")) return "application/pdf";
    const meta = await sharp(filePath).metadata();
    if (meta.format) return `image/${meta.format}`;
    throw new Error("Unsupported file type");
  } catch (error) {
    throw new Error(`File type detection failed: ${error.message}`);
  }
}

async function processPDF(filePath, outputDir, onProgress) {
  try {
    onProgress?.({
      stage: "Analyzing document",
      progress: 5,
      details: "Initial setup",
    });

    const pagesDir = path.join(outputDir, "pages");
    await fs.mkdir(pagesDir, { recursive: true }).catch((error) => {
      throw new Error(`Directory creation failed: ${error.message}`);
    });

    onProgress?.({
      stage: "Counting pages",
      progress: 10,
      details: "Counting pages in PDF",
    });

    const pageCount = await getPdfPageCount(filePath);
    let extractedText = "";

    for (let i = 1; i <= pageCount; i++) {
      const progressConversion = 10 + Math.round((i / pageCount) * 40);
      const progressExtraction = 50 + Math.round((i / pageCount) * 50);

      const imagePath = path.join(pagesDir, `page-${i}.jpeg`);

      try {
        onProgress?.({
          stage: "Converting PDF pages",
          currentPage: i,
          totalPages: pageCount,
          progress: progressConversion,
          details: `Converting page ${i} of ${pageCount}`,
        });

        const { path: savedImagePath } = await fromPath(filePath, {
          density: 300,
          saveFilename: `page-${i}`,
          savePath: pagesDir,
          format: "jpeg",
          width: 1500,
          height: 2000,
        })(i, { responseType: "image" });

        onProgress?.({
          stage: "Extracting text",
          currentPage: i,
          totalPages: pageCount,
          progress: progressExtraction,
          details: `Extracting text from page ${i} of ${pageCount}`,
        });

        const imageBuffer = await fs.readFile(savedImagePath);
        const pageText = await extractTextFromBuffer(imageBuffer);

        extractedText += `\n--- Page ${i} ---\n${pageText}\n`;
      } catch (error) {
        console.error(`Page processing error (page ${i}):`, error);
        throw new Error(`Page ${i} processing failed: ${error.message}`);
      }
    }

    return extractedText.trim();
  } catch (error) {
    console.error("PDF processing error:", error);
    throw new Error(`PDF processing failed: ${error.message}`);
  }
}

async function processImage(filePath, outputDir, onProgress) {
  try {
    onProgress?.({
      stage: "Processing image",
      progress: 25,
      details: "Optimizing image",
    });

    const imagesDir = path.join(outputDir, "images");
    await fs.mkdir(imagesDir, { recursive: true });

    const imageName = path.basename(filePath, path.extname(filePath)) + ".jpeg";
    const savedImagePath = path.join(imagesDir, imageName);

    const imageBuffer = await sharp(filePath)
      .resize(1500, null, { withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();

    await fs.writeFile(savedImagePath, imageBuffer);

    onProgress?.({
      stage: "Extracting text",
      progress: 75,
      details: "Analyzing image",
    });

    const text = await extractTextFromBuffer(imageBuffer);

    onProgress?.({
      stage: "Completing",
      progress: 100,
      details: "Text extraction complete",
    });

    return text;
  } catch (error) {
    console.error("Image processing error:", error);
    throw new Error(`Image processing failed: ${error.message}`);
  }
}

async function extractTextFromBuffer(imageBuffer) {
  try {
    const base64Image = imageBuffer.toString("base64");

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all screenplay/script text accurately, preserving formatting.",
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Image}` },
            },
          ],
        },
      ],
      max_tokens: 4096,
    });

    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("GPT-4 Vision extraction error:", error);
    throw new Error(`Text extraction failed: ${error.message}`);
  }
}

async function getPdfPageCount(filePath) {
  try {
    const pdfData = await fs.readFile(filePath);
    const match = pdfData.toString().match(/\/Type\s*\/Page\b/g);
    return match ? match.length : 1;
  } catch (error) {
    throw new Error(`PDF page counting failed: ${error.message}`);
  }
}
