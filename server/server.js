const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
const Groq = require("groq-sdk");
const PDFDocument = require("pdfkit");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.get("/", (req, res) => {
  res.send("InterviewIQ AI Backend with Groq is running 🚀");
});

function safeJsonParse(text) {
  try {
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.log("Raw AI Response:", text);
    throw new Error("AI response was not valid JSON");
  }
}

async function extractResumeText(file) {
  if (file.mimetype === "application/pdf") {
    const buffer = fs.readFileSync(file.path);
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (
    file.mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const data = await mammoth.extractRawText({ path: file.path });
    return data.value;
  }

  throw new Error("Only PDF and DOCX files are allowed");
}

async function analyzeResumeWithGroq(resumeText) {
  const prompt = `
Analyze this resume professionally.

Do not calculate ATS score.
Do not mention ATS score.

Return ONLY raw valid JSON.
No markdown.
No triple backticks.

JSON format:
{
  "summary": "",
  "overallFeedback": "",
  "skills": [],
  "strengths": [],
  "weaknesses": [],
  "improvements": [],
  "missingKeywords": [],
  "suggestedRoles": [],
  "improvedResume": {
    "professionalHeadline": "",
    "professionalSummary": "",
    "skills": [],
    "projects": [],
    "finalResumeText": ""
  }
}

Resume:
${resumeText}
`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are a professional resume analyst and career coach. Give practical, personalized, realistic resume feedback. Return only raw valid JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
  });

  return safeJsonParse(completion.choices[0].message.content);
}

app.post("/api/upload-resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No resume uploaded",
      });
    }

    const resumeText = await extractResumeText(req.file);
    const analysis = await analyzeResumeWithGroq(resumeText);

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: "Resume analyzed successfully",
      resumeText,
      analysis,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error("Resume upload error:", error.message);

    res.status(500).json({
      success: false,
      message: "Resume analysis failed",
      error: error.message,
    });
  }
});

app.post("/api/generate-questions", async (req, res) => {
  try {
    const { resumeText } = req.body;

    if (!resumeText) {
      return res.status(400).json({
        success: false,
        message: "Resume text is required",
      });
    }

    const prompt = `
Generate exactly 5 personalized interview questions based on this resume.

Return ONLY raw valid JSON. No markdown. No triple backticks.

JSON format:
{
  "questions": [
    {
      "id": 1,
      "question": "",
      "type": "Resume Based"
    }
  ]
}

Rules:
- Generate exactly 5 questions.
- Mix HR, technical, project-based, and resume-based questions.
- Keep questions suitable for a fresher candidate.
- Make questions personalized according to skills and projects in resume.

Resume:
${resumeText}
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a professional AI interviewer. Return only raw valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.4,
    });

    const data = safeJsonParse(completion.choices[0].message.content);

    res.json({
      success: true,
      questions: (data.questions || []).slice(0, 5),
    });
  } catch (error) {
    console.error("Question generation error:", error.message);

    res.status(500).json({
      success: false,
      message: "Question generation failed",
      error: error.message,
    });
  }
});

app.post("/api/evaluate-answer", async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: "Question and answer are required",
      });
    }

    const prompt = `
You are evaluating a candidate's interview answer like a professional AI interviewer.

Important scoring rules:
- All scores must be from 0 to 100.
- Do NOT use 0 to 10 scoring.
- Average decent answers should usually score between 60 and 80.
- Good structured answers should score between 75 and 90.
- Only very poor or missing answers should score below 40.
- Do not be overly harsh for minor grammar or speech-to-text mistakes.

Evaluate based on:
1. Relevance to the question
2. Technical correctness
3. Communication clarity
4. Confidence and structure
5. Completeness of the answer

Return ONLY raw valid JSON. No markdown. No triple backticks.

JSON format:
{
  "score": 0,
  "communication": 0,
  "confidence": 0,
  "relevance": 0,
  "feedback": "",
  "improvedAnswer": ""
}

Question:
${question}

Candidate Answer:
${answer}
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a professional interview evaluator. Return only raw valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    const evaluation = safeJsonParse(completion.choices[0].message.content);
evaluation.score = Number(evaluation.score || 0);
evaluation.communication = Number(evaluation.communication || 0);
evaluation.confidence = Number(evaluation.confidence || 0);
evaluation.relevance = Number(evaluation.relevance || 0);

if (evaluation.score <= 10) evaluation.score *= 10;
if (evaluation.communication <= 10) evaluation.communication *= 10;
if (evaluation.confidence <= 10) evaluation.confidence *= 10;
if (evaluation.relevance <= 10) evaluation.relevance *= 10;
    res.json({
      success: true,
      evaluation,
    });
  } catch (error) {
    console.error("Answer evaluation error:", error.message);

    res.status(500).json({
      success: false,
      message: "Answer evaluation failed",
      error: error.message,
    });
  }
});
app.post("/api/download-report", (req, res) => {
  try {
    const {
      evaluations,
      overallScore,
      communicationScore,
      confidenceScore,
      relevanceScore,
      strengths,
      improvements,
      recommendation,
    } = req.body;

    const doc = new PDFDocument({ margin: 45, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=InterviewIQ_Report.pdf"
    );

    doc.pipe(res);

    const primary = "#1F2937";
    const muted = "#6B7280";
    const accent = "#2563EB";
    const border = "#E5E7EB";

   const sectionTitle = (title) => {
  doc.moveDown(0.6);

  doc
    .fillColor(primary)
    .fontSize(15)
    .font("Helvetica-Bold")
    .text(title, 45, doc.y, {
      align: "left",
    });

  doc.moveDown(0.25);

  doc
    .moveTo(45, doc.y)
    .lineTo(550, doc.y)
    .strokeColor(border)
    .stroke();

  doc.moveDown(0.35);
};
    const bulletList = (items, emptyText) => {
  if (!items || items.length === 0) {
    doc.fillColor(muted).fontSize(10).font("Helvetica").text(emptyText, 45);
    return;
  }

  items.forEach((item) => {
    doc
      .fillColor(primary)
      .fontSize(10.5)
      .font("Helvetica")
      .text(`• ${item}`, 45, doc.y, {
        align: "left",
        width: 480,
      });
  });
};

    // Header
    doc
      .fillColor(accent)
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("InterviewIQ AI Report", { align: "center" });

    doc
      .fillColor(muted)
      .fontSize(10)
      .font("Helvetica")
      .text("AI-generated interview performance analysis", {
        align: "center",
      });

    doc.moveDown(1.2);

    // Summary box
    const boxY = doc.y;
    doc
      .roundedRect(45, boxY, 505, 85, 8)
      .strokeColor(border)
      .stroke();

    doc
      .fillColor(primary)
      .fontSize(13)
      .font("Helvetica-Bold")
      .text("Performance Summary", 60, boxY + 15);

    doc
      .fillColor(accent)
      .fontSize(24)
      .font("Helvetica-Bold")
      .text(`${overallScore}/100`, 60, boxY + 40);

    doc
      .fillColor(muted)
      .fontSize(9)
      .font("Helvetica")
      .text("Overall Score", 60, boxY + 67);

    doc
      .fillColor(primary)
      .fontSize(11)
      .font("Helvetica")
      .text(`Communication: ${communicationScore}%`, 190, boxY + 42)
      .text(`Relevance: ${relevanceScore}%`, 330, boxY + 42)
      .text(`Confidence: ${confidenceScore}%`, 190, boxY + 62);

    doc.y = boxY + 88;

    // Strengths
    sectionTitle("Strengths");
    bulletList(strengths, "No strengths available.");

    // Improvements
    sectionTitle("Improvement Areas");
    bulletList(improvements, "No improvement areas available.");

    // Recommendation
    sectionTitle("AI Recommendation");
    doc.moveDown(0.25);
    doc
      .fillColor(primary)
      .fontSize(10.5)
      .font("Helvetica")
      .text(recommendation || "No recommendation available.", 45, doc.y, {
  width: 480,
  align: "left",
  lineGap: 2,
});
doc.addPage();
    // Question feedback
    sectionTitle("Question-wise Feedback");

    evaluations?.forEach((item, index) => {
      if (doc.y > 600) doc.addPage();

      doc
        .fillColor(primary)
        .fontSize(11.5)
        .font("Helvetica-Bold")
        .text(`Question ${index + 1}: ${item.question}`, {
          lineGap: 2,
        });

      doc.moveDown(0.4);

      doc
        .fillColor(muted)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Your Answer:");

      doc
        .fillColor(primary)
        .fontSize(10)
        .font("Helvetica")
        .text(item.answer || "No answer captured", {
          lineGap: 2,
        });

      doc.moveDown(0.4);

      doc
        .fillColor(muted)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Feedback:");

      doc
        .fillColor(primary)
        .fontSize(10)
        .font("Helvetica")
        .text(item.evaluation?.feedback || "No feedback available", {
          lineGap: 2,
        });

      doc.moveDown(0.4);

      doc
        .fillColor(muted)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Improved Answer:");

      doc
        .fillColor(primary)
        .fontSize(10)
        .font("Helvetica")
        .text(
          item.evaluation?.improvedAnswer || "No improved answer available",
          { lineGap: 2 }
        );

      doc.moveDown(1);
      if (doc.y > 700) doc.addPage();

      doc
        .moveTo(45, doc.y)
        .lineTo(550, doc.y)
        .strokeColor(border)
        .stroke();

      doc.moveDown(0.8);
    });

    doc.end();
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({
      success: false,
      message: "PDF generation failed",
    });
  }
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});