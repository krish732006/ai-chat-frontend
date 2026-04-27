import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Copy, Check } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { darcula } from "react-syntax-highlighter/dist/esm/styles/prism";

const SharedChatPage = () => {
  const { id } = useParams();

  const [messages, setMessages] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [title, setTitle] = useState("");

  const messagesEndRef = useRef(null);

  // 🔥 FETCH DATA
  useEffect(() => {
    fetch(`https://ai-chat-backend-5-5716.onrender.com/api/share/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) {
          setMessages(data.messages);
          setTitle(data.title);
        }
      });
  }, [id]);

  // 🔥 AUTO SCROLL
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔥 COPY FUNCTION
  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);

    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const shouldShowCopy = (text) => text.length > 20;

  return (
    <div className="flex flex-col h-screen bg-[#0b1220] text-white">
      {/* 🔝 HEADER */}
      <div className="text-center py-4 border-b border-gray-700 text-lg font-semibold">
        🔗 {title || "Shared Chat"}
      </div>

      {/* 💬 CHAT AREA */}
      <div className="flex-1 overflow-y-auto w-full px-2 md:px-6 py-4 space-y-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`relative px-4 py-2 rounded-xl text-lg leading-relaxed 
              max-w-[95%] sm:max-w-[85%] ${
                msg.sender === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 text-gray-200"
              }`}
            >
              {/* 📋 COPY BUTTON */}
              {msg.sender === "ai" && shouldShowCopy(msg.text) && (
                <button
                  onClick={() => handleCopy(msg.text, index)}
                  className="absolute top-2 right-2 p-2 bg-gray-800 rounded-full hover:bg-gray-600 transition"
                >
                  {copiedIndex === index ? (
                    <Check size={18} className="text-green-400" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              )}

              {/* 🔥 MARKDOWN + CODE */}
              <ReactMarkdown
                children={msg.text}
                components={{
                  code({ inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={darcula}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="bg-gray-800 px-1 rounded" {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              />

              {/* 🕒 TIME */}
              {msg.time && (
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {msg.time}
                </div>
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* 🔻 FOOTER */}
      <div className="text-center py-3 text-gray-400 text-sm border-t border-gray-700">
        🔗 Shared via AI Chat
      </div>
    </div>
  );
};

export default SharedChatPage;
