import SiteHeader from "@/components/SiteHeader";
import ChatInterface from "@/components/ChatInterface";

export const metadata = {
  title: "Chat — EduPlatform",
  description: "Chat with AI providers: Mistral, Gemini, or Groq",
};

export default function ChatPage() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="chat-page">
        <ChatInterface />
      </main>
      <footer className="site-footer">
        <p>© 2026 Educational Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
