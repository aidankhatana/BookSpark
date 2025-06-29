# BookSpark

> AI-powered assistant that turns your Twitter bookmarks into actionable outcomes

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (see SETUP.md)
# Create .env.local with your API keys

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to get started!

## ✨ Features

- **🔐 Twitter OAuth** - Secure authentication with Twitter
- **📥 Bookmark Sync** - Import your Twitter bookmarks automatically  
- **🤖 AI Analysis** - Get summaries, topics, and action suggestions
- **✅ Action Management** - Mark done, snooze, or archive bookmarks
- **📊 Clean Dashboard** - Modern UI built with Next.js and Tailwind

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-3.5 Turbo
- **External APIs**: Twitter API v2

## 📁 Project Structure

```
📁 BookSpark/
├── 📄 docs/                    # Project documentation
│   ├── 📄 BookSpark_PRD.md         # Product Requirements
│   ├── 📄 Implementation_Plan.md   # Development plan
│   └── 📄 Week_1-2_Guide.md        # Implementation guide
├── 📄 src/
│   ├── 📄 app/                      # Next.js App Router
│   │   ├── 📄 api/                  # API routes
│   │   ├── 📄 dashboard/            # Dashboard page
│   │   └── 📄 layout.tsx            # Root layout
│   └── 📄 lib/                      # Utilities and services
│       ├── 📄 ai/                   # AI content analysis
│       ├── 📄 services/             # Business logic
│       ├── 📄 auth-config.ts        # NextAuth config
│       ├── 📄 supabase.ts           # Database client
│       └── 📄 twitter.ts            # Twitter API client
├── 📄 database/
│   └── 📄 schema.sql                # Database schema
├── 📄 public/                       # Static assets
├── 📄 SETUP.md                      # Setup instructions
└── 📄 package.json                  # Dependencies
```

## 🔧 Setup & Configuration

See [SETUP.md](./SETUP.md) for detailed setup instructions including:

- API key configuration
- Database setup
- OAuth app creation
- Environment variables

## 📚 Documentation

- **[Product Requirements](./docs/BookSpark_PRD.md)** - Full product specification
- **[Implementation Plan](./docs/BookSpark_Implementation_Plan.md)** - Development roadmap
- **[Week 1-2 Guide](./docs/Week_1-2_Development_Guide.md)** - Implementation details

## 🎯 MVP Features (Week 1-2)

✅ **Complete** - All core features implemented:

- Twitter OAuth authentication
- Bookmark sync from Twitter API
- AI-powered content analysis (summaries, topics, actions)
- Dashboard UI for bookmark management
- Status tracking (new, done, snoozed, archived)

## 🚀 Deployment

The application is ready to deploy to:

- **Vercel** (recommended for Next.js)
- **Netlify** 
- **Railway**
- **Any Node.js hosting**

Remember to set up your environment variables in your deployment platform.

## 🤝 Contributing

This is an MVP implementation. Future enhancements could include:

- Email digest functionality
- External integrations (Notion, Todoist)
- Knowledge graph visualization
- Spaced repetition system
- Mobile app

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ using Next.js, OpenAI, and Supabase**
