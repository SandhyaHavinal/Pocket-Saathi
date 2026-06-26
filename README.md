# Pocket Saathi (Your Empathetic AI Document Companion) 🇮🇳

Pocket Saathi is a full-stack web application designed to break down language barriers and decode complex official terminology in Indian documents (bills, prescription slips, pension notices, scholarship letters, and tax notices) into plain, gentle regional instructions.

---

## ✨ Features

- **Profile-Oriented Translation (Personas):** Tailor simplified document summaries for Student, Senior Citizen, Rural Farmer, Family Head, or Small Business Owner profiles.
- **Multilingual Support:** Translate and clarify content into English, Hindi (हिंदी), Marathi (मराठी), Tamil (தமிழ்), Telugu (తెలుగు), Kannada (ಕನ್ನಡ), Bengali (বাংলা), or Gujarati (ગુજરાતી).
- **Text-to-Speech (TTS) Voice Companion:** Listen to plain-language translations spoken aloud in local regional accents with controllable playback speed.
- **Dynamic Bento Document Hub:** Displays structured actionable takeaways including checklists, safety warnings, financial breakdowns, and government scheme recommendations.
- **Ask Saathi (AI Chatbot):** Integrated conversational follow-up assistant powered by server-side Gemini API.
- **Durable Local Storage Utilities:** Setup alerts and reminders for critical deadlines directly within your browser storage.
- **Dynamic Theme Options:** Toggle between the default clean **Light Theme**, an eye-safe **Dark Theme**, or a soft sepia-toned **Warm/Senior Mode** designed for optimal screen legibility.

---

## 🛠️ Technology Stack

- **Frontend:** React 18+, Vite, Tailwind CSS, Lucide icons, Framer Motion
- **Backend:** Express, Node.js, `@google/genai` TypeScript SDK
- **AI Engine:** Google Gemini (via server-side endpoints for secret protection)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- NPM (v9 or higher)
- A Gemini API Key (set up in `.env` variable)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/pocket-saathi.git
   cd pocket-saathi
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` file based on `.env.example`:
   ```env
   GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
   APP_URL="http://localhost:3000"
   ```

### Running the App
- **Development Server:**
  ```bash
  npm run dev
  ```
- **Production Build & Launch:**
  ```bash
  npm run build
  ```
  ```bash
  npm run start
  ```

---

## 📁 Repository Structure

- `src/` - Client-side React components and views.
  - `App.tsx` - Main app orchestrator with modular tab views and state control.
  - `types.ts` - Shared TypeScript interfaces.
  - `index.css` - Custom styling overrides and theme selectors.
- `server.ts` - Production-ready Express API gateway proxying Gemini requests safely.
- `.env.example` - Sandbox environment templates.
- `metadata.json` - AI Studio applet specifications.

---

## 🛡️ License
This project is licensed under the MIT License.
