'use client'

import { Transcriber } from '@/lib/types'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader, Sparkles, RefreshCw, Copy, Check } from 'lucide-react'

interface Props {
  transcriber: Transcriber
}

interface SummaryData {
  summary: string
  keyPoints: string[]
  sentiment: string
}

const AISummary = ({ transcriber }: Props) => {
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedSection, setCopiedSection] = useState<boolean>(false)

  const generateSummary = async () => {
    if (!transcriber.output?.text) {
      setError('No transcript available. Please transcribe audio first.')
      return
    }

    setIsGeneratingSummary(true)
    setError(null)

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: transcriber.output.text
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const data = await response.json()
      setSummaryData(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate summary'
      )
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const resetSummary = () => {
    setSummaryData(null)
    setError(null)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSection(true)
      setTimeout(() => setCopiedSection(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const hasTranscript =
    transcriber.output?.text && transcriber.output.text.trim().length > 0

  return (
    <section className='w-full rounded-lg border p-6 shadow-md'>
      <div className='flex h-full flex-col items-start gap-6'>
        <div className='flex w-full items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Sparkles className='text-primary h-5 w-5' />
            <h3 className='text-lg font-semibold'>AI Summary</h3>
          </div>

          {summaryData && (
            <div className='flex items-center gap-2'>
              <Button variant='outline' size='sm' onClick={resetSummary}>
                <RefreshCw className='h-4 w-4' />
                Reset
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  copyToClipboard(
                    `Summary:\n${summaryData.summary}\n\nKey Points:\n${summaryData.keyPoints?.map(point => `• ${point}`).join('\n') || 'None'}\n\nSentiment:\n${summaryData.sentiment || 'None'}`
                  )
                }
              >
                {copiedSection ? (
                  <Check className='h-4 w-4 text-green-600' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
                Copy All
              </Button>
            </div>
          )}
        </div>

        {!hasTranscript ? (
          <div className='text-muted-foreground flex w-full items-center justify-center py-8'>
            <p>Transcribe audio to generate an AI summary</p>
          </div>
        ) : (
          <>
            {!summaryData && !isGeneratingSummary && (
              <div className='w-full'>
                <Button
                  onClick={generateSummary}
                  className='w-full'
                  disabled={!hasTranscript}
                >
                  <Sparkles className='h-4 w-4' />
                  Generate AI Summary
                </Button>
              </div>
            )}

            {isGeneratingSummary && (
              <div className='text-muted-foreground flex w-full items-center justify-center gap-2 py-8'>
                <Loader className='h-5 w-5 animate-spin' />
                <span>Generating AI summary...</span>
              </div>
            )}

            {error && (
              <div className='border-destructive/50 bg-destructive/10 text-destructive w-full rounded-md border p-4 text-sm'>
                {error}
              </div>
            )}

            {summaryData && (
              <div className='w-full space-y-4'>
                <div className='bg-muted/50 rounded-md border p-4'>
                  <h4 className='text-foreground mb-2 font-medium'>Summary</h4>
                  <p className='text-muted-foreground text-sm leading-relaxed'>
                    {summaryData.summary}
                  </p>
                </div>

                {summaryData.keyPoints && summaryData.keyPoints.length > 0 && (
                  <div className='bg-muted/50 rounded-md border p-4'>
                    <h4 className='text-foreground mb-2 font-medium'>
                      Key Points
                    </h4>
                    <ul className='space-y-1'>
                      {summaryData.keyPoints.map((point, index) => (
                        <li
                          key={index}
                          className='text-muted-foreground flex items-start gap-2 text-sm'
                        >
                          <span className='bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full' />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {summaryData.sentiment && (
                  <div className='bg-muted/50 rounded-md border p-4'>
                    <h4 className='text-foreground mb-2 font-medium'>
                      Sentiment
                    </h4>
                    <p className='text-muted-foreground text-sm'>
                      {summaryData.sentiment}
                    </p>
                  </div>
                )}

                <Button
                  onClick={generateSummary}
                  className='w-full'
                  disabled={isGeneratingSummary}
                >
                  <RefreshCw className='h-4 w-4' />
                  Regenerate Summary
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default AISummary
