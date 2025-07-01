import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || 'placeholder')

interface AnalysisResult {
  summary: string
  contentType: string
  topics: string[]
  suggestedActions: string[]
}

export async function analyzeContent(content: string, url?: string): Promise<AnalysisResult> {
  const prompt = `
Analyze this bookmarked content and provide intelligent, actionable insights:

Content: "${content}"
${url ? `URL: ${url}` : ''}

Provide:
1. Compelling 1-2 sentence summary highlighting the key value or insight
2. Precise content classification
3. 2-4 relevant, focused topic tags (lowercase, no spaces)
4. 3-4 specific, actionable suggestions tailored to content type

For different content types, suggest appropriate actions:
- Learning/Tutorials: "Schedule learning session", "Practice [specific skill]", "Create study notes"
- Tools/Products: "Evaluate for [use case]", "Compare with current tools", "Start free trial"
- Insights/Ideas: "Apply to [specific project]", "Share with [relevant team]", "Brainstorm applications"
- News/Updates: "Monitor for changes", "Update current strategy", "Follow related developments"
- Inspiration: "Save to idea vault", "Create similar content", "Extract key principles"

Use action verbs like: Schedule, Practice, Evaluate, Apply, Research, Create, Monitor, Compare, Document, Implement, Connect, Follow-up.

Respond in JSON format:
{
  "summary": "Engaging summary highlighting value and relevance",
  "contentType": "tutorial|tool|insight|news|inspiration|opinion|thread|article",
  "topics": ["relevant", "keywords"],
  "suggestedActions": [
    "Specific actionable task with clear target",
    "Another targeted suggestion",
    "Third relevant action"
  ]
}

Make suggestions immediately actionable and contextually relevant.
`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const resultText = response.text()
    
    try {
      // Extract JSON from response (Gemini sometimes adds extra text)
      const jsonMatch = resultText.match(/\{[\s\S]*\}/)
      const jsonText = jsonMatch ? jsonMatch[0] : resultText
      const parsed = JSON.parse(jsonText)
      
      // Validate the result structure
      if (!parsed.summary || !parsed.contentType || !Array.isArray(parsed.topics) || !Array.isArray(parsed.suggestedActions)) {
        throw new Error('Invalid AI response structure')
      }
      
      return {
        summary: parsed.summary.slice(0, 200), // Limit summary length
        contentType: parsed.contentType.toLowerCase(),
        topics: parsed.topics.slice(0, 5), // Limit to 5 topics
        suggestedActions: parsed.suggestedActions.slice(0, 5) // Limit to 5 actions
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.error('Raw response:', resultText)
      throw new Error('Invalid AI response format')
    }
  } catch (error) {
    console.error('AI analysis failed:', error)
    
    // Fallback response
    return {
      summary: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
      contentType: 'unknown',
      topics: [],
      suggestedActions: ['Mark as done', 'Save for later'],
    }
  }
}

export async function generateActionSuggestions(content: string, contentType: string): Promise<string[]> {
  const prompt = `
Given this ${contentType} content, suggest 3-5 specific actions a user might want to take:

Content: "${content}"

Focus on actionable suggestions like:
- For tutorials: "Add to task list", "Set reminder to practice", "Schedule learning time"
- For inspiration: "Save for inspiration", "Create similar content", "Share with team"
- For habits/routines: "Set daily reminder", "Create weekly routine", "Track progress"
- For articles: "Summarize key points", "Research more", "Apply to current project"
- For tools/products: "Try this tool", "Compare alternatives", "Add to toolkit"

Respond with a JSON array of action strings:
["action1", "action2", "action3"]
`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const resultText = response.text()
    
    // Extract JSON from response
    const jsonMatch = resultText.match(/\[[\s\S]*\]/)
    const jsonText = jsonMatch ? jsonMatch[0] : resultText
    const actions = JSON.parse(jsonText)
    
    if (Array.isArray(actions)) {
      return actions.slice(0, 5)
    }
    
    throw new Error('Invalid response format')
  } catch (error) {
    console.error('Failed to generate action suggestions:', error)
    
    // Fallback based on content type
    const fallbacks: Record<string, string[]> = {
      tutorial: ['Add to task list', 'Set reminder to practice', 'Schedule learning time'],
      article: ['Summarize key points', 'Research more', 'Apply to project'],
      inspiration: ['Save for inspiration', 'Create similar content', 'Share ideas'],
      habit: ['Set daily reminder', 'Create routine', 'Track progress'],
      default: ['Mark as done', 'Save for later', 'Share with others']
    }
    
    return fallbacks[contentType] || fallbacks.default
  }
} 