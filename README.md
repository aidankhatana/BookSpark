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

- **🎨 Modern UI** - Sleek, professional design inspired by industry leaders
- **🔐 Secure Auth** - Twitter OAuth with encrypted session management
- **📥 Smart Sync** - Automatic Twitter bookmark import with error handling
- **🤖 AI-Powered** - Intelligent content analysis with Google Gemini 2.5 Flash
- **📧 Email Digests** - Curated daily emails with actionable insights
- **⚙️ User Settings** - Customizable preferences and notification timing
- **📊 Advanced Dashboard** - Beautiful analytics and bookmark management
- **🏷️ Smart Filtering** - Status-based filtering with visual indicators
- **📱 Responsive** - Perfect experience across all devices

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini 2.5 Flash (Free)
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

## 🎯 MVP Features & Progress

### ✅ **Week 1-2: Foundation (Complete)**
- Twitter OAuth authentication with secure session management
- Bookmark sync from Twitter API with error handling
- AI-powered content analysis using Google Gemini 2.5 Flash
- Modern, responsive dashboard UI with filtering
- Status tracking (new, pending, done, snoozed, archived)
- Database schema with Row Level Security policies

### ✅ **Week 3-4: Enhanced Features (Complete)**
- **Modern UI Redesign**: Sleek design inspired by Jenni.ai
  - Beautiful landing page with gradient backgrounds
  - Professional dashboard with card-based layout
  - Clean authentication pages with consistent branding
  - Enhanced global CSS with modern typography
- **Email Digest System**: Complete functionality with Resend
  - Test digest functionality for development
  - Daily digest generation with HTML templates
  - User preferences and settings management
- **Settings Page**: Full user preference management
  - Digest timing and timezone settings
  - Account information display
  - Privacy and data usage information
- **Enhanced AI Analysis**: Intelligent action suggestions
  - Context-aware suggestions based on content type
  - Actionable recommendations with specific verbs
  - Improved prompt engineering for better results

### 🚀 **Ready for Production**
All core MVP features are implemented and tested:
- Authentication & authorization
- Data sync & processing
- AI analysis & insights
- Email notifications
- User settings & preferences
- Modern, professional UI/UX

## 🚀 Deployment

The application is ready to deploy to:

- **Vercel** (recommended for Next.js)
- **Netlify** 
- **Railway**
- **Any Node.js hosting**

Remember to set up your environment variables in your deployment platform.

## 🧪 Testing Your Setup

After following the setup instructions in [SETUP.md](./SETUP.md):

1. **Start the application**: `npm run dev`
2. **Visit**: [http://localhost:3000](http://localhost:3000)
3. **Sign in with Twitter** - Test OAuth flow
4. **Sync bookmarks** - Click "Sync Bookmarks" in dashboard
5. **Check AI analysis** - Verify summaries and action suggestions
6. **Test email digest** - Click "Test Digest" button
7. **Try filters** - Use status filters to organize bookmarks
8. **Visit settings** - Customize digest preferences at `/settings`

## 🤝 Future Enhancements

This MVP implementation is production-ready. Potential future features:

- Knowledge graph visualization
- Spaced repetition learning system
- External integrations (Notion, Todoist, Obsidian)
- Browser extension for direct saving
- Mobile app with offline reading
- Team collaboration features
- Advanced analytics and insights

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ using Next.js, Google AI, and Supabase**
