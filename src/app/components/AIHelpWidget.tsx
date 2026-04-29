/**
 * AIHelpWidget.tsx
 *
 * Contextual AI assistant for Share Your Wisdom app.
 * Helps users understand how to share insights through various input methods.
 */

import { useState, useRef, useEffect } from "react";
import { executeAIPrompt } from "../utils/databricksAI";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  role: "ai" | "user";
  content: string;
  chips?: Chip[];
  steps?: string[];
}

interface Chip {
  label: string;
  value: string;
}

export interface AIHelpWidgetProps {
  // Core identity
  activeHexId: string;
  activeHexLabel: string;
  userEmail: string;
  userRole: string;

  // Wisdom context
  wisdomInputMethod?: string | null;   // 'Text'|'Voice'|'Photo'|'Video'|'File'|'Interview'
}

// ── Help Manual ───────────────────────────────────────────────────────────────

const HELP_MANUAL: Record<string, { guess: string; steps: string[] }> = {
  Wisdom: {
    guess: "share your insights and wisdom",
    steps: [
      "Step 1: Choose your input method — Text, Voice, Photo, Video, File, or Interview.",
      "Text: Type your insight and click Save. Use the microphone icon for voice-to-text.",
      "Voice: Click Start Recording, speak your insights, then click Stop — saves automatically.",
      "Photo: Take or upload a photo with optional caption.",
      "Video: Record or upload a video with your insights.",
      "File: Upload any document up to 37MB (PDF, Word, Excel, PowerPoint, etc.).",
      "Interview: An AI interviewer asks targeted questions, transcribes your answers, and generates a structured summary you can edit before saving.",
      "All wisdom is saved to your Databricks workspace for future reference.",
    ],
  },
};

// ── Context banner ────────────────────────────────────────────────────────────

function buildContextBanner(props: AIHelpWidgetProps): string {
  const parts: string[] = [];

  if (props.activeHexId === 'Wisdom') {
    if (props.wisdomInputMethod) parts.push(`Method: ${props.wisdomInputMethod}`);
  }

  return parts.join(' · ');
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(props: AIHelpWidgetProps): string {
  const manualText = Object.entries(HELP_MANUAL)
    .map(([id, m]) => `### ${id}\nGoal: ${m.guess}\nSteps:\n${m.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`)
    .join("\n\n");

  let pageContext = `- Active page: ${props.activeHexLabel}\n`;
  pageContext += `- User: ${props.userEmail}\n`;

  if (props.activeHexId === 'Wisdom') {
    pageContext += `- Wisdom input method: ${props.wisdomInputMethod || 'none selected yet'}\n`;
  }

  return `You are the CoHive Wisdom Assistant. You help users share their insights and wisdom through various input methods.

CURRENT STATE:
${pageContext}

YOUR JOB:
- Answer questions about how to use the Share Your Wisdom feature
- Be concise and specific — reference what you can see
- Use step-by-step instructions from the help manual when asked how to do something
- Never make up features that don't exist
- If the user seems stuck, suggest they type "help"

HELP MANUAL:
${manualText}

Keep responses under 200 words unless detailed explanation is requested. Use plain language. No markdown headers.`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AIHelpWidget(props: AIHelpWidgetProps) {
  const { activeHexId, activeHexLabel, userEmail, userRole } = props;

  const [isExpanded, setIsExpanded] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: `Hi! I can see you're on <strong>${activeHexLabel}</strong>. Ask me anything, or type <strong>help</strong> and I'll figure out what to do here.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [awaitingHelpConfirm, setAwaitingHelpConfirm] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) { messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
  }, [messages, isThinking]);

  // Nudge when page changes
  const prevHexId = useRef(activeHexId);
  useEffect(() => {
    if (prevHexId.current !== activeHexId && prevHexId.current !== "") {
      addAIMessage(
        `I see you switched to <strong>${activeHexLabel}</strong>. Type <strong>help</strong> if you need guidance.`
      );
    }
    prevHexId.current = activeHexId;
  }, [activeHexId]);

  function addUserMessage(content: string) {
    setMessages([{ role: "user", content }]);
  }

  function addAIMessage(content: string, chips?: Chip[], steps?: string[]) {
    setMessages([{ role: "ai", content, chips, steps }]);
  }

  async function handleSend(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || isThinking) return;
    setInput("");
    addUserMessage(text);
    setIsThinking(true);
    try { await handleAIResponse(text); } finally { setIsThinking(false); }
  }

  async function handleAIResponse(text: string) {
    const lower = text.toLowerCase().trim();

    if (lower === "help") {
      setAwaitingHelpConfirm(true);
      const manual = HELP_MANUAL['Wisdom'];
      addAIMessage(
        `It looks like you're trying to <strong>${manual.guess}</strong>. Is that right?`,
        [
          { label: "Yes, walk me through it", value: "yes" },
          { label: "No, something else", value: "no" },
        ]
      );
      return;
    }

    if (awaitingHelpConfirm && ["yes", "yeah", "yep", "correct", "right", "yes, walk me through it"].includes(lower)) {
      setAwaitingHelpConfirm(false);
      showSteps(activeHexId);
      return;
    }

    if (awaitingHelpConfirm && ["no", "nope", "nah", "no, something else"].includes(lower)) {
      setAwaitingHelpConfirm(false);
      addAIMessage(
        "No problem — what are you trying to do? Pick a page:",
        Object.entries(HELP_MANUAL).map(([id, val]) => ({ label: val.guess, value: `help_${id}` }))
      );
      return;
    }

    setAwaitingHelpConfirm(false);

    const newHistory = [...conversationHistory, { role: "user", content: text }];
    const result = await executeAIPrompt({
      prompt: text,
      systemPrompt: buildSystemPrompt(props),
      conversationHistory,
      userEmail,
      userRole,
      includeKnowledgeBase: false,
    });

    if (result.success) {
      setConversationHistory([...newHistory, { role: "assistant", content: result.response }]);
      addAIMessage(result.response);
    } else {
      addAIMessage("I had trouble reaching the AI — please try again.");
    }
  }

  function showSteps(hexId: string) {
    const manual = HELP_MANUAL['Wisdom'];
    addAIMessage(`Here's how to <strong>${manual.guess}</strong>:`, undefined, manual.steps);
  }

  function handleChipClick(chip: Chip) {
    setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? { ...m, chips: undefined } : m)));
    if (chip.value.startsWith("help_")) {
      addUserMessage(chip.label);
      showSteps(chip.value.replace("help_", ""));
    } else {
      handleSend(chip.value);
    }
  }

  const contextBanner = buildContextBanner(props);

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg mb-4 overflow-hidden flex flex-col w-80" style={{ height: "300px" }}>

      {/* Header — blue ✦ icon on left, "Ask Help" on right, clickable to collapse */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b-2 cursor-pointer flex-shrink-0" style={{ backgroundColor: "#0A78AA", borderBottomColor: "#085f87" }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {/* AI sparkle emoji */}
          <span className="text-2xl leading-none flex-shrink-0">✨</span>
          {/* Context pill — shows current page/mode, hidden when collapsed */}
          {isExpanded && contextBanner && (
            <span className="text-xs text-teal-100 truncate max-w-[140px]">{contextBanner}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-semibold">Ask Help</span>
          <span className="text-teal-100 text-xs">{isExpanded ? "▾" : "▴"}</span>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Chat messages area — scrollable, fills available space */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
            {messages.length === 0 && (
              <p className="text-xs text-gray-400 italic">
                Ask a question or type <strong>help</strong> for guided assistance.
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col gap-0.5 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`px-2.5 py-1.5 rounded-lg text-xs leading-relaxed max-w-[90%] ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                  dangerouslySetInnerHTML={{ __html: msg.content }}
                />

                {/* Step list */}
                {msg.steps && msg.steps.length > 0 && (
                  <div className="w-full space-y-1 mt-1">
                    {msg.steps.map((step, si) => (
                      <div key={si} className="flex items-start gap-1.5 text-xs text-gray-700">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">{si + 1}</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggestion chips */}
                {msg.chips && msg.chips.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1 max-w-full">
                    {msg.chips.map((chip, ci) => (
                      <button
                        key={ci}
                        onClick={() => handleChipClick(chip)}
                        className="px-2 py-0.5 rounded-full border border-blue-300 bg-blue-50 text-blue-700 text-xs hover:bg-blue-100 transition-colors"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isThinking && (
              <div className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 rounded-lg w-fit">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area — fixed 60px height, textarea + send button */}
          <div
            className="flex items-start gap-2 px-3 py-2 border-t-2 border-gray-300 flex-shrink-0 bg-white"
            style={{ height: "60px" }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isThinking) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything, or type 'help'…"
              disabled={isThinking}
              rows={2}
              className="flex-1 bg-gray-50 border-2 border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50 resize-none"
              style={{ height: "44px" }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isThinking}
              className="w-7 h-7 mt-0.5 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <span className="text-xs">➤</span>
            </button>
          </div>
        </>
      )}

      {/* Collapsed state — show a hint */}
      {!isExpanded && (
        <div className="flex-1 flex items-center px-3">
          <p className="text-xs text-gray-400 italic">Click to expand AI help</p>
        </div>
      )}
    </div>
  );
}