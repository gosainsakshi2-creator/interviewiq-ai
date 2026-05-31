import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, Brain, Mic, FileText, Video } from "lucide-react";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-600 rounded-full blur-[150px] opacity-20"></div>
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-cyan-500 rounded-full blur-[150px] opacity-20"></div>

      <nav className="flex justify-between items-center px-10 py-6 relative z-10">
        <h1 className="text-2xl font-bold">
          InterviewIQ <span className="text-cyan-400">AI</span>
        </h1>

        <button
          onClick={() => navigate("/resume-upload")}
          className="px-5 py-2 rounded-xl bg-cyan-500 text-black font-semibold hover:scale-105 transition"
        >
          Get Started
        </button>
      </nav>

      <section className="flex flex-col items-center justify-center text-center px-6 mt-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-cyan-300"
        >
          Resume-Based AI Video Interview Platform
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-bold leading-tight max-w-5xl"
        >
          Turn Your Resume Into A{" "}
          <span className="text-cyan-400">Personalized AI Interview</span>
        </motion.h1>

        <p className="mt-6 text-gray-400 text-lg md:text-xl max-w-3xl">
          Upload your resume, let AI analyze your skills, attend a camera-based
          mock interview, and receive a smart performance report instantly.
        </p>

        <button
          onClick={() => navigate("/resume-upload")}
          className="mt-10 px-8 py-4 bg-cyan-500 text-black rounded-2xl font-bold text-lg hover:scale-105 transition"
        >
          Start AI Interview 🚀
        </button>
      </section>

      <section className="grid md:grid-cols-5 gap-5 px-10 mt-24 pb-20 relative z-10">
        {[
          [Upload, "Resume Upload", "Upload PDF resume for AI analysis."],
          [Brain, "AI Analysis", "AI detects your skills and projects."],
          [Video, "Camera Interview", "Professional video interview room."],
          [Mic, "Voice Answers", "Answer naturally using your microphone."],
          [FileText, "Smart Report", "Get scores and improvement feedback."],
        ].map(([Icon, title, desc], index) => (
          <motion.div
            key={title}
            onClick={() => navigate("/resume-upload")}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md hover:bg-white/10 transition"
          >
            <Icon className="text-cyan-400" size={36} />
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            <p className="text-gray-400 mt-2 text-sm">{desc}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}

export default Home;