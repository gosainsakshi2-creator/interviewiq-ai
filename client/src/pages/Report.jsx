import { motion } from "framer-motion";
import { Award, CheckCircle, AlertTriangle, Download, Home } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";

function Report() {
  const navigate = useNavigate();
const reportRef = useRef(null);

const downloadPDF = async () => {
  try {
    const response = await fetch(
      "http://localhost:5000/api/download-report",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          evaluations,
          overallScore,
          communicationScore,
          confidenceScore,
          relevanceScore,
          strengths,
          improvements,
          recommendation,
        }),
      }
    );

    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "InterviewIQ_Report.pdf";

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("PDF download failed:", error);
  }
};
  const [evaluations, setEvaluations] = useState([]);

  useEffect(() => {
    const savedEvaluations =
      JSON.parse(localStorage.getItem("interviewEvaluations")) || [];

    setEvaluations(savedEvaluations);
  }, []);

  const average = (key) => {
    if (!evaluations.length) return 0;

    const total = evaluations.reduce((sum, item) => {
      return sum + Number(item.evaluation?.[key] || 0);
    }, 0);

    return Math.round(total / evaluations.length);
  };

  const overallScore = average("score");
  const communicationScore = average("communication");
  const confidenceScore = average("confidence");
  const relevanceScore = average("relevance");

  const strengths = [];
  const improvements = [];

  if (communicationScore >= 70) strengths.push("Good communication clarity");
  else improvements.push("Improve communication clarity");

  if (confidenceScore >= 70) strengths.push("Confident speaking style");
  else improvements.push("Work on interview confidence");

  if (relevanceScore >= 70) strengths.push("Relevant and focused answers");
  else improvements.push("Keep answers more relevant to the question");

  if (overallScore >= 75) strengths.push("Strong overall interview performance");
  else improvements.push("Practice giving more complete and structured answers");

  const recommendation =
    overallScore >= 75
      ? "You performed well overall. Continue improving your answers by adding specific examples, project details, and measurable outcomes."
      : "You need more practice to make your answers stronger. Focus on clear structure, relevant examples, confidence, and explaining your projects in detail.";

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600 rounded-full blur-[150px] opacity-20"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-cyan-500 rounded-full blur-[150px] opacity-20"></div>

      <div ref={reportRef} className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold">
            Interview Performance <span className="text-cyan-400">Report</span>
          </h1>

          <p className="text-gray-400 mt-4">
            AI-generated analysis based on your resume interview session.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-5 mb-8">
          {[
            ["Overall Score", `${overallScore}/100`],
            ["Communication", `${communicationScore}%`],
            ["Relevance", `${relevanceScore}%`],
            ["Confidence", `${confidenceScore}%`],
          ].map(([title, value], index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center"
            >
              <p className="text-gray-400">{title}</p>
              <h2 className="text-3xl font-bold text-cyan-400 mt-3">
                {value}
              </h2>
            </motion.div>
          ))}
        </div>

        {evaluations.length === 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 rounded-2xl p-5 mb-8 text-center">
            No interview evaluation found. Please complete the interview first.
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-7">
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-5">
              <CheckCircle className="text-green-400" /> Strengths
            </h2>

            <ul className="space-y-3 text-gray-300">
              {strengths.map((item, index) => (
                <li key={index}>✅ {item}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-7">
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-5">
              <AlertTriangle className="text-yellow-400" /> Improvement Areas
            </h2>

            <ul className="space-y-3 text-gray-300">
              {improvements.map((item, index) => (
                <li key={index}>⚠ {item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 bg-white/5 border border-white/10 rounded-3xl p-7">
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-5">
            <Award className="text-cyan-400" /> AI Recommendation
          </h2>

          <p className="text-gray-300 leading-relaxed">{recommendation}</p>
        </div>

        {evaluations.length > 0 && (
          <div className="mt-6 bg-white/5 border border-white/10 rounded-3xl p-7">
            <h2 className="text-2xl font-bold mb-5">
              Question-wise AI Feedback
            </h2>

            <div className="space-y-5">
              {evaluations.map((item, index) => (
                <div
                  key={index}
                  className="bg-black/40 border border-white/10 rounded-2xl p-5"
                >
                  <p className="text-cyan-400 font-semibold mb-2">
                    Question {index + 1}: {item.question}
                  </p>

                  <p className="text-gray-300 mb-3">
                    <span className="font-semibold">Your Answer:</span>{" "}
                    {item.answer || "No answer captured"}
                  </p>

                  <p className="text-gray-300 mb-3">
                    <span className="font-semibold">Feedback:</span>{" "}
                    {item.evaluation?.feedback || "No feedback available"}
                  </p>

                  <p className="text-gray-300">
                    <span className="font-semibold">Improved Answer:</span>{" "}
                    {item.evaluation?.improvedAnswer ||
                      "No improved answer available"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 mt-8">
        <button
  onClick={downloadPDF}
  className="flex-1 py-4 rounded-2xl bg-cyan-500 text-black font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition"
>
  <Download size={22} /> Download Report
</button>
            

          <button
            onClick={() => navigate("/")}
            className="flex-1 py-4 rounded-2xl bg-white/10 font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition"
          >
            <Home size={22} /> Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default Report;