
'use client'

import styles from './ShowResults.module.css'

export default function ShowResults({ results, loading, onSelect }) {
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Searching for shows...</p>
      </div>
    )
  }

  if (!results || results.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No shows found. Try searching for a TV show.</p>
      </div>
    )
  }

  return (
    <div className={styles.resultsGrid}>
      {results.map((show, index) => (
        <div 
          key={show.id || index} 
          className={styles.showCard}
          onClick={() => onSelect(show)}
        >
          <div className={styles.showImage}>
            {show.image ? (
              <img src={show.image} alt={show.name} />
            ) : (
              <div className={styles.placeholderImage}>
                <span>📺</span>
              </div>
            )}
          </div>
          <div className={styles.showInfo}>
            <h3 className={styles.showName}>{show.name}</h3>
            {show.year && <span className={styles.showYear}>{show.year}</span>}
            {show.genres && show.genres.length > 0 && (
              <div className={styles.showGenres}>
                {show.genres.slice(0, 3).map((genre, i) => (
                  <span key={i} className={styles.genreTag}>{genre}</span>
                ))}
              </div>
            )}
            {show.seasons && (
              <div className={styles.showSeasons}>
                {show.seasons} Season{show.seasons !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
