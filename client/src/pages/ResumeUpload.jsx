import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function ResumeUpload() {
  const navigate = useNavigate();

  const [questionLoading, setQuestionLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a resume first.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setLoading(true);
      setError("");
      setAnalysis(null);

      const res = await API.post("/upload-resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setAnalysis(res.data.analysis);
      setResumeText(res.data.resumeText || "");

      localStorage.setItem("resumeAnalysis", JSON.stringify(res.data.analysis));
      localStorage.setItem("resumeText", res.data.resumeText || "");
      localStorage.removeItem("interviewQuestions");
      localStorage.removeItem("interviewAnswers");
      localStorage.removeItem("interviewEvaluations");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Resume analysis failed."
      );
    } finally {
      setLoading(false);
    }
  };

const handleStartInterview = () => {
  localStorage.setItem("resumeText", resumeText);
  navigate("/environment-check");
};

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(0,188,212,0.12),transparent_30%),radial-gradient(circle_at_85%_80%,rgba(168,85,247,0.10),transparent_30%)]" />

      <div className="relative z-10 px-6 py-8">
        <div className="max-w-xl mx-auto mt-16 bg-[#080808] border border-white/15 rounded-3xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-center mb-3">
            Upload Your <span className="text-cyan-400">Resume</span>
          </h1>

          <p className="text-gray-400 text-center text-sm mb-8">
            Upload your resume and get AI-powered personalized insights.
          </p>

          <label
            htmlFor="resume"
            className="block cursor-pointer border-2 border-dashed border-white/20 hover:border-cyan-400/60 rounded-2xl p-10 text-center transition"
          >
            <input
              id="resume"
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files[0]);
                setError("");
              }}
            />

            {file ? (
              <>
                <p className="font-semibold text-cyan-400">{file.name}</p>
                <p className="text-gray-500 text-sm mt-2">Ready to analyze</p>
              </>
            ) : (
              <>
                <p className="font-semibold">Click to upload resume</p>
                <p className="text-gray-500 text-sm mt-2">
                  PDF or DOCX format supported
                </p>
              </>
            )}
          </label>

          {error && (
            <div className="mt-5 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-center text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full mt-6 bg-cyan-400 hover:bg-cyan-300 disabled:bg-gray-600 disabled:text-gray-300 text-black py-4 rounded-xl font-bold transition"
          >
            {loading ? "Analyzing Resume..." : "Analyze Resume"}
          </button>
        </div>

        {analysis && (
          <ResumeReport
            analysis={analysis}
            onStartInterview={handleStartInterview}
            questionLoading={questionLoading}
          />
        )}
      </div>
    </div>
  );
}

function ResumeReport({ analysis, onStartInterview, questionLoading }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 35 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto mt-14 mb-16"
    >
      <div className="bg-[#080808] border border-white/15 rounded-3xl p-8">
        <h2 className="text-3xl font-bold mb-2">
          Resume Analysis <span className="text-cyan-400">Report</span>
        </h2>

        <p className="text-gray-400 mb-8">
          Personalized AI insights based on your uploaded resume.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card title="Professional Summary" text={analysis.summary} />
          <Card title="Overall Feedback" text={analysis.overallFeedback} />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <List title="Skills Found" items={analysis.skills} />
          <List title="Strengths" items={analysis.strengths} />
          <List title="Weaknesses" items={analysis.weaknesses} />
          <List title="Improvements" items={analysis.improvements} />
          <List title="Missing Keywords" items={analysis.missingKeywords} />
          <List title="Suggested Roles" items={analysis.suggestedRoles} />
        </div>

        {analysis.improvedResume?.finalResumeText && (
          <div className="mt-10 bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-2xl font-bold mb-4 text-cyan-400">
              Improved Resume Version
            </h3>

            <div className="bg-black/40 border border-white/10 rounded-xl p-5 text-gray-300 whitespace-pre-line leading-relaxed">
              {analysis.improvedResume.finalResumeText}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={onStartInterview}
            disabled={questionLoading}
            className="bg-cyan-400 hover:bg-cyan-300 disabled:bg-gray-600 disabled:text-gray-300 text-black px-8 py-4 rounded-xl font-bold transition"
          >
            {questionLoading ? "Generating Questions..." : "Start Interview →"}
          </button>
        </div>
      </div>
    </motion.section>
  );
}

function Card({ title, text }) {
  if (!text) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-3 text-cyan-400">{title}</h3>
      <p className="text-gray-300 leading-relaxed">{text}</p>
    </div>
  );
}

function List({ title, items }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4 text-cyan-400">{title}</h3>
      <ul className="space-y-2 text-gray-300">
        {items.map((item, index) => (
          <li key={index} className="bg-black/40 rounded-lg px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ResumeUpload;