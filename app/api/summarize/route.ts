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

1) First, correct the raw transcript internally:
   - Fix grammar, punctuation, spelling, and fill obvious missing words to make the transcript readable while preserving original meaning and speaker voice.
   - Mark any uncertain or inferred insertions with square brackets, e.g. "[probably]".
   - Do NOT include the corrected transcript in the final output; use the corrected transcript only to produce the summary and key points.
   - Do not invent facts or add new claims not implied by the original text.

2) Then, produce:
   a. A full, thorough summary (no length limit) that captures every meaningful idea, context, nuance, and relevant inference. If you make any high-level inferences (tone, intent, context), label them explicitly as an inference.
   b. Key points as an array containing as many items as needed to cover all significant details from the transcript (no fixed number).

Output MUST be valid JSON only (no extra text) and MUST follow this exact structure — do not add, remove, or rename fields:

{
  "summary": "your full, unlimited-length summary here",
  "keyPoints": ["point 1", "point 2", "point 3", "... add as many points as needed ..."]
}

Transcript: "${text}"`

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
