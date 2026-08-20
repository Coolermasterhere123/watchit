
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { showName, showId, tvmazeId, seasonNumber } = await request.json()
    
    if (!seasonNumber) {
      return NextResponse.json(
        { error: 'Season number is required' },
        { status: 400 }
      )
    }

    if (tvmazeId) {
      try {
        const seasonsResponse = await fetch('https://api.tvmaze.com/shows/' + tvmazeId + '/seasons')
        const seasonsData = await seasonsResponse.json()
        
        if (!seasonsResponse.ok) {
          throw new Error('Failed to fetch seasons')
        }

        const season = seasonsData.find(s => s.number === seasonNumber)
        if (!season) {
          return NextResponse.json({ episodes: [] })
        }

        const episodesResponse = await fetch('https://api.tvmaze.com/seasons/' + season.id + '/episodes')
        const episodesData = await episodesResponse.json()
        
        if (!episodesResponse.ok) {
          throw new Error('Failed to fetch episodes')
        }

        const episodes = episodesData.map(ep => ({
          number: ep.number,
          name: ep.name,
          airdate: ep.airdate || 'Unknown',
          overview: ep.summary ? ep.summary.replace(/<[^>]*>/g, '') : ''
        }))

        return NextResponse.json({ episodes })
      } catch (error) {
        console.error('TVMaze episode fetch error:', error)
      }
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured' },
        { status: 500 }
      )
    }

    const showIdentifier = showName || showId || 'TV show'
    
    const requestBody = {
      model: 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'system',
          content: 'You are a TV show episode database. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: 'Return a JSON array of episodes for the TV show "' + showIdentifier + '" season ' + seasonNumber + '. Include for each episode: number, name, airdate, overview. Return ONLY the JSON array with no other text.'
        }
      ],
      temperature: 0.4,
      max_tokens: 3000,
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const responseText = await response.text()
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Groq API error: ' + response.status },
        { status: response.status }
      )
    }

    const data = JSON.parse(responseText)
    const content = data.choices?.[0]?.message?.content || '[]'
    
    let episodes = []
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        episodes = JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.error('Failed to parse episodes:', parseError)
    }

    return NextResponse.json({ episodes: Array.isArray(episodes) ? episodes : [] })
  } catch (error) {
    console.error('Episode fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch episodes' },
      { status: 500 }
    )
  }
}
