
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { query } = await request.json()
    
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      console.error('GROQ_API_KEY is not configured')
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured' },
        { status: 500 }
      )
    }

    const tvmazeSearch = await fetch('https://api.tvmaze.com/search/shows?q=' + encodeURIComponent(query))
    const tvmazeData = await tvmazeSearch.json()

    if (!tvmazeSearch.ok || !tvmazeData || tvmazeData.length === 0) {
      const requestBody = {
        model: 'openai/gpt-oss-20b',
        messages: [
          {
            role: 'system',
            content: 'You are a TV show database. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: 'Return a JSON array of 5 popular TV shows related to "' + query + '". For each show include: name, id (lowercase with dashes), year, overview, genres (array), image (empty string), seasons (number), seasonsDetails (array with number and episodeCount). Return ONLY the JSON array.'
          }
        ],
        temperature: 0.3,
        max_tokens: 2500,
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
      
      let results = []
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          results = JSON.parse(jsonMatch[0])
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError)
      }

      return NextResponse.json({ results: Array.isArray(results) ? results : [] })
    }

    const results = tvmazeData.map(item => {
      const show = item.show
      
      return {
        name: show.name,
        id: show.id.toString(),
        tvmazeId: show.id,
        year: show.premiered ? show.premiered.split('-')[0] + '-' + (show.ended ? show.ended.split('-')[0] : 'Present') : 'Unknown',
        overview: show.summary ? show.summary.replace(/<[^>]*>/g, '') : '',
        genres: show.genres || [],
        image: show.image?.medium || '',
        seasons: 0,
        seasonsDetails: []
      }
    })

    for (const show of results) {
      try {
        const seasonsResponse = await fetch('https://api.tvmaze.com/shows/' + show.tvmazeId + '/seasons')
        const seasonsData = await seasonsResponse.json()
        
        if (seasonsResponse.ok && seasonsData) {
          show.seasons = seasonsData.length
          show.seasonsDetails = seasonsData.map(season => ({
            number: season.number,
            episodeCount: season.episodeOrder || 0
          }))
        }
      } catch (error) {
        console.error('Failed to fetch seasons for show ' + show.name + ':', error)
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search for shows' },
      { status: 500 }
    )
  }
}
