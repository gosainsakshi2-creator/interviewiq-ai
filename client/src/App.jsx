import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import ResumeUpload from "./pages/ResumeUpload";
import EnvironmentCheck from "./pages/EnvironmentCheck";
import InterviewRoom from "./pages/InterviewRoom";
import Report from "./pages/Report";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/resume-upload" element={<ResumeUpload />} />
        <Route path="/environment-check" element={<EnvironmentCheck />} />
        <Route path="/interview" element={<InterviewRoom />} />
        <Route path="/report" element={<Report />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;