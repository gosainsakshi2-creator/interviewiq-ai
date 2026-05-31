import { useEffect, useRef, useState } from "react";
import { Bot, Mic, MicOff, Video, PhoneOff, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function InterviewRoom() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);

  const navigate = useNavigate();

  const [cameraOn, setCameraOn] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [lastFeedback, setLastFeedback] = useState(null);

  useEffect(() => {
    startCamera();
    loadQuestions();

    return () => {
      stopCamera();
      stopRecognition();
      window.speechSynthesis.cancel();
      clearTimeout(silenceTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (questions.length > 0 && questions[questionIndex]?.question) {
      speakQuestion(questions[questionIndex].question);
    }
  }, [questions, questionIndex]);

  const loadQuestions = async () => {
    try {
      setLoadingQuestions(true);

      const savedQuestions = localStorage.getItem("interviewQuestions");

      if (savedQuestions) {
        const parsed = JSON.parse(savedQuestions).slice(0, 5);
        setQuestions(parsed);
        return;
      }

      const resumeText = localStorage.getItem("resumeText");

      if (!resumeText) {
        setQuestions(defaultQuestions);
        return;
      }

      const res = await API.post("/generate-questions", {
        resumeText,
      });

      const generatedQuestions = (res.data.questions || []).slice(0, 5);

      localStorage.setItem(
        "interviewQuestions",
        JSON.stringify(generatedQuestions)
      );

      setQuestions(generatedQuestions);
    } catch (error) {
      console.log("Question generation failed:", error);
      setQuestions(defaultQuestions);
    } finally {
      setLoadingQuestions(false);
    }
  };

const startCamera = async () => {
  try {
    console.log("Starting camera...");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    console.log("Stream received:", stream);

    streamRef.current = stream;

    if (videoRef.current) {
      console.log("Video ref found");

      videoRef.current.srcObject = stream;

      await videoRef.current.play();

      console.log("Video playing");
    } else {
      console.log("Video ref NOT found");
    }

    setCameraOn(true);
  } catch (error) {
    console.error("Camera error:", error);
  }
};

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setCameraOn(false);
  };

  const speakQuestion = (questionText) => {
    if (!questionText) return;

    stopRecognition();
    setTranscript("");
    setLastFeedback(null);

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(questionText);
    speech.lang = "en-US";
    speech.rate = 0.92;
    speech.pitch = 1;

    speech.onend = () => {
      setTimeout(() => {
        startRecording();
      }, 800);
    };

    window.speechSynthesis.speak(speech);
  };

  const startRecording = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }

    stopRecognition();

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognitionRef.current = recognition;

    setRecording(true);

    recognition.onresult = (event) => {
      let finalText = "";

      for (let i = 0; i < event.results.length; i++) {
        finalText += event.results[i][0].transcript;
      }

      setTranscript(finalText);

      clearTimeout(silenceTimerRef.current);

      silenceTimerRef.current = setTimeout(() => {
        finishCurrentAnswer(finalText);
      }, 5000);
    };
  

    recognition.onerror = (error) => {
      console.log("Speech recognition error:", error);
      setRecording(false);
    };

    recognition.onend = () => {
      setRecording(false);
    };

    recognition.start();
  };

  const stopRecognition = () => {
    clearTimeout(silenceTimerRef.current);

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setRecording(false);
  };

 const finishCurrentAnswer = async (answerText) => {
  if (!questions[questionIndex]) return;

  stopRecognition();

  const currentQuestion = questions[questionIndex];

  const answerData = {
    question: currentQuestion.question,
    type: currentQuestion.type || "General",
    answer: answerText || "No answer captured",
  };

  const updatedAnswers = [...answers, answerData];
  setAnswers(updatedAnswers);
  localStorage.setItem("interviewAnswers", JSON.stringify(updatedAnswers));

  await evaluateAnswer(answerData);

  setTranscript("");

  // Auto next question removed
};

    // Feedback ke baad AI automatic next question par nahi jayega.
// User jab Next Question click karega tabhi next question aayega.

  const evaluateAnswer = async (answerData) => {
    try {
      setEvaluating(true);

      const res = await API.post("/evaluate-answer", {
        question: answerData.question,
        answer: answerData.answer,
      });

      const oldEvaluations =
        JSON.parse(localStorage.getItem("interviewEvaluations")) || [];

      const updatedEvaluations = [
        ...oldEvaluations,
        {
          question: answerData.question,
          answer: answerData.answer,
          evaluation: res.data.evaluation,
        },
      ];

      localStorage.setItem(
        "interviewEvaluations",
        JSON.stringify(updatedEvaluations)
      );

      setLastFeedback(res.data.evaluation);
    } catch (error) {
      console.log("Evaluation failed:", error);
    } finally {
      setEvaluating(false);
    }
  };

  const manualNextQuestion = () => {
  if (recording && transcript.trim()) {
    finishCurrentAnswer(transcript);
    return;
  }

  if (questionIndex < questions.length - 1) {
    setTranscript("");
    setLastFeedback(null);
    setQuestionIndex((prev) => prev + 1);
  } else {
    stopCamera();
    navigate("/report");
  }
};

  const endInterview = () => {
    stopRecognition();
    stopCamera();
    window.speechSynthesis.cancel();
    navigate("/report");
  };

  const currentQuestion = questions[questionIndex];

  return (
    <div className="min-h-screen bg-black text-white p-6 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-72 h-72 bg-purple-600 rounded-full blur-[150px] opacity-20"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-cyan-500 rounded-full blur-[150px] opacity-20"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            InterviewIQ <span className="text-cyan-400">AI Room</span>
          </h1>

          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="w-3 h-3 rounded-full bg-green-400"></span>
            Live Interview Session
          </div>
        </header>

        {loadingQuestions ? (
          <div className="min-h-[500px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-5"></div>
              <h2 className="text-2xl font-bold text-cyan-400">
                Generating personalized interview questions...
              </h2>
            </div>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md min-h-[430px] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Bot className="text-cyan-400" /> AI Interviewer
                    </h2>

                    <span className="text-sm text-gray-400">
                      Question {questionIndex + 1}/{questions.length}
                    </span>
                  </div>

                  <div className="mt-10 flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-cyan-400 blur-3xl opacity-30 animate-pulse"></div>
                      <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center">
                        <Bot size={80} className="text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 bg-black/40 border border-cyan-500/20 rounded-2xl p-5">
                    <p className="text-sm text-cyan-400 mb-2">
                      {currentQuestion?.type || "AI Question"}
                    </p>

                    <h3 className="text-2xl font-semibold leading-relaxed">
                      {currentQuestion?.question || "Loading question..."}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 text-gray-400 mt-6">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={18} />
                    {recording
                      ? "Listening to your answer..."
                      : evaluating
                      ? "Analyzing your answer..."
                      : "AI will ask and listen automatically"}
                  </div>

                  <button
                    onClick={() => speakQuestion(currentQuestion?.question)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm text-white"
                  >
                    Repeat Question
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md min-h-[430px]"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Video className="text-cyan-400" /> Candidate Camera
                  </h2>

                  <span className="text-sm text-gray-400">
                    {cameraOn ? "Camera Active" : "Camera Off"}
                  </span>
                </div>

                <div className="rounded-3xl overflow-hidden bg-black border border-white/10 h-72">
                 <video
  ref={videoRef}
  autoPlay
  muted
  playsInline
  className="w-full h-full object-cover bg-black"
/>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={startRecording}
                    disabled={!currentQuestion || recording || evaluating}
                    className={`flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition ${
                      recording
                        ? "bg-red-500 text-white"
                        : "bg-cyan-500 text-black hover:scale-105"
                    }`}
                  >
                    {recording ? <MicOff size={20} /> : <Mic size={20} />}
                    {recording ? "Listening..." : "Start Answer"}
                  </button>

                  <button
                    onClick={manualNextQuestion}
                    disabled={!currentQuestion || evaluating}
                    className="flex-1 py-3 rounded-2xl font-bold bg-white/10 hover:bg-white/20 transition disabled:opacity-50"
                  >
                    {questionIndex === questions.length - 1
                      ? "Finish Interview"
                      : "Next Question"}
                  </button>

                  <button
                    onClick={endInterview}
                    className="w-14 rounded-2xl bg-red-500 flex items-center justify-center"
                  >
                    <PhoneOff size={22} />
                  </button>
                </div>
              </motion.div>
            </div>

            <div className="mt-6 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
              <h2 className="text-xl font-semibold mb-3">Live Transcript</h2>

              <p className="text-gray-300 min-h-[80px]">
                {transcript || "Your spoken answer will appear here..."}
              </p>

              {evaluating && (
                <p className="mt-4 text-cyan-400">
                  AI is analyzing your answer...
                </p>
              )}

              {lastFeedback && (
                <div className="mt-5 bg-black/40 border border-cyan-500/20 rounded-2xl p-5">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-3">
                    AI Answer Feedback
                  </h3>

                  <p className="text-gray-300 mb-3">
                    <span className="font-semibold">Feedback:</span>{" "}
                    {lastFeedback.feedback}
                  </p>

                  <p className="text-gray-300">
                    <span className="font-semibold">Improved Answer:</span>{" "}
                    {lastFeedback.improvedAnswer}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const defaultQuestions = [
  {
    id: 1,
    question: "Tell me about yourself based on your resume.",
    type: "HR",
  },
  {
    id: 2,
    question: "Explain one project mentioned in your resume.",
    type: "Project Based",
  },
  {
    id: 3,
    question: "What are your strongest skills?",
    type: "Technical",
  },
  {
    id: 4,
    question: "How do you handle challenges while working on a project?",
    type: "Behavioral",
  },
  {
    id: 5,
    question: "Why should we consider you for this opportunity?",
    type: "HR",
  },
];

export default InterviewRoom;