# HELEC - AI-Powered E-commerce Chat Assistant

**Helpful E-commerce Live Engine for Customers**

A real-time customer support chat system for e-commerce stores with AI-powered responses, built using modern web technologies.

🚀 **[Live Demo](https://helec-frontend.vercel.app)** | 🔧 **[Backend API](https://helec-backend.onrender.com)**

> **Note:** The backend runs on Render's free tier, which means it goes to sleep after 15 minutes of inactivity. The first request after sleep takes 30-60 seconds to wake up the server. Subsequent requests are instant.

---

## What This Does

HELEC is a complete chat support system that lets customers ask questions and get intelligent, context-aware answers in real-time. Think of it as a smart assistant that understands your store's policies, products, and common customer questions.

The system remembers conversation history, so customers don't have to repeat themselves, and it provides helpful responses using AI while maintaining a friendly, professional tone.

### Key Features

- **Real-time messaging** using WebSocket connections (Socket.IO)
- **AI-powered responses** via Groq's llama-3.3-70b model
- **Conversation memory** - maintains context across multiple messages
- **Session persistence** - conversations are saved and can be resumed
- **Clean, responsive UI** with a floating chat widget
- **Mobile-friendly** design that works on all devices
- **Error handling** with user-friendly messages

---

## Live Demo

**Frontend:** https://helec-frontend.vercel.app

**Backend API:** https://helec-backend.onrender.com

Try opening the chat bubble (💬 in the bottom-right) and asking questions like:
- "Do you have laptops?"
- "What's your return policy?"
- "I need help with my order"

---

## Tech Stack

**Backend:**
- Node.js with TypeScript
- Fastify (lightweight web framework)
- Socket.IO for real-time communication
- Prisma ORM with PostgreSQL
- Groq SDK for AI responses

**Frontend:**
- SvelteKit 2.0 with Svelte 5
- TailwindCSS + DaisyUI for styling
- Socket.IO client
- TypeScript throughout

**Infrastructure:**
- Backend deployed on Render.com
- Frontend deployed on Vercel
- PostgreSQL database on Render
- Local development uses Docker Compose

---

## How It Works

```
User Browser
    ↓ (HTTP + WebSocket)
SvelteKit Frontend (Vercel)
    ↓ (REST API + Socket.IO)
Fastify Backend (Render)
    ↓
├─→ PostgreSQL Database (conversation storage)
└─→ Groq API (AI responses)
```

When you send a message:
1. Frontend sends it via Socket.IO to the backend
2. Backend saves the message to PostgreSQL
3. Backend fetches recent conversation history
4. Backend calls Groq API with context
5. AI generates a response
6. Backend saves the response and emits it back
7. Frontend displays the response in real-time

---

## Local Development Setup

### Prerequisites

- Node.js 20+ ([download here](https://nodejs.org/))
- pnpm (`npm install -g pnpm`)
- Docker and Docker Compose ([install here](https://docs.docker.com/get-docker/))
- A Groq API key ([get one free](https://console.groq.com/))

### Installation Steps

1. **Clone the repo**
   ```bash
   git clone https://github.com/harsh01369/helec.git
   cd helec
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Copy the example file:
   ```bash
   cp packages/backend/.env.example packages/backend/.env
   ```

   Edit `packages/backend/.env` and add your Groq API key:
   ```env
   PORT=3000
   NODE_ENV=development
   DATABASE_URL="postgresql://helec_user:helec_pass_2025@localhost:5433/helec_dev?schema=public"
   GROQ_API_KEY=your_actual_groq_api_key_here
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start PostgreSQL**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   cd packages/backend
   pnpm prisma migrate dev
   cd ../..
   ```

6. **Start the backend** (in one terminal)
   ```bash
   cd packages/backend
   pnpm dev
   ```

   You should see:
   ```
   Server listening on http://localhost:3000
   Ready to accept requests! 🚀
   ```

7. **Start the frontend** (in another terminal)
   ```bash
   cd packages/frontend
   pnpm dev
   ```

   You should see:
   ```
   VITE ready in 1676 ms
   ➜  Local:   http://localhost:5173/
   ```

8. **Open your browser**

   Go to http://localhost:5173/ and click the chat bubble!

---

## Project Structure

```
helec/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/          # Environment config
│   │   │   ├── lib/             # Shared utilities
│   │   │   ├── routes/          # API endpoints
│   │   │   ├── services/        # Business logic (LLM integration)
│   │   │   └── server.ts        # Main server + Socket.IO setup
│   │   ├── prisma/
│   │   │   └── schema.prisma    # Database schema
│   │   └── package.json
│   │
│   └── frontend/
│       ├── src/
│       │   ├── lib/
│       │   │   └── ChatWidget.svelte  # Main chat component
│       │   ├── routes/
│       │   │   └── +page.svelte       # Homepage
│       │   └── app.css
│       └── package.json
│
├── docker-compose.yml           # Local PostgreSQL
└── package.json                 # Monorepo root
```

---

## API Endpoints

### REST API

**POST `/api/chat/message`**

Send a message and get an AI response.

Request:
```json
{
  "content": "What's your return policy?",
  "conversationId": "optional-uuid"
}
```

Response:
```json
{
  "status": "success",
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "messages": [
    { /* user message */ },
    { /* assistant response */ }
  ]
}
```

**GET `/api/chat/conversation/:id`**

Get conversation history.

### Socket.IO Events

**Client → Server:**
- `join_conversation` - Join a conversation room
- `send_message` - Send a new message

**Server → Client:**
- `new_message` - New message received
- `typing` - Typing indicator
- `error` - Error notification

---

## Design Decisions

### Why These Technologies?

**SvelteKit over React:**
- Smaller bundle size (~40% smaller)
- Faster rendering (no virtual DOM)
- Cleaner code with less boilerplate
- Svelte 5 has modern reactivity

**Fastify over Express:**
- 2x faster request handling
- Better TypeScript support out of the box
- Modern architecture

**Socket.IO over native WebSockets:**
- Auto-reconnection
- Fallback to polling when needed
- Room support for multi-user scenarios
- Battle-tested reliability

**Groq for AI:**
- 10x faster than OpenAI (100+ tokens/sec)
- 90% cheaper than GPT-4
- llama-3.3-70b quality is excellent for customer support
- Free tier is generous

**Prisma ORM:**
- Type-safe database queries
- Auto-generated TypeScript types
- Easy migrations
- Great developer experience

### Why Monorepo?

Keeping frontend and backend together makes it easier to:
- Share TypeScript types
- Deploy from one repository
- Install dependencies once
- Keep everything in sync

---

## What I'd Add With More Time

**Authentication & User Management**
- Right now it's anonymous chat. I'd add user accounts, login, and proper session management so customers could see their chat history across devices.

**Admin Dashboard**
- A UI for support staff to view all ongoing conversations, jump in when needed, and see analytics like response times and common questions.

**Redis Caching**
- Cache frequently asked questions to reduce LLM API calls and speed up responses. Could cut costs by 40% for common queries.

**Product Catalog Integration**
- Connect to actual product database so the AI can give real-time info on pricing, availability, and specifications instead of generic responses.

**File Uploads**
- Let customers share screenshots of issues or photos of products they're asking about.

**Multi-language Support**
- Detect user language and respond accordingly. Groq's models support many languages well.

**Rate Limiting**
- Prevent abuse by limiting requests per IP or user.

**Analytics Dashboard**
- Track metrics like:
  - Average response time
  - Customer satisfaction
  - Most common questions
  - Peak usage hours

---

## Deployment

The app is deployed and running at:
- Frontend: https://helec-frontend.vercel.app (Vercel)
- Backend: https://helec-backend.onrender.com (Render.com)

### Important Note About Render Free Tier

The backend runs on Render's free tier, which has one quirk: **the server goes to sleep after 15 minutes of no activity**. When it's asleep, the first request will take 30-60 seconds to wake it up. After that, everything is instant.

This is fine for a demo but in production you'd want a paid tier ($7/month) that keeps the server running 24/7.

### How to Deploy Your Own

**Backend (Render):**
1. Create a Web Service on Render
2. Connect your GitHub repo
3. Set build command: `cd packages/backend && pnpm install && npx prisma generate && pnpm build`
4. Set start command: `cd packages/backend && npx prisma migrate deploy && pnpm start`
5. Add environment variables (DATABASE_URL, GROQ_API_KEY, etc.)
6. Add a PostgreSQL database and connect it

**Frontend (Vercel):**
1. Import project on Vercel
2. Set root directory to `packages/frontend`
3. Framework will auto-detect as SvelteKit
4. Add environment variable: `PUBLIC_BACKEND_URL` (your Render backend URL)
5. Deploy!

---

## Troubleshooting

**Database connection fails:**
- Make sure Docker is running: `docker ps`
- Restart: `docker-compose restart`
- Check the DATABASE_URL in your `.env` file

**Groq API errors:**
- Verify your API key is correct
- Get a free key at https://console.groq.com/
- Make sure there are no spaces or quotes around the key

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /F /PID <PID>

# Mac/Linux
lsof -ti:3000 | xargs kill
```

**Frontend can't connect to backend:**
- Check backend is running: open http://localhost:3000/health
- Look at browser console for connection errors
- Verify the backend URL in ChatWidget.svelte

**Render backend is slow:**
- First request after sleep takes 30-60 seconds (free tier limitation)
- Subsequent requests are instant
- Upgrade to paid tier for always-on service

---

## Testing Ideas

Try these conversations to see how the AI handles different scenarios:

**Product questions:**
- "Do you sell headphones?"
- "What laptops do you have for students?"
- "I need a gift for a tech enthusiast"

**Policy questions:**
- "What's your return policy?"
- "Do you ship internationally?"
- "How long does shipping take?"

**Support issues:**
- "My order hasn't arrived"
- "I want to return something"
- "Do you offer warranty?"

**Test memory:**
- Ask about a product
- Then ask "What colors does it come in?"
- The AI should remember what product you asked about

**Test persistence:**
- Have a conversation
- Refresh the page
- Your messages should still be there

---

## Contact

Built by **Harsh Khetia**

- GitHub: https://github.com/harsh01369
- Email: work.harshkhetia@gmail.com
- LinkedIn: https://www.linkedin.com/in/harsh-khetia111/

---

## License

MIT - Feel free to use this however you want!

---

**If you found this helpful, give it a star ⭐**
