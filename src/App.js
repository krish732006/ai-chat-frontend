import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Chat from "./pages/Chat";
import SharedChatPage from "./pages/SharedChatPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Chat />} />
        {/* Chat */}
        <Route path="/chat" element={<Chat />} />

        <Route path="/share/:id" element={<SharedChatPage />} />
      </Routes>
    </Router>
  );
}

export default App;
