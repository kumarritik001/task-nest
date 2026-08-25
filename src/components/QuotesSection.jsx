import React, { useState } from 'react'
import { getCriticismQuote, getAppreciationQuote, getAllCriticismQuotes, getAllAppreciationQuotes } from '../utils/quotes'

export default function QuotesSection() {
  const [currentCriticism, setCurrentCriticism] = useState(getCriticismQuote());
  const [currentAppreciation, setCurrentAppreciation] = useState(getAppreciationQuote());
  const [showAllCriticism, setShowAllCriticism] = useState(false);
  const [showAllAppreciation, setShowAllAppreciation] = useState(false);

  const allCriticism = getAllCriticismQuotes();
  const allAppreciation = getAllAppreciationQuotes();

  return (
    <div>
      <div className="page-header">
        <h1>Reality Check & Motivation</h1>
        <p>When you need a push — or a pat on the back</p>
      </div>

      {/* Current Featured Quotes */}
      <div className="grid-2" style={{ marginBottom: '28px' }}>
        <div className="quote-card criticism">
          <p>"{currentCriticism.text}"</p>
          <div className="quote-author">— {currentCriticism.author}</div>
          <button
            className="btn btn-sm btn-secondary"
            style={{ marginTop: '12px' }}
            onClick={() => setCurrentCriticism(getCriticismQuote())}
          >
            🔄 New Quote
          </button>
        </div>

        <div className="quote-card appreciation">
          <p>"{currentAppreciation.text}"</p>
          <div className="quote-author">— {currentAppreciation.author}</div>
          <button
            className="btn btn-sm btn-secondary"
            style={{ marginTop: '12px' }}
            onClick={() => setCurrentAppreciation(getAppreciationQuote())}
          >
            🔄 New Quote
          </button>
        </div>
      </div>

      {/* All Criticism */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--hard)' }}>🔥 When You're Slacking</h3>
          <button className="btn btn-sm btn-secondary" onClick={() => setShowAllCriticism(!showAllCriticism)}>
            {showAllCriticism ? 'Show Less' : `Show All (${allCriticism.length})`}
          </button>
        </div>
        {(showAllCriticism ? allCriticism : [currentCriticism]).map((q, i) => (
          <div key={i} className="quote-card criticism">
            <p>"{q.text}"</p>
            <div className="quote-author">— {q.author}</div>
          </div>
        ))}
      </div>

      {/* All Appreciation */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--easy)' }}>💪 When You're Grinding</h3>
          <button className="btn btn-sm btn-secondary" onClick={() => setShowAllAppreciation(!showAllAppreciation)}>
            {showAllAppreciation ? 'Show Less' : `Show All (${allAppreciation.length})`}
          </button>
        </div>
        {(showAllAppreciation ? allAppreciation : [currentAppreciation]).map((q, i) => (
          <div key={i} className="quote-card appreciation">
            <p>"{q.text}"</p>
            <div className="quote-author">— {q.author}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
