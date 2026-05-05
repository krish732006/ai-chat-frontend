import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { Copy, Check } from "lucide-react";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { darcula } from "react-syntax-highlighter/dist/esm/styles/prism";

function Chat() {
  const BASE_URL = "https://ai-chat-backend-5-5716.onrender.com";
  const [shareLink, setShareLink] = useState("");
  const [isGenerated, setIsGenerated] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const handleOpenShare = () => {
    setShareLink("");
    setIsGenerated(false);
    setShowShareModal(true);
  };
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [token, setToken] = useState(null);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const [searchText, setSearchText] = useState("");

  const location = useLocation();
  const chatEndRef = useRef(null);

  const [menuPosition, setMenuPosition] = useState(null);
  const [selectedChatId, setSelectedChatId] = useState(null);

  const [folders, setFolders] = useState([]);
  // const [showMoveMenu, setShowMoveMenu] = useState(null);

  const [showFolders, setShowFolders] = useState(false);

  // const [isRegenerate, setIsRegenerate] = useState(false);
  const [partialAI, setPartialAI] = useState("");
  const controllerRef = useRef(null);

  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState("");

  const [deletedChat, setDeletedChat] = useState(null);
  const [showUndo, setShowUndo] = useState(false);
  let deleteTimerRef = useRef(null);

  const [undoTime, setUndoTime] = useState(5);
  const [deletedFolder, setDeletedFolder] = useState(null);

  const [successToast, setSuccessToast] = useState(null);
  const [copyToast, setCopyToast] = useState(null);

  const [unreadCounts, setUnreadCounts] = useState({});

  const [uploadLoading, setUploadLoading] = useState(false);

  // const normalize = (name) => name.toLowerCase();
  const formatFolder = (name) => name.charAt(0).toUpperCase() + name.slice(1);

  const [openFolder, setOpenFolder] = useState("General");

  const shouldShowCopy = (text) => {
    if (!text) return false;

    const isCode = text.includes("```");
    const isLong = text.length > 120;

    return isCode || isLong;
  };

  // useEffect(() => {
  //   if (!messages.length) return;

  //   const last = messages[messages.length - 1];

  //   setIsRegenerate(last.sender === "ai");
  // }, [messages]);

  useEffect(() => {
    const savedLink = localStorage.getItem("shareLink");

    if (savedLink) {
      setShareLink(savedLink);
      setIsGenerated(true);
    }
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom]);

  // 🔥 TOKEN + USER
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const urlToken = params.get("token");
    const name = params.get("name");

    if (urlToken) {
      localStorage.setItem("token", urlToken);
      setToken(urlToken);
    } else {
      setToken(localStorage.getItem("token"));
    }

    if (name) {
      localStorage.setItem("userName", name);
      setUserName(name);
    } else {
      setUserName(localStorage.getItem("userName"));
    }
  }, [location]);

  // 🔥 LOAD CHATS (FIXED)
  useEffect(() => {
    const storedUser = localStorage.getItem("userName");

    if (!storedUser) return;

    setUserName(storedUser);

    const savedActiveId = localStorage.getItem("activeChatId");

    axios
      .get(`${BASE_URL}/api/chat/${storedUser}`)
      .then((res) => {
        const chatsData = res.data;
        setChats(chatsData);

        // 🔥 folders DB mathi generate
        const foldersFromDB = [
          ...new Set(
            ["general", ...chatsData.map((c) => c.folder || "general")].map(
              (f) => f.toLowerCase(),
            ),
          ),
        ];

        setFolders(foldersFromDB);

        if (chatsData.length === 0) return;

        const found = chatsData.find(
          (chat) => String(chat._id) === String(savedActiveId),
        );

        if (found) {
          setActiveChatId(found._id);
          setMessages(found.messages);
        } else {
          setActiveChatId(chatsData[0]._id);
          setMessages(chatsData[0].messages);
        }
      })
      .catch((err) => console.log(err));
  }, []);

  // useEffect(() => {
  //   const loadChats = async () => {
  //     const res = await axios.get(
  //       "https://ai-chat-backend-5-5716.onrender.com/api/chat",
  //     );

  //     setMessages(res.data.messages);
  //   };

  //   loadChats();
  // }, []);

  // 🔥 SAVE ACTIVE CHAT
  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem("activeChatId", String(activeChatId));
    }
  }, [activeChatId]);

  // 🔥 AUTO SCROLL
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const handleClick = () => setMenuPosition(null);
    window.addEventListener("click", handleClick);

    return () => window.removeEventListener("click", handleClick);
  }, []);

  // 🔥 NEW CHAT
  const createNewChat = () => {
    setActiveChatId(null);

    // 🔥 force new array
    setMessages([]);

    setSidebarOpen(false);
  };

  // 🔥 LOAD CHAT
  const loadChat = (chat) => {
    setActiveChatId(chat._id);

    setUnreadCounts((prev) => ({
      ...prev,
      [chat._id]: 0,
    }));

    // 🔥 IMPORTANT (force new reference)
    setMessages([...chat.messages]);

    setSidebarOpen(false);
  };

  const updateLastMessage = (text) => {
    setMessages((prev) => {
      if (!prev || prev.length === 0) return prev;

      const last = prev[prev.length - 1];

      return [...prev.slice(0, -1), { ...last, text }];
    });
  };

  const handleMove = async (chatId, folder) => {
    try {
      await axios.put(`${BASE_URL}/api/chat/move-folder`, {
        chatId,
        folder,
      });

      // 🔥 UI update
      setChats((prev) =>
        prev.map((chat) => (chat._id === chatId ? { ...chat, folder } : chat)),
      );
    } catch (err) {
      console.log(err);
    }
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);

    setCopiedIndex(index);

    // 🔥 SHOW TOAST
    setCopyToast("Message copied");

    setTimeout(() => {
      setCopiedIndex(null);
      setCopyToast(null);
    }, 1500);
  };

  const currentChat = chats.find(
    (chat) => String(chat._id) === String(activeChatId),
  );

  // 🔥 SEND MESSAGE (FULL FIX)
  const sendMessage = async () => {
    if (!message.trim()) return;

    if (!token) {
      alert("Please login first ⚠️");
      return;
    }

    const userMsg = {
      text: message,
      sender: "user",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    const newMessages = [...messages, userMsg];

    setMessages(newMessages);
    setMessage("");
    setLoading(true);
    setIsTyping(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    let aiText = "";
    let currentChatId = activeChatId;
    let stopped = false; // 🔥 IMPORTANT

    try {
      const response = await fetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          chatId: activeChatId,
          userId: userName,
        }),
        signal: controller.signal,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      // empty AI message
      setMessages((prev) => [
        ...prev,
        {
          text: "",
          sender: "ai",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);

      try {
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value);

          let parts = buffer.split("__CHAT_ID__:");

          // last part incomplete hoi shake
          buffer = parts.pop();

          for (let part of parts) {
            aiText += part;
            updateLastMessage(aiText);

            const idMatch = buffer.match(/^[a-f\d]{24}/);
            if (idMatch) {
              currentChatId = idMatch[0];
              setActiveChatId(currentChatId);
              localStorage.setItem("activeChatId", currentChatId);
            }
          }

          if (!buffer.includes("__CHAT_ID__")) {
            aiText += buffer;
            updateLastMessage(aiText);
            setPartialAI(aiText);
            buffer = "";
          }
        }

        // 🔥 ADD THIS BLOCK HERE
        if (!controllerRef.current?.signal.aborted) {
          // 🔥 UNREAD COUNT
          if (currentChatId !== activeChatId) {
            setUnreadCounts((prev) => ({
              ...prev,
              [currentChatId]: (prev[currentChatId] || 0) + 1,
            }));
          }
        }
      } catch (err) {
        if (err.name === "AbortError") {
          console.log("Stopped ⏹️");
          stopped = true; // 🔥 IMPORTANT
        } else {
          throw err;
        }
      }

      // ❌ STOP thayu hoy to ahiya thi return
      if (stopped) return;

      // 🔥 TITLE (only new chat)
      let chatTitle = message.slice(0, 20);

      if (!activeChatId) {
        try {
          const res = await axios.post(`${BASE_URL}/api/chat/title`, {
            message,
          });
          chatTitle = res.data.title;
        } catch (err) {
          console.log("Title failed");
          chatTitle = "New Chat"; // fallback
          console.log(err);
        }
      }

      // 🔥 FINAL SAVE (ONLY IF NOT STOPPED)
      const finalMessages = [
        ...newMessages,
        {
          text: aiText,
          sender: "ai",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ];

      setChats((prev) => {
        const id = currentChatId;
        if (!id) return prev;

        const exists = prev.find((c) => String(c._id) === String(id));

        if (exists) {
          return prev.map((chat) =>
            String(chat._id) === String(id)
              ? { ...chat, messages: finalMessages }
              : chat,
          );
        }

        return [
          {
            _id: id,
            messages: finalMessages,
            title: chatTitle,
            folder: "general",
          },
          ...prev,
        ];
      });

      // 🔥 COMPLETE → reset
      setPartialAI("");

      await axios.get(`${BASE_URL}/api/chat/${userName}`).then((res) => {
        setChats(res.data);
      });
    } catch (error) {
      if (error.name !== "AbortError") {
        console.log(error);
        alert("Server error ❌");
      }
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    // ✅ 1. Show image instantly
    setMessages((prev) => [
      ...prev,
      {
        type: "image",
        image: imageUrl,
        sender: "user",
      },
    ]);

    const formData = new FormData();
    formData.append("image", file);

    try {
      setUploadLoading(true);

      const token = localStorage.getItem("token");

      const res = await axios.post(`${BASE_URL}/api/ai/image`, formData, {
        headers: {
          Authorization: `Bearer ${token}`, // 🔥 MUST
          "Content-Type": "multipart/form-data",
        },
      });

      const aiReply = res.data.result || "No response from AI";

      // ✅ 2. Show AI response
      setMessages((prev) => [
        ...prev,
        {
          text: aiReply,
          sender: "ai",
        },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    // ✅ show image instantly
    setMessages((prev) => [
      ...prev,
      {
        type: "image",
        image: imageUrl,
        sender: "user",
      },
    ]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadLoading(true);

      const res = await axios.post(`${BASE_URL}/api/ai/file`, formData);

      // 🔥 IMPORTANT FIX
      setMessages((prev) => [
        ...prev,
        {
          type: "image",
          image: res.data.image, // backend base64
          sender: "user",
        },
        {
          text: res.data.result,
          sender: "ai",
        },
      ]);
    } catch (err) {
      console.log(err);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleGenerateShareLink = async () => {
    try {
      const res = await fetch(
        "https://ai-chat-backend-5-5716.onrender.com/api/share",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages,
            chatId: activeChatId,
            title: currentChat?.title || "New Chat",
          }),
        },
      );

      const data = await res.json();

      // ✅ FRONTEND LINK (IMPORTANT)
      const link = `https://ai-chat-frontend-theta.vercel.app/share/${data.shareId}`;

      setShareLink(link);
      setIsGenerated(true);

      localStorage.setItem("shareLink", link);
    } catch (err) {
      console.log(err);
    }
  };

  const handleStop = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      setIsTyping(false);
    }
  };

  const handleContinue = async () => {
    if (!partialAI) return;

    setIsTyping(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await fetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "__CONTINUE__", // 🔥 special keyword
          chatId: activeChatId,
          userId: userName,
        }),
        signal: controller.signal,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let aiText = partialAI;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        if (chunk.includes("__CHAT_ID__")) {
          const parts = chunk.split("__CHAT_ID__:");
          const textPart = parts[0];

          aiText += textPart;
        } else {
          aiText += chunk;
        }

        updateLastMessage(aiText);
        setPartialAI(aiText);
      }

      // 🔥 only after full complete
      setPartialAI("");
    } catch (error) {
      if (error.name !== "AbortError") {
        console.log(error);
      }
    } finally {
      setIsTyping(false);
    }
  };
  // const handleRegenerate = () => {
  //   if (!messages.length) return;

  //   const lastUserMsg = [...messages]
  //     .reverse()
  //     .find((msg) => msg.sender === "user");

  //   if (!lastUserMsg) return;

  //   // remove last AI msg
  //   setMessages((prev) => prev.slice(0, -1));

  //   // resend
  //   setMessage(lastUserMsg.text);

  //   setTimeout(() => {
  //     sendMessage();
  //   }, 100);
  // };

  const handleDelete = (chatId) => {
    const chatToDelete = chats.find((c) => c._id === chatId);
    if (!chatToDelete) return;

    setDeletedChat(chatToDelete);
    setChats((prev) => prev.filter((c) => c._id !== chatId));
    setShowUndo(true);
    setUndoTime(5);

    // 🔥 countdown start
    const countdown = setInterval(() => {
      setUndoTime((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 🔥 final delete
    deleteTimerRef.current = setTimeout(async () => {
      try {
        await fetch(`${BASE_URL}/api/chat/${chatId}`, {
          method: "DELETE",
        });

        // 🔥 SUCCESS TOAST (AAHI J MUKVU CHE)
        setSuccessToast("Chat deleted successfully");

        setTimeout(() => {
          setSuccessToast(null);
        }, 3000);
      } catch (err) {
        console.log(err);
      }

      setDeletedChat(null);
      setShowUndo(false);
    }, 5000);
  };

  const handleUndoDelete = () => {
    clearTimeout(deleteTimerRef.current);

    // 🔥 CHAT UNDO
    if (deletedChat) {
      setChats((prev) => [deletedChat, ...prev]);
      setDeletedChat(null);
    }

    // 🔥 FOLDER UNDO
    if (deletedFolder) {
      // folder restore
      setFolders((prev) => [...prev, deletedFolder.name]);

      // chats restore
      setChats((prev) =>
        prev.map((chat) => {
          const original = deletedFolder.chats.find((c) => c._id === chat._id);
          return original ? { ...chat, folder: deletedFolder.name } : chat;
        }),
      );

      setDeletedFolder(null);
    }

    setShowUndo(false);
  };

  const handleRename = async (chatId) => {
    try {
      await axios.put(`${BASE_URL}/api/chat/rename`, {
        chatId,
        title: editTitle,
      });

      setChats((prev) =>
        prev.map((c) => (c._id === chatId ? { ...c, title: editTitle } : c)),
      );

      setEditingChatId(null);
    } catch (err) {
      console.log(err);
    }
  };

  const handlePin = async (chatId) => {
    try {
      const res = await axios.put(`${BASE_URL}/api/chat/pin/${chatId}`);

      setChats((prev) => prev.map((c) => (c._id === chatId ? res.data : c)));
    } catch (err) {
      console.log(err);
    }
  };

  const handleEditFolder = async (oldName) => {
    const newName = prompt("Rename folder:", oldName);
    if (!newName) return;

    const normalized = newName.trim().toLowerCase();

    if (folders.includes(normalized)) {
      alert("Folder already exists ⚠️");
      return;
    }

    try {
      // 🔥 backend call (ALL chats with this folder update)
      await axios.put("http://localhost:5000/api/chat/rename-folder", {
        oldName,
        newName: normalized,
        userId: userName,
      });

      // 🔥 UI update
      setFolders((prev) => prev.map((f) => (f === oldName ? normalized : f)));

      setChats((prev) =>
        prev.map((chat) =>
          chat.folder === oldName ? { ...chat, folder: normalized } : chat,
        ),
      );
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeleteFolder = async (folderName) => {
    if (!window.confirm("Delete this folder?")) return;

    // 🔥 backup folder chats
    const folderChats = chats.filter((c) => c.folder === folderName);

    setDeletedFolder({
      name: folderName,
      chats: folderChats,
    });

    // 🔥 UI update
    setFolders((prev) => prev.filter((f) => f !== folderName));

    setChats((prev) =>
      prev.map((chat) =>
        chat.folder === folderName ? { ...chat, folder: "general" } : chat,
      ),
    );

    setShowUndo(true);
    setUndoTime(5);

    // countdown
    const countdown = setInterval(() => {
      setUndoTime((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 🔥 backend call AFTER 5 sec
    deleteTimerRef.current = setTimeout(async () => {
      try {
        await axios.put("http://localhost:5000/api/chat/delete-folder", {
          folderName,
          userId: userName,
        });

        // 🔥 SUCCESS TOAST (AAHI)
        setSuccessToast("Folder deleted successfully");

        setTimeout(() => {
          setSuccessToast(null);
        }, 3000);
      } catch (err) {
        console.log(err);
      }

      setDeletedFolder(null);
      setShowUndo(false);
    }, 5000);
  };

  const handleEditSave = async (index) => {
    if (!editText.trim()) return;

    // 🔥 treat as NEW USER MESSAGE
    const userMsg = { text: editText, sender: "user" };

    const newMessages = [...messages, userMsg];

    setMessages(newMessages);
    setEditingIndex(null);
    setEditText("");
    setIsTyping(true);

    try {
      const response = await fetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: editText,
          chatId: activeChatId,
          userId: userName,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let aiText = "";

      // 🔥 empty AI message
      setMessages((prev) => [...prev, { text: "", sender: "ai" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);

        aiText += chunk;
        updateLastMessage(aiText);
      }

      // 🔥 sidebar update
      setChats((prev) =>
        prev.map((chat) =>
          chat._id === activeChatId
            ? {
                ...chat,
                messages: [...newMessages, { text: aiText, sender: "ai" }],
              }
            : chat,
        ),
      );
    } catch (err) {
      console.log(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleScroll = () => {
    const el = chatContainerRef.current;
    if (!el) return;

    const threshold = 100; // px tolerance

    const isBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

    setIsAtBottom(isBottom);
  };

  const filteredChats = chats.filter((chat) =>
    (chat.title || chat.messages[0]?.text || "")
      .toLowerCase()
      .includes(searchText.toLowerCase()),
  );

  const groupedChats = {};

  filteredChats.forEach((chat) => {
    const folder = chat.folder || "General";

    if (!groupedChats[folder]) {
      groupedChats[folder] = [];
    }

    groupedChats[folder].push(chat);
  });

  const safeFolders = [];

  folders.forEach((f) => {
    if (!safeFolders.some((x) => x.toLowerCase() === f.toLowerCase())) {
      safeFolders.push(f);
    }
  });

  return (
    <div className="flex h-screen bg-[#0f172a] text-white  w-full overflow-hidden">
      {/* SIDEBAR */}
      <div
        className={`fixed sm:static top-0 left-0 h-full w-64 sm:w-72 shrink-0 bg-[#1e293b] p-4 border-r border-gray-700 flex flex-col z-50 transform transition-transform duration-300
							${sidebarOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0`}
      >
        {/* ❌ CLOSE BUTTON (mobile only) */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="sm:hidden mb-4 text-right"
        >
          ❌
        </button>
        {/* 🔥 NEW CHAT BUTTON */}
        <button
          onClick={() => {
            createNewChat();
            setSidebarOpen(false); // 🔥 IMPORTANT
          }}
          className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl mb-5 font-semibold text-xl"
        >
          + New Chat
        </button>
        <button
          onClick={() => {
            const name = prompt("Folder name?");
            if (!name) return;

            // const normalized = name.trim().toLowerCase(); // 🔥 ONE SOURCE OF TRUTH

            // // 🔥 CASE-INSENSITIVE CHECK
            // const exists = folders.some(
            //   (f) => normalize(f) === normalize(normalized), // already lowercase check
            // );

            // if (exists) {
            //   alert("Folder already exists ⚠️");
            //   return;
            // }

            const normalized = name.trim().toLowerCase();

            if (folders.includes(normalized)) {
              alert("Folder already exists ⚠️");
              return;
            }
            // const updated = [...folders, normalized];

            // setFolders(updated);
            setFolders((prev) => [...prev, normalized]);

            // localStorage.setItem(
            //   `folders_${userName}`,
            //   JSON.stringify(updated),
            // );
          }}
          className="bg-purple-500 p-2 rounded-xl mb-3 font-semibold"
        >
          + New Folder
        </button>
        <input
          type="text"
          placeholder="Search chats..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded-lg bg-gray-800 text-base outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-base text-gray-400 uppercase tracking-wider mb-2 px-1">
          History
        </p>
        {/* 🔥 CHAT LIST */}
        {searchText.trim() !== ""
          ? // 🔍 SEARCH MODE (NO FOLDERS)
            filteredChats.map((chat) => (
              <div
                key={chat._id}
                onClick={() => loadChat(chat)}
                className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 cursor-pointer"
              >
                {chat.title ||
                  chat.messages[0]?.text?.slice(0, 20) ||
                  "New Chat"}

                {unreadCounts[chat._id] > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full ml-2">
                    {unreadCounts[chat._id]}
                  </span>
                )}
              </div>
            ))
          : safeFolders.map((folder) => {
              const folderChats = groupedChats[folder] || [];

              const pinned = folderChats.filter((c) => c.isPinned);
              const normal = folderChats.filter((c) => !c.isPinned);

              return (
                <div key={folder}>
                  {/* 📂 Folder */}
                  <div
                    onClick={() =>
                      setOpenFolder(openFolder === folder ? null : folder)
                    }
                    className="p-3 text-lg font-semibold text-purple-400 mt-3 cursor-pointer flex items-center justify-between"
                  >
                    <span>📁 {formatFolder(folder)}</span>

                    {/* ✏️ + 🗑️ */}
                    <div className="flex gap-2 text-lg">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // 🔥 important (folder open na thay)
                          handleEditFolder(folder);
                        }}
                        className="text-yellow-400"
                      >
                        ✏️
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder);
                        }}
                        className="text-red-400"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* arrow */}
                    <span
                      className={`text-gray-300 text-2xl font-bold transform transition-all duration-300 
							hover:scale-125 ${
                openFolder === folder
                  ? "rotate-180 scale-125 text-purple-300"
                  : "scale-100"
              }`}
                    >
                      {openFolder === folder ? "−" : "+"}
                    </span>
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openFolder === folder
                        ? "max-h-[500px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    {/* 📌 PINNED */}
                    {pinned.length > 0 && (
                      <>
                        {/* <p className="text-xs text-yellow-400 mt-2">📌 Pinned</p> */}

                        {pinned.map((chat) => (
                          <div
                            key={chat._id}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setMenuPosition({ x: e.pageX, y: e.pageY });
                              setSelectedChatId(chat._id);
                            }}
                            className={`p-3 rounded-lg flex justify-between items-center ${
                              activeChatId === chat._id
                                ? "bg-blue-600"
                                : "bg-gray-800 hover:bg-gray-700"
                            }`}
                          >
                            {editingChatId === chat._id ? (
                              <input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleRename(chat._id);
                                }}
                                className="bg-gray-700 text-white px-2 py-1 rounded w-full"
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => loadChat(chat)}
                                className="cursor-pointer flex-1 text-lg font-medium"
                              >
                                {chat.title ||
                                  chat.messages[0]?.text?.slice(0, 20) ||
                                  "New Chat"}{" "}
                                📌
                              </span>
                            )}

                            {unreadCounts[chat._id] > 0 && (
                              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full ml-2">
                                {unreadCounts[chat._id]}
                              </span>
                            )}

                            <div className="flex gap-3 ml-2 text-lg font-medium">
                              <button
                                onClick={() => handlePin(chat._id)}
                                className={`sm:hidden ${
                                  chat.isPinned
                                    ? "text-yellow-400"
                                    : "text-gray-400"
                                }`}
                              >
                                📌
                              </button>

                              <button
                                onClick={() => {
                                  setEditingChatId(chat._id);
                                  setEditTitle(chat.title || "");
                                }}
                              >
                                ✏️
                              </button>

                              <button
                                onClick={() => {
                                  if (window.confirm("Delete this chat?")) {
                                    handleDelete(chat._id);
                                  }
                                }}
                                className="text-red-400"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* 🕒 NORMAL */}
                    {normal.map((chat) => (
                      <div
                        key={chat._id}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setMenuPosition({ x: e.pageX, y: e.pageY });
                          setSelectedChatId(chat._id);
                        }}
                        className={`p-3 rounded-lg flex justify-between items-center ${
                          activeChatId === chat._id
                            ? "bg-blue-600"
                            : "bg-gray-700 hover:bg-gray-600"
                        }`}
                      >
                        {editingChatId === chat._id ? (
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRename(chat._id);
                            }}
                            className="bg-gray-700 text-lg-white px-2 py-1 rounded w-full"
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={() => loadChat(chat)}
                            className="cursor-pointer flex-1 text-lg font-medium"
                          >
                            {chat.title ||
                              chat.messages[0]?.text?.slice(0, 20) ||
                              "New Chat"}
                          </span>
                        )}

                        {unreadCounts[chat._id] > 0 && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full ml-2">
                            {unreadCounts[chat._id]}
                          </span>
                        )}

                        <div className="flex gap-3 ml-2 text-lg font-medium">
                          <button
                            onClick={() => handlePin(chat._id)}
                            className={`sm:hidden ${
                              chat.isPinned
                                ? "text-yellow-400"
                                : "text-gray-400"
                            }`}
                          >
                            📌
                          </button>

                          <button
                            onClick={() => {
                              setEditingChatId(chat._id);
                              setEditTitle(chat.title || "");
                            }}
                          >
                            ✏️
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm("Delete this chat?")) {
                                handleDelete(chat._id);
                              }
                            }}
                            className="text-red-400"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
      </div>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
        />
      )}

      {/* MAIN */}
      <div className="flex flex-col flex-1 w-full">
        {/* HEADER */}
        <div className="flex items-center justify-between px-2 md:px-6 py-4 sm:py-5 bg-[#1e293b]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="sm:hidden text-xl mr-3"
          >
            ☰
          </button>
          <h1 className="text-lg md:text-2xl font-bold">AI Chat 🚀</h1>

          <button
            onClick={handleOpenShare}
            className="flex items-center gap-2 text-gray-300 hover:text-white"
          >
            🔗 Share
          </button>

          <div className="flex items-center gap-3">
            {userName && (
              <span className="bg-gray-700 px-3 py-3 rounded-lg text-md">
                👤 {userName}
              </span>
            )}

            {token ? (
              <button
                onClick={() => {
                  //   localStorage.clear();
                  localStorage.removeItem("token");
                  localStorage.removeItem("userName");
                  localStorage.removeItem("activeChatId");

                  // 🔥 backend logout call
                  window.location.href = `${BASE_URL}/api/auth/logout`;
                }}
                className="bg-red-500 px-4 py-3 rounded-lg text-md"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() =>
                  (window.location.href = `${BASE_URL}/api/auth/google`)
                }
                className="bg-green-500 px-4 py-3 rounded-lg text-md"
              >
                Login with Google
              </button>
            )}
          </div>
        </div>

        {/* CHAT */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto w-full px-2 md:px-6 py-4"
        >
          <div className="w-full space-y-4 px-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-xl text-base md:text-lg leading-relaxed max-w-[95%] md:max-w-[85%] break-words ${
                    msg.sender === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-700 text-gray-200"
                  }`}
                >
                  {msg.sender === "ai" ? (
                    <div className="relative">
                      {/* 📋 COPY BUTTON */}
                      {shouldShowCopy(msg.text) && (
                        <button
                          onClick={() => handleCopy(msg.text, index)}
                          className="absolute top-2 right-2 p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition"
                        >
                          {copiedIndex === index ? (
                            <Check size={18} className="text-green-400" />
                          ) : (
                            <Copy size={18} />
                          )}
                        </button>
                      )}

                      {/* 🔥 AI MESSAGE */}
                      <ReactMarkdown
                        children={msg.text}
                        components={{
                          code({ inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(
                              className || "",
                            );
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
                              <code
                                className="bg-gray-800 px-1 rounded"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                        }}
                      />

                      {index === messages.length - 1 && isTyping && (
                        <span className="ml-1 animate-pulse">|</span>
                      )}

                      <div className="text-[15px] text-gray-400 mt-1 text-right">
                        {msg.time}
                      </div>

                      {/* {index === messages.length - 1 && (
                        <button
                          onClick={() => handleEditSave(index - 1)}
                          className="text-xs text-gray-400 mt-2 hover:text-white"
                        >
                          🔄 Regenerate
                        </button>
                      )} */}
                    </div>
                  ) : msg.sender === "user" ? (
                    editingIndex === index ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="bg-gray-700 px-2 py-1 rounded text-sm w-full"
                        />

                        <button
                          onClick={() => handleEditSave(index)}
                          className="text-green-400 text-md"
                        >
                          ✔
                        </button>

                        <button
                          onClick={() => setEditingIndex(null)}
                          className="text-red-400 text-md"
                        >
                          ✖
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {/* ✅ IMAGE SHOW */}
                        {msg.type === "image" && (
                          <img
                            src={msg.image}
                            alt="upload"
                            className="w-40 rounded-lg"
                          />
                        )}

                        {/* ✅ TEXT SHOW */}
                        {msg.text && <span>{msg.text}</span>}

                        {/* 🕒 TIME */}
                        <span className="text-[15px] text-gray-400 mt-1 text-right flex justify-end gap-2">
                          {msg.time}
                        </span>

                        {/* ✏️ EDIT BUTTON */}
                        <button
                          onClick={() => {
                            setEditingIndex(index);
                            setEditText(msg.text);
                          }}
                          className="text-md text-gray-300 hover:text-white"
                        >
                          ✏️
                        </button>
                      </div>
                    )
                  ) : (
                    <span>{msg.text}</span>
                  )}
                </div>
              </div>
            ))}

            {/* 🔥 IMPORTANT (scroll end) */}
            <div ref={messagesEndRef} />

            {/* {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 animate-pulse">
                  ⏳ AI typing...
                </div>
              </div>
            )} */}
            {isTyping && (
              <div className="flex items-center gap-2 text-gray-400 mt-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></span>
                </div>
                <span className="text-sm">AI is typing...</span>
              </div>
            )}
          </div>
          <div ref={chatEndRef}></div>

          {menuPosition && (
            <div
              className="fixed bg-gray-800 text-white rounded-lg shadow-lg py-2 z-50"
              style={{ top: menuPosition.y, left: menuPosition.x }}
            >
              {!showFolders ? (
                <>
                  {/* NORMAL MENU */}
                  <button
                    onClick={() => {
                      handlePin(selectedChatId);
                      setMenuPosition(null);
                    }}
                    className="block px-4 py-2 hover:bg-gray-700 w-full text-left"
                  >
                    📌 Pin / Unpin
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFolders(true);
                    }}
                    className="block px-4 py-2 hover:bg-gray-700 w-full text-left"
                  >
                    📂 Move to folder
                  </button>
                </>
              ) : (
                <>
                  {/* 🔥 FOLDER LIST */}
                  {folders.map((f) => (
                    <div
                      key={f}
                      onClick={() => {
                        handleMove(selectedChatId, f);
                        setMenuPosition(null);
                        setShowFolders(false);
                      }}
                      className="p-2 hover:bg-gray-700 rounded cursor-pointer"
                    >
                      📁 {f.charAt(0).toUpperCase() + f.slice(1)}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* INPUT */}
        {/* INPUT */}
        <div className="p-4 bg-[#1e293b] border-t border-gray-700">
          {uploadLoading && (
            <p className="text-xs text-gray-400">Uploading...</p>
          )}
          {/* <div className="w-full relative mt-3 px-2"> */}
          <div className="flex items-center gap-3 relative">
            {/* 📸 Image Upload
              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
                className="text-white"
              />

              {/* 📄 File Upload */}
            {/* <input type="file" onChange={handleFile} className="text-white" />  */}
            <label className="cursor-pointer">
              📸
              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
                hidden
              />
            </label>

            <label className="cursor-pointer">
              📄
              <input type="file" onChange={handleFile} hidden />
            </label>

            <textarea
              rows="1"
              placeholder="Ask anything..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="flex-1 p-7 rounded-xl bg-[#0f172a] border border-gray-600 resize-none"
            />

            <button
              onClick={() => {
                if (isTyping) {
                  handleStop();
                } else if (partialAI && partialAI.trim().length > 10) {
                  handleContinue();
                } else {
                  sendMessage();
                }
              }}
              className={`absolute top-1/2 right-3 -translate-y-1/2 sm:top-auto sm:bottom-4 sm:right-6 sm:translate-y-0 p-3 sm:p-4 rounded-full text-white transition
                        ${
                          isTyping
                            ? "bg-red-500 hover:bg-red-600"
                            : partialAI && !isTyping
                              ? "bg-yellow-500 hover:bg-yellow-600"
                              : "bg-blue-500 hover:bg-blue-600"
                        }
                      `}
            >
              {isTyping
                ? "⏹️"
                : partialAI && partialAI.length > 0
                  ? "▶️"
                  : "🚀"}
            </button>
          </div>
        </div>
      </div>

      {!isAtBottom && (
        <button
          onClick={() =>
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
          }
          className="fixed bottom-[90px] md:bottom-[150px] 
                  right-10 md:right-15 
                  bg-[#1f2937]/90 backdrop-blur-md 
                  text-white p-2 rounded-full 
                  shadow-[0_4px_20px_rgba(0,0,0,0.5)]
                  border border-gray-700
                  hover:bg-[#52cd0b] hover:scale-110
                  active:scale-95
                  transition-all duration-300 ease-out
                  z-50"
        >
          ⬇️
        </button>
      )}

      {successToast && (
        <div className="fixed top-5 right-5 bg-green-500 text-white px-5 py-3 rounded-xl shadow-xl z-50 animate-fade-in flex items-center gap-2">
          <span>✅</span>
          <span className="text-sm font-medium">{successToast}</span>
        </div>
      )}

      {copyToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-green-500/90 backdrop-blur px-4 py-2 rounded-xl shadow-xl z-50 animate-fade-in flex items-center gap-2">
          <span>📋</span>
          <span className="text-sm font-medium">{copyToast}</span>
        </div>
      )}

      {showUndo && (
        <div className="fixed bottom-5 left-5 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-4 z-50 animate-fade-in">
          {/* 🗑️ ICON */}
          <span className="text-xl">🗑️</span>

          {/* TEXT */}
          <div className="flex flex-col text-sm">
            <span className="font-semibold">Chat deleted</span>
            <span className="text-xs opacity-80">Undo in {undoTime}s</span>
          </div>

          {/* BUTTON */}
          <button
            onClick={handleUndoDelete}
            className="bg-white text-black px-3 py-1 rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
          >
            Undo
          </button>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div
            className="bg-[#1f2937] text-white 
                    w-full max-w-2xl md:max-w-3xl 
                    rounded-2xl p-6 shadow-2xl relative"
          >
            {/* ❌ Close */}
            <button
              onClick={() => {
                localStorage.removeItem("shareLink"); // 🔥 clear old
                setShareLink("");
                setIsGenerated(false);
                setShowShareModal(false);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
            >
              ✖
            </button>

            {/* 🧠 Title */}
            <h2 className="text-2xl font-semibold mb-5">
              {currentChat?.title || "New Chat"}
            </h2>

            {/* 💬 CHAT PREVIEW */}
            <div
              className="bg-gray-700/50 rounded-xl p-5 
                      max-h-[350px] overflow-y-auto 
                      text-sm leading-relaxed space-y-2"
            >
              {messages.slice(-8).map((msg, i) => (
                <div key={i}>
                  <b>{msg.sender === "user" ? "You" : "AI"}:</b> {msg.text}
                </div>
              ))}
            </div>

            {/* 🔗 GENERATE BUTTON */}
            <div className="mt-5 flex justify-center">
              <button
                onClick={handleGenerateShareLink}
                className="bg-blue-500 hover:bg-blue-600 
                     px-5 py-2 rounded-lg text-white font-medium"
              >
                Generate Link 🔗
              </button>
            </div>

            {/* 🔗 LINK BOX */}
            {shareLink && (
              <div className="mt-4 bg-gray-800 p-3 rounded-lg text-center">
                <input
                  value={shareLink}
                  readOnly
                  className="w-full bg-transparent outline-none text-sm text-center"
                />

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink);
                    setCopyToast("Link copied");

                    setTimeout(() => {
                      setCopiedIndex(null);
                      setCopyToast(null);
                    }, 1500);
                  }}
                  className="text-blue-400 mt-2 text-sm"
                >
                  Copy Link
                </button>
              </div>
            )}

            {/* 🌐 SHARE OPTIONS */}
            {isGenerated && (
              <div className="flex justify-around mt-6">
                {/* 🔗 COPY */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink);
                    setCopyToast("Link copied");

                    setTimeout(() => {
                      setCopiedIndex(null);
                      setCopyToast(null);
                    }, 1500);
                  }}
                  className="flex flex-col items-center"
                >
                  🔗
                  <span className="text-xs mt-1">Copy</span>
                </button>

                {/* ❌ X (Twitter) */}
                <button
                  onClick={() => {
                    window.open(
                      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}`,
                      "_blank",
                    );
                  }}
                  className="flex flex-col items-center"
                >
                  ✖<span className="text-xs mt-1">X</span>
                </button>

                {/* 💼 LinkedIn */}
                <button
                  onClick={() => {
                    window.open(
                      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`,
                      "_blank",
                    );
                  }}
                  className="flex flex-col items-center"
                >
                  💼
                  <span className="text-xs mt-1">LinkedIn</span>
                </button>

                {/* 👽 Reddit */}
                <button
                  onClick={() => {
                    window.open(
                      `https://www.reddit.com/submit?url=${encodeURIComponent(shareLink)}`,
                      "_blank",
                    );
                  }}
                  className="flex flex-col items-center"
                >
                  👽
                  <span className="text-xs mt-1">Reddit</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default Chat;
