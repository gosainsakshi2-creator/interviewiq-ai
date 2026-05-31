import { useEffect, useRef, useState } from "react";
import { Camera, Mic, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function EnvironmentCheck() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();

  const [cameraStatus, setCameraStatus] = useState("checking");
  const [micStatus, setMicStatus] = useState("checking");

  useEffect(() => {
    checkDevices();

    return () => {
      stopCamera();
    };
  }, []);

  const checkDevices = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraStatus("success");
      setMicStatus("success");
    } catch (error) {
      console.error(error);
      setCameraStatus("failed");
      setMicStatus("failed");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const startInterview = () => {
    stopCamera();
    navigate("/interview");
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden px-6 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(0,188,212,0.12),transparent_30%),radial-gradient(circle_at_85%_80%,rgba(168,85,247,0.10),transparent_30%)]" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-3">
          Environment <span className="text-cyan-400">Check</span>
        </h1>

        <p className="text-gray-400 text-center mb-10">
          Please allow camera and microphone permissions before starting your AI interview.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#080808] border border-white/15 rounded-3xl p-6"
          >
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-5">
              <Camera className="text-cyan-400" /> Camera Preview
            </h2>

            <div className="h-80 rounded-2xl overflow-hidden bg-black border border-white/10">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#080808] border border-white/15 rounded-3xl p-6 flex flex-col justify-between"
          >
            <div>
              <h2 className="text-xl font-semibold mb-6">
                Device Status
              </h2>

              <StatusCard
                icon={<Camera />}
                title="Camera"
                status={cameraStatus}
              />

              <StatusCard
                icon={<Mic />}
                title="Microphone"
                status={micStatus}
              />
            </div>

            <button
              onClick={startInterview}
              disabled={cameraStatus !== "success" || micStatus !== "success"}
              className="w-full mt-8 bg-cyan-400 hover:bg-cyan-300 disabled:bg-gray-700 disabled:text-gray-400 text-black py-4 rounded-xl font-bold transition"
            >
              Start AI Interview →
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ icon, title, status }) {
  const isSuccess = status === "success";
  const isChecking = status === "checking";

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-cyan-400">{icon}</div>
        <span className="font-semibold">{title}</span>
      </div>

      <div className="flex items-center gap-2">
        {isChecking ? (
          <span className="text-yellow-400">Checking...</span>
        ) : isSuccess ? (
          <>
            <CheckCircle className="text-green-400" size={20} />
            <span className="text-green-400">Ready</span>
          </>
        ) : (
          <>
            <XCircle className="text-red-400" size={20} />
            <span className="text-red-400">Permission Denied</span>
          </>
        )}
      </div>
    </div>
  );
}

export default EnvironmentCheck;