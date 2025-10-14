import { useState } from 'react'
import './OnboardingScreen.css'

interface OnboardingScreenProps {
  onJoinCrew: (code: string, nickname: string) => Promise<void>
  onCreateCrew: (crewName: string, nickname: string) => Promise<void>
}

export const OnboardingScreen = ({ onJoinCrew, onCreateCrew }: OnboardingScreenProps) => {
  const [mode, setMode] = useState<'select' | 'join' | 'create'>('select')
  const [crewCode, setCrewCode] = useState('')
  const [crewName, setCrewName] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!crewCode.trim() || !nickname.trim()) return

    setLoading(true)
    setError(null)

    try {
      await onJoinCrew(crewCode.trim().toUpperCase(), nickname.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join crew')
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!crewName.trim() || !nickname.trim()) return

    setLoading(true)
    setError(null)

    try {
      await onCreateCrew(crewName.trim(), nickname.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create crew')
      setLoading(false)
    }
  }

  if (mode === 'select') {
    return (
      <div className="onboarding-container">
        <div className="onboarding-card">
          <h1 className="app-title">Crew Map</h1>
          <p className="app-subtitle">Track your crew in real-time</p>

          <div className="button-group">
            <button
              className="primary-button"
              onClick={() => setMode('create')}
              type="button"
            >
              Create New Crew
            </button>
            <button
              className="secondary-button"
              onClick={() => setMode('join')}
              type="button"
            >
              Join Existing Crew
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'join') {
    return (
      <div className="onboarding-container">
        <div className="onboarding-card">
          <button
            className="back-button"
            onClick={() => setMode('select')}
            type="button"
          >
            ← Back
          </button>

          <h2>Join Crew</h2>
          <p className="form-subtitle">Enter the crew code and your nickname</p>

          <form onSubmit={handleJoin}>
            <div className="form-group">
              <label htmlFor="crew-code">Crew Code</label>
              <input
                id="crew-code"
                type="text"
                value={crewCode}
                onChange={(e) => setCrewCode(e.target.value.toUpperCase())}
                placeholder="CONVOY-ABC123"
                className="text-input"
                disabled={loading}
                autoComplete="off"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="nickname">Your Nickname</label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Driver 1"
                className="text-input"
                disabled={loading}
                maxLength={20}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              className="primary-button"
              disabled={loading || !crewCode.trim() || !nickname.trim()}
            >
              {loading ? 'Joining...' : 'Join Crew'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <button
          className="back-button"
          onClick={() => setMode('select')}
          type="button"
        >
          ← Back
        </button>

        <h2>Create Crew</h2>
        <p className="form-subtitle">Start a new crew and get a shareable code</p>

        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label htmlFor="crew-name">Crew Name</label>
            <input
              id="crew-name"
              type="text"
              value={crewName}
              onChange={(e) => setCrewName(e.target.value)}
              placeholder="Night Crew"
              className="text-input"
              disabled={loading}
              maxLength={30}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="nickname-create">Your Nickname</label>
            <input
              id="nickname-create"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Driver 1"
              className="text-input"
              disabled={loading}
              maxLength={20}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="primary-button"
            disabled={loading || !crewName.trim() || !nickname.trim()}
          >
            {loading ? 'Creating...' : 'Create Crew'}
          </button>
        </form>
      </div>
    </div>
  )
}
