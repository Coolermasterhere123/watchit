
'use client'

import { useState, useEffect } from 'react'
import styles from './EpisodeList.module.css'

export default function EpisodeList({ show, onBack }) {
  const [selectedSeason, setSelectedSeason] = useState(null)
  const [episodes, setEpisodes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  let seasons = show.seasonsDetails || []
  if (seasons.length === 0 && show.seasons) {
    for (let i = 1; i <= show.seasons; i++) {
      seasons.push({ number: i, episodeCount: 0 })
    }
  }

  useEffect(() => {
    if (seasons.length > 0 && !selectedSeason) {
      handleSeasonClick(seasons[0].number)
    }
  }, [])

  const handleSeasonClick = async (seasonNumber) => {
    setSelectedSeason(seasonNumber)
    setLoading(true)
    setError(null)
    setEpisodes(null)
    
    try {
      const response = await fetch('/api/episodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          showName: show.name,
          showId: show.id,
          tvmazeId: show.tvmazeId,
          seasonNumber: seasonNumber 
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch episodes')
      }
      
      const data = await response.json()
      setEpisodes(data.episodes || [])
      
      if (data.episodes && data.episodes.length === 0) {
        setError('No episodes found for this season.')
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load episodes')
      setEpisodes([])
    } finally {
      setLoading(false)
    }
  }

  const searchOnPlutoTV = (episode) => {
    // Build search query: Show Name Season X Episode Y
    const searchQuery = show.name + ' Season ' + selectedSeason + ' Episode ' + episode.number + ' ' + (episode.name || '')
    const encodedQuery = encodeURIComponent(searchQuery)
    // Open Pluto TV search in a new tab using the /ca/search/?term= format
    window.open('https://pluto.tv/ca/search/?term=' + encodedQuery, '_blank')
  }

  return (
    <div className={styles.episodeContainer}>
      <button className={styles.backButton} onClick={onBack}>
        ← Back to Shows
      </button>
      
      <div className={styles.showHeader}>
        <h2 className={styles.showTitle}>{show.name}</h2>
        {show.overview && <p className={styles.showOverview}>{show.overview}</p>}
        {show.year && <span className={styles.showYear}>📅 {show.year}</span>}
      </div>
      
      <div className={styles.seasonsGrid}>
        {seasons.map((season) => (
          <div 
            key={season.number}
            className={styles.seasonCard + (selectedSeason === season.number ? ' ' + styles.active : '')}
            onClick={() => handleSeasonClick(season.number)}
          >
            <div className={styles.seasonInfo}>
              <h3>Season {season.number}</h3>
              {season.episodeCount > 0 && (
                <span className={styles.episodeCount}>
                  {season.episodeCount} Episodes
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {selectedSeason && (
        <div className={styles.episodesSection}>
          <h3 className={styles.episodesTitle}>
            Season {selectedSeason} Episodes
          </h3>
          {loading ? (
            <div className={styles.loadingEpisodes}>
              <div className={styles.loader}></div>
              <p>Loading episodes...</p>
            </div>
          ) : error ? (
            <div className={styles.errorMessage}>{error}</div>
          ) : (
            <div className={styles.episodesList}>
              {episodes && episodes.length > 0 ? (
                episodes.map((episode, index) => {
                  const episodeNumber = episode.number || index + 1
                  
                  return (
                    <div key={index} className={styles.episodeCard}>
                      <div className={styles.episodeNumber}>
                        {episodeNumber}
                      </div>
                      <div className={styles.episodeInfo}>
                        <div className={styles.episodeName}>
                          {episode.name || 'Episode ' + episodeNumber}
                        </div>
                        {episode.airdate && (
                          <div className={styles.episodeDate}>
                            📅 {episode.airdate}
                          </div>
                        )}
                        {episode.overview && (
                          <p className={styles.episodeOverview}>
                            {episode.overview}
                          </p>
                        )}
                        <div className={styles.buttonGroup}>
                          <button 
                            className={styles.plutoButton}
                            onClick={() => searchOnPlutoTV(episode)}
                          >
                            📺 Search on Pluto TV
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className={styles.noEpisodes}>
                  No episodes found for this season.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
