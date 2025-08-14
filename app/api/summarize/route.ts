import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const prompt = `Please analyze the following transcript and provide:
1. A concise summary (2-3 sentences)
2. 3-5 key points as bullet points
3. Fix grammar and fill missing words in this raw transcript.


Transcript: "${text}"

Please format your response as JSON with the following structure:
{
  "summary": "your summary here",
  "keyPoints": ["point 1", "point 2", "point 3"],
}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that analyzes transcripts and provides summaries, key points, and sentiment analysis. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to generate summary from OpenAI' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'No content received from OpenAI' },
        { status: 500 }
      )
    }

    // Try to parse the JSON response from OpenAI
    try {
      const parsedContent = JSON.parse(content)
      return NextResponse.json(parsedContent)
    } catch (parseError) {
      // If parsing fails, return a fallback summary
      console.warn('Failed to parse OpenAI response as JSON:', parseError)
      return NextResponse.json({
        summary:
          content.substring(0, 200) + (content.length > 200 ? '...' : ''),
        keyPoints: ['Content analysis completed'],
        sentiment: 'Neutral'
      })
    }
  } catch (error) {
    console.error('Summary generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
