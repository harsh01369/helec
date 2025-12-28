# 🤖 HELEC - AI-Powered Live Chat Support Agent

**Helpful E-commerce Live Engine for Customers**

A real-time AI customer support chat system built for e-commerce stores, featuring intelligent conversation management, Socket.IO real-time messaging, and integration with Groq's LLM API.

🚀 **[Live Demo](https://your-app-name.vercel.app)** | 📺 **[Video Walkthrough](#)** | 📖 **[Documentation](#architecture)**

> **Note:** Add your deployed URLs here after deployment to Vercel (frontend) and Render (backend)

---

## ✨ Features

### Core Functionality
- ✅ **Real-time Chat** - Instant messaging powered by Socket.IO
- ✅ **AI-Powered Responses** - Context-aware answers using Groq (llama-3.3-70b)
- ✅ **Conversation Memory** - Maintains context across multiple messages
- ✅ **Persistent Sessions** - Conversations saved and resumed automatically
- ✅ **Beautiful UI** - Floating chat widget with DaisyUI styling
- ✅ **Error Handling** - Graceful degradation with user-friendly error messages
- ✅ **Input Validation** - Server-side and client-side validation
- ✅ **Typing Indicators** - Shows when AI is processing

### Technical Highlights
- 🔄 Real-time bidirectional communication (Socket.IO)
- 💾 PostgreSQL database with Prisma ORM
- 🎯 TypeScript end-to-end for type safety
- 🎨 SvelteKit 2.0 with Svelte 5 frontend
- ⚡ Fastify backend for high performance
- 🧠 Groq LLM with comprehensive e-commerce knowledge base
- 🔒 Input sanitization and rate limiting ready
- 📱 Responsive design with mobile support

---

## 🏗️ Architecture

### System Overview

```
┌─────────────┐
│   Browser   │
│  (Svelte)   │
└──────┬──────┘
       │ HTTP + WebSocket
       ▼
┌─────────────────┐
│ SvelteKit       │
│ Frontend Server │
│ Port: 5173      │
└──────┬──────────┘
       │ REST API + Socket.IO
       ▼
┌─────────────────┐      ┌──────────────┐
│ Fastify Backend │◄────►│ PostgreSQL   │
│ + Socket.IO     │      │ (via Prisma) │
│ Port: 3000      │      └──────────────┘
└──────┬──────────┘
       │ API Calls
       ▼
┌─────────────────┐
│ Groq LLM API    │
│ llama-3.3-70b   │
└─────────────────┘
```

### Technology Stack

**Backend:**
- Node.js 22+ with TypeScript
- Fastify (web framework)
- Socket.IO (real-time communication)
- Prisma (ORM)
- PostgreSQL (database)
- Groq SDK (LLM integration)
- Zod (validation)

**Frontend:**
- SvelteKit 2.0
- Svelte 5 (next-gen reactivity)
- TailwindCSS + DaisyUI
- Socket.IO Client
- TypeScript

**DevOps:**
- Docker Compose (local PostgreSQL)
- pnpm (monorepo management)
- tsx (TypeScript execution)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- **pnpm** 8.x or higher (`npm install -g pnpm`)
- **Docker** and Docker Compose ([Install](https://docs.docker.com/get-docker/))
- **Groq API Key** ([Get one free](https://console.groq.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/helec.git
   cd helec
   ```

   > **Note:** Replace `YOUR_USERNAME` with your actual GitHub username after pushing

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create `.env` file in the `packages/backend` directory:
   ```bash
   cp packages/backend/.env.example packages/backend/.env
   ```

   Edit `packages/backend/.env` and add your Groq API key:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database (Docker default)
   DATABASE_URL="postgresql://helec_user:helec_pass_2025@localhost:5433/helec_dev?schema=public"

   # Groq LLM API (REQUIRED)
   GROQ_API_KEY=your_groq_api_key_here

   # Optional: Other LLM providers (not currently used)
   ANTHROPIC_API_KEY=
   OPENAI_API_KEY=

   # Security
   JWT_SECRET=your_random_secret_here_change_in_production

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:5173

   # Rate Limiting
   RATE_LIMIT_MAX=100
   RATE_LIMIT_WINDOW_MS=60000
   ```

4. **Start PostgreSQL database**
   ```bash
   docker-compose up -d
   ```

   Verify it's running:
   ```bash
   docker ps
   # Should show postgres container on port 5433
   ```

5. **Run database migrations**
   ```bash
   cd packages/backend
   pnpm prisma migrate dev
   ```

6. **Start the backend server**
   ```bash
   # From packages/backend directory
   pnpm dev
   ```

   You should see:
   ```
   Server listening on http://localhost:3000
   Environment: development
   Ready to accept requests! 🚀
   ```

7. **Start the frontend** (in a new terminal)
   ```bash
   cd packages/frontend
   pnpm dev
   ```

   You should see:
   ```
   VITE v6.4.1  ready in 1676 ms
   ➜  Local:   http://localhost:5173/
   ```

8. **Open the app**

   Visit http://localhost:5173/ in your browser

   Click the 💬 chat bubble in the bottom-right corner and start chatting!

---

## 🧪 Testing the Chat

Try these example conversations to see the AI in action:

1. **Product Inquiries**
   - "Do you sell headphones?"
   - "What's your best laptop for students?"
   - "I need a gift for someone who loves tech"

2. **Policy Questions**
   - "What's your return policy?"
   - "Do you ship internationally?"
   - "How long does shipping take?"

3. **Support Issues**
   - "My order hasn't arrived yet"
   - "I want to return a product"
   - "Do you have warranty on electronics?"

4. **Test Conversation Memory**
   - Send a message about looking for a phone
   - Follow up with "What colors does it come in?"
   - The AI should remember you were asking about a phone

5. **Test Session Persistence**
   - Chat with the bot
   - Refresh the page
   - Your conversation history should still be there!

---

## 📁 Project Structure

```
helec/
├── packages/
│   ├── backend/                    # Backend API server
│   │   ├── src/
│   │   │   ├── config/            # Configuration
│   │   │   │   └── env.ts         # Environment validation
│   │   │   ├── lib/               # Shared utilities
│   │   │   │   └── prisma.ts      # Database client
│   │   │   ├── routes/            # API endpoints
│   │   │   │   └── chat.routes.ts # Chat endpoints
│   │   │   ├── services/          # Business logic
│   │   │   │   └── llm.service.ts # Groq LLM integration
│   │   │   └── server.ts          # Main server + Socket.IO
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Database schema
│   │   │   └── migrations/        # Database migrations
│   │   ├── .env                   # Environment variables (gitignored)
│   │   ├── .env.example           # Environment template
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── frontend/                  # SvelteKit frontend
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   └── ChatWidget.svelte  # Main chat component
│   │   │   ├── routes/
│   │   │   │   ├── +layout.svelte     # Layout wrapper
│   │   │   │   └── +page.svelte       # Home page
│   │   │   ├── app.css            # Global styles
│   │   │   └── app.html           # HTML template
│   │   ├── static/                # Static assets
│   │   ├── package.json
│   │   ├── svelte.config.mjs
│   │   ├── tailwind.config.cjs
│   │   ├── tsconfig.json
│   │   └── vite.config.mjs
│   │
│   └── shared/                    # Shared types (future use)
│
├── docker-compose.yml             # PostgreSQL container
├── package.json                   # Root package.json
├── pnpm-workspace.yaml           # Monorepo config
└── README.md                     # This file
```

---

## 🔌 API Endpoints

### REST API

#### POST `/api/chat/message`
Send a message and get AI response.

**Request:**
```json
{
  "content": "What's your return policy?",
  "conversationId": "optional-uuid-here"
}
```

**Response:**
```json
{
  "status": "success",
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "messages": [
    {
      "id": "msg-123",
      "conversationId": "550e8400-...",
      "content": "What's your return policy?",
      "senderType": "user",
      "createdAt": "2025-12-28T10:00:00Z"
    },
    {
      "id": "msg-124",
      "conversationId": "550e8400-...",
      "content": "We offer 30-day hassle-free returns...",
      "senderType": "assistant",
      "createdAt": "2025-12-28T10:00:01Z"
    }
  ]
}
```

#### GET `/api/chat/conversation/:id`
Retrieve conversation history.

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2025-12-28T10:00:00Z",
    "updatedAt": "2025-12-28T10:05:00Z",
    "messages": [ /* array of messages */ ]
  }
}
```

### Socket.IO Events

#### Client → Server

**`join_conversation`**
```javascript
socket.emit('join_conversation', conversationId);
```

**`send_message`**
```javascript
socket.emit('send_message', {
  content: 'Hello!',
  conversationId: 'uuid-here'
});
```

#### Server → Client

**`new_message`**
```javascript
socket.on('new_message', (message) => {
  // message: { id, conversationId, content, senderType, createdAt }
});
```

**`typing`**
```javascript
socket.on('typing', ({ isTyping }) => {
  // Show/hide typing indicator
});
```

---

## 🧠 LLM Integration

### Provider: Groq

We use **Groq** for ultra-fast LLM inference:
- **Model:** llama-3.3-70b-versatile
- **Temperature:** 0.7 (balanced creativity)
- **Max Tokens:** 600
- **Cost:** ~$0.10 per 1M tokens (very affordable!)

### Why Groq over OpenAI/Claude?

1. **Speed:** 10x faster inference (100+ tokens/sec)
2. **Cost:** 90% cheaper than GPT-4
3. **Quality:** llama-3.3-70b rivals GPT-4 for customer support
4. **Reliability:** Excellent uptime

### Prompt Engineering

Our system prompt is **comprehensive** (300+ lines) covering:
- Store policies (shipping, returns, warranty)
- Product categories and recommendations
- Tone guidelines (friendly, professional, empathetic)
- Conversation flow (greetings, follow-ups, closings)
- Example responses for common scenarios
- Safety guardrails (privacy, security)

**Key Features:**
- Context-aware (uses last 10 messages)
- Proactive suggestions
- Escalation protocols
- Tone matching (formal for complaints, casual for browsing)

---

## 🔒 Security & Robustness

### Input Validation
- ✅ Zod schema validation on all endpoints
- ✅ Message length limits (1-2000 characters)
- ✅ UUID format validation
- ✅ XSS prevention (content sanitization)

### Error Handling
- ✅ Graceful LLM API failures with fallback messages
- ✅ Network error recovery in frontend
- ✅ Database connection error handling
- ✅ User-friendly error toasts (not console.log)

### Security Best Practices
- ✅ Environment variables for secrets
- ✅ CORS configuration
- ✅ SQL injection prevention (Prisma parameterized queries)
- ✅ Rate limiting ready (configured in env)

---

## 🎨 Design Decisions

### Why Monorepo?
- **Shared Types:** Common interfaces between frontend/backend
- **Unified Deployment:** Single repo, easier CI/CD
- **Developer Experience:** Install once, run both servers

### Why SvelteKit over React?
- **Performance:** No virtual DOM, faster rendering
- **Bundle Size:** ~40% smaller than React
- **Developer Experience:** Less boilerplate, cleaner code
- **Future-Proof:** Svelte 5 has the latest reactivity model

### Why Fastify over Express?
- **Speed:** 2x faster request handling
- **TypeScript:** Better native TypeScript support
- **Schema Validation:** Built-in JSON schema validation
- **Modern:** Active development, future-focused

### Why Socket.IO?
- **Reliability:** Auto-reconnection, fallback transports
- **Rooms:** Easy multi-tenant architecture
- **Battle-Tested:** Used by millions of apps
- **Dev Experience:** Simple API, great documentation

### Why Prisma?
- **Type Safety:** Auto-generated TypeScript types
- **Migrations:** Version-controlled database changes
- **Developer Experience:** Intuitive query API
- **Multi-Database:** Easy to switch databases later

---

## 🚧 Trade-offs & "If I Had More Time..."

### Current Limitations

1. **No Authentication**
   - Currently anonymous chat
   - Would add: JWT tokens, user accounts, session management

2. **No Redis Caching**
   - LLM responses not cached
   - Would add: Cache frequent queries, reduce API costs 40%

3. **No Admin Dashboard**
   - Can't view/manage conversations in UI
   - Would add: Admin panel to see all chats, analytics

4. **Hard-Coded Store Info**
   - Policies in prompt, not database
   - Would add: CMS for store policies, product catalog

5. **No File Uploads**
   - Can't share images/documents
   - Would add: Image upload for order issues, screenshots

6. **No Multi-Language Support**
   - English only
   - Would add: i18n, detect user language, translate

### Future Enhancements

**Phase 1 (Next 2 weeks):**
- [ ] User authentication (JWT)
- [ ] Redis caching layer
- [ ] Admin dashboard (view conversations)
- [ ] Rate limiting enforcement
- [ ] Email notifications

**Phase 2 (Next month):**
- [ ] Product catalog integration
- [ ] Order tracking via API
- [ ] Multi-channel support (WhatsApp, Instagram)
- [ ] Analytics dashboard
- [ ] A/B testing framework

**Phase 3 (Long-term):**
- [ ] Voice chat support
- [ ] Video co-browsing
- [ ] AI-powered product recommendations
- [ ] Sentiment analysis
- [ ] Multi-language support

---

## 🚀 Deployment

### Backend Deployment (Render.com)

1. **Create a new Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure the service**
   - **Name:** `helec-backend` (or your preference)
   - **Region:** Choose closest to your users
   - **Branch:** `master` (or `main`)
   - **Root Directory:** Leave blank (monorepo detection)
   - **Runtime:** Node
   - **Build Command:**
     ```bash
     cd packages/backend && pnpm install && npx prisma generate && pnpm build
     ```
   - **Start Command:**
     ```bash
     cd packages/backend && npx prisma migrate deploy && pnpm start
     ```

3. **Add Environment Variables**
   Click "Environment" and add:
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=<your_render_postgres_url>
   GROQ_API_KEY=<your_groq_api_key>
   JWT_SECRET=<generate_strong_random_string>
   FRONTEND_URL=https://your-app-name.vercel.app
   RATE_LIMIT_MAX=100
   RATE_LIMIT_WINDOW_MS=60000
   ```

4. **Provision PostgreSQL Database**
   - In the same Render dashboard, create a new PostgreSQL database
   - Copy the "Internal Database URL"
   - Paste it as `DATABASE_URL` in your web service environment variables
   - **Or use Supabase/Railway for database hosting**

5. **Deploy!**
   - Click "Create Web Service"
   - Wait for build to complete (~3-5 minutes)
   - Copy your backend URL: `https://helec-backend.onrender.com`

### Frontend Deployment (Vercel)

1. **Import Project to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   - **Framework Preset:** SvelteKit
   - **Root Directory:** `packages/frontend`
   - **Build Command:** `pnpm build` (auto-detected)
   - **Output Directory:** `.svelte-kit` (auto-detected)
   - **Install Command:** `pnpm install`

3. **Add Environment Variables**
   Click "Environment Variables" and add:
   ```
   VITE_BACKEND_URL=https://helec-backend.onrender.com
   ```

4. **Deploy!**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your app will be live at: `https://your-app-name.vercel.app`

5. **Update Backend CORS**
   - Go back to Render dashboard
   - Update `FRONTEND_URL` environment variable to your Vercel URL
   - Trigger a redeploy

### Post-Deployment Checklist

- [ ] Test the live chat functionality
- [ ] Verify conversation persistence works
- [ ] Check error handling (try empty message, long message)
- [ ] Test on mobile devices
- [ ] Update README with live URLs
- [ ] Test Socket.IO connection (check real-time messaging)
- [ ] Monitor logs for errors

### Alternative Deployment Options

**Backend Alternatives:**
- **Railway.app** - Similar to Render, great for Node.js
- **Fly.io** - Global edge deployment
- **Heroku** - Classic PaaS (requires credit card)
- **AWS ECS/Fargate** - For production scale

**Frontend Alternatives:**
- **Netlify** - Similar to Vercel
- **Cloudflare Pages** - Fast global CDN
- **GitHub Pages** - Free static hosting (requires adapter)

**Database Alternatives:**
- **Supabase** - Free PostgreSQL with excellent free tier
- **Railway** - Includes PostgreSQL in free tier
- **Neon** - Serverless Postgres
- **PlanetScale** - MySQL alternative (requires schema changes)

---

## 🐛 Troubleshooting

### Database Connection Failed

```
Error: Can't reach database server
```

**Solution:**
1. Ensure Docker is running: `docker ps`
2. Restart PostgreSQL: `docker-compose restart`
3. Check DATABASE_URL in `.env`

### Groq API Errors

```
Error: Invalid API key
```

**Solution:**
1. Verify GROQ_API_KEY in `.env`
2. Get a free key at https://console.groq.com/
3. Check for typos (common issue!)

### Port Already in Use

```
Error: listen EADDRINUSE :::3000
```

**Solution:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000
# Kill it (Windows)
taskkill /F /PID <PID>
# Or use a different port in .env
```

### Frontend Can't Connect to Backend

**Solution:**
1. Check backend is running: `curl http://localhost:3000/health`
2. Check CORS is enabled in `server.ts`
3. Verify `backendUrl` in `ChatWidget.svelte`

---

## 📚 Additional Resources

- **Groq Documentation:** https://console.groq.com/docs/
- **SvelteKit Docs:** https://kit.svelte.dev/
- **Prisma Docs:** https://www.prisma.io/docs/
- **Socket.IO Docs:** https://socket.io/docs/
- **Fastify Docs:** https://fastify.dev/

---

## 📝 License

MIT License - feel free to use this project however you'd like!

---

## 👨‍💻 Author

Built with ❤️ by **Harsh** for the Spur Founding Engineer take-home assignment.

**Contact:**
- GitHub: https://github.com/harsh01369
- Email: work.harshkhetia@gmail.com
- LinkedIn: https://www.linkedin.com/in/harsh-khetia111/

---

## 🙏 Acknowledgments

- **Spur Team** for the opportunity and clear requirements
- **Groq** for providing fast, affordable LLM inference
- **Svelte & SvelteKit** communities for amazing tools
- **Prisma** for making database work enjoyable
- **DaisyUI** for beautiful UI components

---

**⭐ If you found this project helpful, please give it a star!**
