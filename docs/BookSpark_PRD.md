# BookSpark – Product Requirements Document (PRD)

## 1. Introduction & Background

**Product Vision:** BookSpark is an AI-powered assistant that "actionizes" your bookmarks – turning saved links and posts into concrete outcomes. The core value is reducing time-to-outcome: instead of letting saved content languish, BookSpark helps you quickly derive value (tasks, habits, ideas, knowledge) from everything you bookmark.

**Problem Statement:** People constantly save articles, tweets, videos, and posts with the intention to revisit or act on them later. In reality, most of these bookmarks are forgotten or never acted upon:
- A study found that although most users create web bookmarks, they rarely use them for retrieval – only 16% of saved pages were ever accessed via the bookmark menu. In other words, 84% of bookmarks remained out-of-sight, out-of-mind.
- Twitter power users often save dozens of tweets per week, but an unorganized bookmarks list becomes daunting to sift through without additional tools. Users have even clamored for folders or better organization on platforms like Twitter and Instagram.

This "digital junk drawer" problem means valuable information and inspiration get lost. Users miss opportunities to apply what they saved – be it trying a recommended habit, executing a task, or using an idea in their work.

**Proposed Solution:** BookSpark automatically ingests your saved content (e.g. Twitter (X) bookmarks, Instagram saves, etc.) into one centralized "inbox." It then uses AI to summarize and analyze each item, and proactively suggests ways to take action. Key solution components include:
- A daily/weekly digest of your new bookmarks, delivered via email (or in-app), with each item summarized and accompanied by one-click "action" buttons.
- An intelligent agent (LLM-powered) that asks "What do you want to do with this bookmark?" and offers 3–5 context-aware suggestions (e.g. "Add to my to-do list," "Set a daily reminder for this," "Save to inspiration folder," "Summarize this for later").
- Integrations with productivity tools (Notion, Todoist, Trello, etc.) to execute those actions instantly – turning a saved post into a task, a routine, an idea in your library, generated content, or a summary note.
- Features to ensure you actually follow up and learn from saved content: scheduling reminders (or "snoozing" bookmarks), breaking complex content into sub-tasks, and using spaced repetition to review key learnings later.
- A visual knowledge graph that maps how all your saved items relate to each other (via topics or embeddings), giving a high-level view of your interests and sparking new connections.

In essence, BookSpark transforms passive consumption into active results. It's like a second brain that not only stores information (like a bookmarking or read-later app) but also triggers you to use it.

**Target Audience:** Professionals, content creators, and knowledge workers who frequently save online content and want to make better use of it. This includes:
- Content creators & marketers – who save inspiration (tweets, images, articles) and want to generate new content or ideas from it.
- Lifelong learners & professionals – who bookmark articles or research and want to actually implement tips or retain knowledge.
- Productivity enthusiasts – who have read-it-later lists or "second brain" systems but struggle with follow-through. BookSpark simplifies turning insights into actions, without complex manual organization.

By focusing first on platforms like Twitter (X) (which has a high volume of saved educational threads, inspirations, how-tos) and Instagram (saved posts for recipes, workouts, etc.), we address where users often bookmark content but lack tools to act on it.

BookSpark aims to become that trusted inbox for your brain – capture everything interesting in one place, then digest and deploy it so nothing useful slips through the cracks.

## 2. Goals and Non-Goals

**Product Goals:**
- **Increase Bookmark Utility:** Dramatically improve the percentage of saved items that a user actually revisits or uses. (Baseline: only ~16% of bookmarks are ever revisited; BookSpark should raise this significantly by proactive surfacing and action prompts.)
- **Reduce Time to Outcome:** For any given saved link, minimize the friction between saving it and extracting value. For example, if a user bookmarks a "10-minute daily stretch routine" post, within one click they can set up a daily reminder to actually perform that routine.
- **Seamless Integration into Workflow:** Meet users where they already operate – email, existing task apps, etc. Avoid forcing yet another app for them to check. BookSpark's value should come with minimal behavior change (e.g., an email digest each morning; push a button to send to Notion or set a reminder).
- **Delight through Intelligence:** Wow users with how the AI seems to "know what they want to do" with a bookmark. The suggestions should feel intuitive and personalized (e.g., recognizing a saved recipe vs. a coding tutorial vs. an inspirational quote and proposing relevant actions). This creates an instant "aha" moment and drives engagement.
- **Knowledge Retention:** Ensure that if the user is saving informational content (guides, articles), they retain and apply that knowledge. Spaced repetition and resurfacing of summaries or action items should improve long-term recall. (Spaced repetition has been shown to boost recall accuracy to ~80% vs 60% with one-off review, so leveraging it will tangibly improve learning outcomes for users.)
- **Viral Showoff Feature:** Provide a visually appealing way for users to showcase what they're learning or working on – the knowledge graph visualization is intended to be a shareable "wow factor" (e.g., a user might screenshot their interest graph and share it on social media, driving word-of-mouth).

**Non-Goals (Out of Scope for now):**
- **Another General "Read-It-Later" Service:** BookSpark is not primarily about providing a beautiful reading interface or long-term archive for every web page (like Pocket or Instapaper). While it will store original content for reference, the focus is on action and outcomes, not just reading. We won't invest in custom reader modes or full-text search of all content in early versions.
- **Social Features:** The product is envisioned as a personal productivity tool. Features like sharing bookmarks with friends, following others' bookmark feeds, or public content discovery are not in scope for initial versions.
- **Built-in Task Management UI:** Rather than creating a brand new, full-fledged to-do list interface, BookSpark will integrate with existing task/project management tools. We are not trying to replace apps like Notion, Todoist, or Trello on their own turf (which have collectively 100M+ users). Instead, we add a smart layer on top of them. A simple in-app list for those with no integration is a fallback, but not a core focus.
- **Complex AI Model Development:** We will leverage existing Large Language Models (LLMs) (e.g., OpenAI GPT-4 or Google's Gemini) via API for summarization, classification, and content generation. We do not plan to develop custom NLP models from scratch in the early stages. Fine-tuning or prompt engineering for our domain is in scope, but building new ML models is not.
- **Fully Automated Categorization without User Input:** While the AI will suggest categorization (like what type of action might be relevant for a bookmark), we will keep the user in the loop. The user must confirm or choose an action; the system won't automatically execute tasks without user confirmation (to avoid errors or unwanted spam). Over time, as confidence grows, we might streamline this, but initial versions keep a human decision in the loop for each bookmark's fate.

## 3. Use Cases & User Stories

**Use Case 1 – Turning Inspiration into Action:**
Jane is a content creator. She often bookmarks inspirational tweets and Instagram posts (e.g., a Twitter thread on video editing tips, an IG post about a daily workout). Typically, she forgets about these. With BookSpark, Jane receives a weekly digest email of everything she saved with TL;DR summaries. Next to the tweet about video editing, BookSpark suggests: "➜ Add to Task (create a checklist to practice these tips)" and "➜ Generate Something (brainstorm 5 video ideas using these tips)." Jane clicks "Generate Something," and BookSpark returns 5 tailored video content ideas in seconds. One idea is exactly what she needed for her next YouTube script. Another bookmark – a workout routine – has a suggestion "➜ Create Routine (remind me daily at 7am to do this workout)." With one click, Jane sets a daily reminder notification. Result: Jane has tangibly acted on her inspirations – her saved tips become implemented skills and her saved workouts become a healthy habit.

**Use Case 2 – Managing "Read Later" Overload:**
Arun is a busy professional developer. He saves articles about new programming libraries and long reads on tech leadership to his Twitter bookmarks. He also occasionally saves YouTube tutorials intending to watch later. Now he's overwhelmed by dozens of unread items. Enter BookSpark: every morning, it sends a digest of 3 saved items from his backlog. One is a blog post – BookSpark provides a SparkNote summary (key takeaways and relevant links) and a button "➜ Summarize & Stash." Arun clicks it; BookSpark saves a condensed note into his "Tech Reading" Notion database, and even schedules a follow-up task "Implement GraphQL tip from article" due next week. Another item is a YouTube video on a new framework. The digest suggests "➜ Add to Task (schedule time to watch)" or "➜ Generate Something (get a quick outline of the video)." Arun chooses to generate: BookSpark uses the video metadata/transcript to produce a brief outline and key points. Arun skims those in seconds – knowledge gained without watching full 20 minutes – and BookSpark asks if he wants to mark it "Done." He does; the system then schedules a spaced repetition reminder in a week: "Quiz: recall 3 key points from the GraphQL video." Arun feels on top of his learning with minimal effort.

**Use Case 3 – Building a Personal Knowledge Hub:**
Maria is an entrepreneur and voracious reader. She saves tweets about market trends, LinkedIn posts on leadership, and images of design inspiration. Over months of using BookSpark, she accumulates a rich library of ideas and lessons. Whenever she open the BookSpark web dashboard, she can toggle to a visual graph view. Here, clusters of nodes represent themes – e.g., a cluster of "Marketing Ideas" containing related tweets and articles she saved, connected to another cluster of "Startup Advice." Maria finds this graph not only satisfying to see (a map of her brain!), but also useful: clicking a node shows the content and any notes or follow-ups she did. She can discover connections (e.g., two separate saved items that BookSpark's embedding found similar, sparking a new insight). When preparing a pitch deck, Maria uses the Idea Vault to filter all inspiration tagged "📊Stats" and quickly finds that one tweet with a perfect market size statistic she saved months ago. Result: BookSpark serves as Maria's second brain – not just storing knowledge, but helping her retrieve and connect it creatively when needed.

These stories illustrate how different users derive value:
- Immediate, context-aware suggestions turn a passive save into an actionable next step.
- Automation and integration execute that step in the user's preferred tools (email, Notion, calendar, etc.).
- Learning reinforcement ensures saved knowledge isn't lost.
- Visualization provides clarity and serendipity in one's collected ideas.

## 4. Product Features & Requirements

### 4.1 Multi-Platform Bookmark Ingestion

**Supported Sources (MVP):**
- **Twitter (X) Bookmarks:** via API or authorized access. The system will connect to the user's X account (OAuth) and fetch new bookmarks periodically. Requirement: fetch new bookmarks at least daily on Free plan (or near-real-time on paid plans).
- **Browser Extension / Manual Save:** A simple browser button or extension allows users to save any webpage or YouTube video to BookSpark. This covers content from any site (e.g., blog articles) and acts as a fallback if direct API integration is not available. The extension should send the URL (and ideally title/metadata) to BookSpark.
- **Instagram Saves (Planned):** Instagram's API for saved posts is limited; initially we may rely on the user manually forwarding interesting IG links to BookSpark (or use the extension on instagram.com). Future: explore integration if possible or encourage workflow like "DM the link to our bot" for capture.

**Content Retrieval:** When a new bookmark is ingested, BookSpark will retrieve the content behind the link:
- If it's a tweet or thread, fetch the text of the tweet(s).
- If it's an article URL, fetch the page content (using an API like Mercury or by scraping) to generate a summary.
- If it's a YouTube link, use YouTube API or a transcribing service to get video title, description, maybe auto-caption text (for summary generation).
- If it's an image (e.g., an Instagram image with caption), fetch the caption text and note it's an image (maybe we can OCR text in images if relevant, but primarily we treat it as a media bookmark).
- The content retrieval should happen in a background job queue, so as not to slow the user interface.

**Classification & Metadata (AI Analysis):** For each new bookmark item, the system should assign preliminary metadata:
- **Content Type:** e.g. "article", "video", "tweet", "image", "misc". (This could be inferred by URL or content length).
- **Topical Tags or Categories:** Using either NLP topic modeling or heuristics, tag what it's about (e.g., "fitness", "programming", "travel", or more granular if possible). This helps grouping in the digest (cluster related items) and building the graph.
- **Suggested Action Category:** Using an LLM, determine which of the pre-defined action types might be most relevant. (More on action types below.) Example: If content is a "how-to" guide or a tutorial, likely suggest "Add to Task" (to implement it) or "Summarize & Stash" (to capture the main points). If content is a quote or aesthetic inspiration, suggest "Idea Vault". If it's about a habit (exercise, meditation), suggest "Create Routine".
- **Requirement:** Achieve a reasonable accuracy in suggestions, but always allow user to choose different action if they want. (We will monitor suggestion acceptance rate in alpha.)
- **Priority or Recency:** Mark if an item is new or has been snoozed (postponed) before. Also track its "last surfaced date" to avoid spamming the user with the same item repeatedly without action.

**Snoozing & Bookmark Scheduling:** Users may snooze bookmarks they're not ready to act on:
- Provide a "Snooze for 7 days" or custom period button in the digest or interface. This will hide the item until the snooze period elapses, then include it again in that day's digest (or send a separate reminder).
- Items can also be marked "Done" (no further action needed) or archived, which removes them from the active queue entirely (but still searchable/accessible in the stash or graph).
- **Non-functional:** Ensure that snoozed items do indeed resurface on the correct day, via a scheduled job.

### 4.2 Digest Email (Daily/Weekly Summary)

**Digest Delivery:** Users can choose the frequency of digests – daily or weekly. They can also pick the day/time (e.g., every Monday 8am for weekly, or daily at 7am). Pro users get custom scheduling; Free users might be limited to weekly or a fixed schedule (to encourage upgrade).

**Content of Digest:** The email (or in-app feed) will list a selection of recent bookmarks that are pending action:
- For each bookmark, include a title, source, date saved, and a short AI-generated summary ("flash summary"). The summary should be 1-3 sentences giving the gist or key point. This uses an LLM (Gemini or GPT-4) with instructions to be concise and fact-focused. If the bookmark is a simple image or very short tweet, a summary might not be needed – instead just show the content or caption.
- If multiple bookmarks are on the same topic (determined via clustering of embeddings or tags), the digest might group them together (e.g., "You saved 5 items about Machine Learning this week – here's a combined summary or a section listing them"). Nice-to-have: topic grouping can help reduce overload, but if not ready, we list items individually in MVP.

**Call to Action for Each Item:** Under each summary, display a set of action buttons:
- Example buttons: "Mark Done ✅", "Snooze 🔁 7d", and a dropdown or list of smart suggestions (3–5 options generated by AI, phrased as short verbs like "➜ Add to Notion Tasks", "➜ Set Daily Reminder", "➜ Generate Content Ideas", etc.). We'll pre-generate these suggestions server-side when composing the digest, using the bookmark's content and our action prompt library.
- The digest email needs to support buttons that either link to a web confirmation page or trigger via email actions (perhaps a unique link that executes the action when clicked). For example, clicking "Add to Task" could be a link to our server like https://bookspark.ai/action?item=123&type=add_task&token=... which triggers the integration.

**Smart Prompt for Suggestions:** The AI prompt template for suggestions might be: "User saved this content: [summary]. The content type is X. Propose 3-5 possible actions the user might want to do (choose from: Add to Task, Create Routine, Idea Vault, Generate Content, Summarize & Stash, or 'Do nothing now'). Response format: brief action phrases." – These will be turned into the buttons. This gives a dynamic, personalized feel (e.g., for a saved "30-day coding challenge" article, one suggestion might literally say "➜ Turn this into a 30-day Todoist project").

### 4.3 Action Types & Automation

At the heart of BookSpark are the action buttons that transform a bookmark into something useful. We will start with five primary action categories:

1. **➡️ Add to Task / Project**
   - Description: Turn the bookmark into a to-do item, project, or note in the user's task management system.
   - Integrations: Support quick add to Notion, Todoist, and Trello initially.
   - Auto-detect deadlines: If the content includes a time frame, BookSpark should attempt to set a due date.
   - Break down into sub-tasks: If the content is complex, BookSpark's LLM can extract steps into a checklist.

2. **🔁 Create Routine / Reminder**
   - Description: Convert the bookmark into a recurring habit or event.
   - The system should prompt for or infer the frequency.
   - Track compliance: Each reminder provides a "Done for today" or "Skip" button.

3. **💡 Idea Vault (Save as Inspiration)**
   - Description: Save the bookmark into a categorized inspiration library.
   - The user can tag or categorize the idea at save time.
   - Store in an "Idea Vault" section that's searchable and filterable.

4. **✨ Generate Something (AI Content Generation)**
   - Description: Use the bookmark's content as a springboard to create new content.
   - Context-dependent generation based on content type.
   - Might be rate-limited or a premium feature due to LLM usage.

5. **📥 Summarize & Stash**
   - Description: Produce a summary and save both summary and original link in a "Library."
   - Generate brief summary with key takeaways.
   - Offer to schedule reminder to revisit.

### 4.4 Task Integration & Follow-Up

**Notion Integration:** Users connect via OAuth. BookSpark creates pages in designated databases with content, due dates, and sub-tasks.

**Todoist Integration:** Add tasks to user's Todoist with links and descriptions. Support recurring schedules for routines.

**Trello Integration:** Create cards with summaries and labels.

**Bi-Directional Sync:** Track completion status from external tools via webhooks or polling.

### 4.5 Learning & Knowledge Retention (Spaced Repetition)

**Personal Dashboard with Learning Stages:**
- In Progress: items currently being acted on
- To Review: items scheduled for review
- Mastered: items that have passed all review stages

**Spaced Repetition Scheduling:** Schedule follow-ups at intervals (3 days, 7 days, 30 days) with quizzes or reminders.

### 4.6 Knowledge Graph Visualization

**Graph Overview:** Interactive graph view showing connections between saved items via embeddings similarity and metadata.

**Purpose:**
1. Cognitive Map: See clusters of interests
2. Discovery of Connections: Spot unexpected relationships
3. Shareability: Visually appealing representation

### 4.7 Additional Features

- **Platform Delivery:** Web app (responsive) with potential PWA
- **Notifications:** Email and push notifications for reminders
- **Bookmark Management UI:** Interface to view, search, and manage all bookmarks
- **Multi-Platform Capture:** Future expansion to other sources

## 5. Technical Architecture Overview

**Proposed Tech Stack:**
- **Backend:** Node.js with Fastify
- **Database:** Supabase (Postgres)
- **Vector Storage:** pgvector extension
- **Job Queue:** Cloudflare Workers Cron
- **AI Services:** OpenAI/Google Gemini APIs
- **Frontend:** Next.js with App Router + tRPC
- **Graph Library:** D3.js
- **Deployment:** Vercel or Fly.io

## 6. Pricing Strategy (No Free Tier)

| Plan | Price | Key Features |
|------|-------|-------------|
| **Pro** | $15/month | - Real-time sync (15-min intervals)<br>- Unlimited active tasks/routines<br>- Full graph access<br>- Custom digest scheduling<br>- Higher AI usage limits<br>- Priority support |
| **Team** | $35/user/month | - All Pro features<br>- Team sharing & collaboration<br>- Shared knowledge graphs<br>- Admin controls<br>- Custom integrations support |

**No Free Tier Rationale:**
- Reduces support burden
- Attracts serious users who value the service
- Higher LTV per customer
- Simpler product positioning
- Better unit economics from day one

## 7. Roadmap & Milestones

**Phase 0 – Private Alpha (3 weeks):**
- Twitter bookmark ingestion
- Basic daily digest email
- "Add to Notion" integration
- Basic bookmark management UI

**Phase 1 – Public Beta (6 weeks after alpha):**
- Additional integrations (Trello, Todoist)
- Spaced repetition reminders
- Basic graph visualization
- Polished web app UI

**Phase 2 – V1 Launch (8 weeks after Beta):**
- Interactive graph editor
- Analytics & insights
- Payment system and tier restrictions
- Performance optimizations

## 8. Key Benefits & Differentiators

1. **Immediate Gratification:** Daily digest provides value from day one
2. **Actionable Outcomes:** Converts passive reading into concrete next steps
3. **Knowledge Retention:** Spaced repetition ensures learning sticks
4. **"Second Brain" Visualization:** Shareable, unique graph view
5. **Modular but Integrated:** Each feature adds value individually and collectively

## 9. Success Metrics

- **Primary:** Percentage of bookmarks that result in completed actions (target: >50% vs industry baseline of 16%)
- **Engagement:** Daily/weekly digest open rates and click-through rates
- **Retention:** Monthly active users and subscription renewal rates
- **Learning:** Spaced repetition completion rates and self-reported knowledge retention
- **Viral:** Social shares of knowledge graphs and word-of-mouth referrals

## 10. Open Questions & Risks

- **AI Accuracy:** How reliably will LLM suggestions match user intent?
- **API Dependencies:** Risk of Twitter/Instagram changing API access
- **User Adoption:** Will users trust AI to handle their saved content?
- **Scaling Costs:** AI usage costs with growing user base
- **Competition:** Adjacent products adding similar automation features

## 11. Conclusion

BookSpark aims to revolutionize bookmark management by transforming passive saving into active outcomes. Through AI-powered suggestions, seamless integrations, and knowledge retention features, it addresses the core problem that 84% of bookmarks are never revisited. The focus on actionable results, combined with a unique knowledge graph visualization, creates a defensible product that provides clear ROI for users who frequently save and want to act on digital content. 