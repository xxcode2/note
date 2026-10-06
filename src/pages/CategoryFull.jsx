import React from 'react'
import { useStore } from '../store.js'
import { CategoryContent } from '../components/CategoryModals.jsx'

// Full-page wrapper used when 3D village is disabled
export default function CategoryFullPage({ catId }) {
  const s = useStore()
  const cat = s.categories.find((c) => c.id === catId)
  if (!cat) {
    return (
      <div className="pad">
        <div className="empty">
          <div className="e-emoji">🌫️</div>
          <h3>Area not found</h3>
          <button className="btn" onClick={() => s.navigate('village')}>Back home</button>
        </div>
      </div>
    )
  }
  return (
    <div className="pad">
      <CategoryContent catId={catId} />
    </div>
  )
}
