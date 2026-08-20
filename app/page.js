
'use client'

import { useState } from 'react'
import SearchBar from './components/SearchBar'
import ShowResults from './components/ShowResults'
import EpisodeList from './components/EpisodeList'
import styles from './page.module.css'

export default function Home() {
  const [searchResults, setSearchResults] = useState([])
  const [selectedShow, setSelectedShow] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = async (query) => {
    setLoading(true)
    setError(null)
    setSelectedShow(null)
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Search failed')
      }
      
      const data = await response.json()
      setSearchResults(data.results || [])
      
      if (data.results && data.results.length === 0) {
        setError('No shows found. Try a different search term.')
      }
    } catch (err) {
      setError(err.message || 'Failed to search for shows. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleShowSelect = (show) => {
    setSelectedShow(show)
  }

  const handleBack = () => {
    setSelectedShow(null)
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>watchit</h1>
        <p className={styles.subtitle}>Find any TV show, any season, any episode</p>
      </header>
      
      <SearchBar onSearch={handleSearch} loading={loading} />
      
      {error && <div className={styles.error}>{error}</div>}
      
      {selectedShow ? (
        <EpisodeList show={selectedShow} onBack={handleBack} />
      ) : (
        <ShowResults 
          results={searchResults} 
          loading={loading} 
          onSelect={handleShowSelect}
        />
      )}
    </div>
  )
}
