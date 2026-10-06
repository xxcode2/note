import React, { useRef } from 'react'
import { useStore } from '../store.js'
import { Seg, Switch } from '../components/Kit.jsx'
import { EMOJI_CHOICES } from '../lib/helpers.js'

const Row = ({ label, hint, children }) => (
  <div className="set-row">
    <div><div style={{ fontWeight: 700, fontSize: 13.5 }}>{label}</div>{hint && <div className="muted small">{hint}</div>}</div>
    {children}
  </div>
)

export default function SettingsPage() {
  const s = useStore()
  const st = s.settings
  const fileRef = useRef()

  const onImport = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const text = await f.text()
    const err = s.importData(text)
    if (err) s.toast('⚠ ' + err, { type: 'notify' })
  }

  return (
    <div className="pad">
      <h1 className="page-title">⚙️ Settings</h1>
      <p className="page-sub">Shape the world and how it behaves.</p>

      <div style={{ height: 20 }} />

      {/* Appearance */}
      <div className="set-section">
        <h3>🎨 Appearance</h3>
        <div className="set-grid">
          <div className="set-card">
            <Row label="Theme"><Seg options={['dark', 'light', 'auto']} value={st.theme} onChange={(theme) => s.updateSettings({ theme })} /></Row>
            <Row label="Environment" hint="The mood of your village sky"><Seg options={['day', 'sunset', 'night']} value={st.environment} onChange={(environment) => s.updateSettings({ environment, autoEnv: false })} labels={['☀️ Day', '🌇 Sunset', '🌙 Night']} /></Row>
            <Row label="Ikuti jam nyata" hint="Langit desa otomatis berubah pagi/siang/senja/malam sesuai waktu laptop"><Switch on={st.autoEnv} onChange={(autoEnv) => s.updateSettings({ autoEnv })} /></Row>
            <Row label="Weather"><Seg options={['clear', 'rain', 'snow', 'off']} value={st.weather} onChange={(weather) => s.updateSettings({ weather })} labels={['Clear', '🌧 Rain', '❄ Snow', 'Off']} /></Row>
          </div>
          <div className="set-card">
            <Row label="Camera"><Seg options={['isometric', 'free', 'minimal']} value={st.camera} onChange={(camera) => s.updateSettings({ camera })} /></Row>
            <Row label="Animations" hint="Full · Reduced · Off"><Seg options={['full', 'reduced', 'off']} value={st.animations} onChange={(animations) => s.updateSettings({ animations })} /></Row>
            <Row label="Gamification" hint="Subtle progress feedback when things get done"><Switch on={st.gamification} onChange={(gamification) => s.updateSettings({ gamification })} /></Row>
          </div>
        </div>
      </div>

      {/* Village */}
      <div className="set-section">
        <h3>🏡 Village</h3>
        <div className="set-card">
          <Row label="Enable 3D village"><Switch on={st.enable3D} onChange={(enable3D) => s.updateSettings({ enable3D })} /></Row>
          <Row label="Building shadows"><Switch on={st.shadows} onChange={(shadows) => s.updateSettings({ shadows })} /></Row>
          <Row label="Wandering NPC"><Switch on={st.npc} onChange={(npc) => s.updateSettings({ npc })} /></Row>
          <Row label="Floating particles"><Switch on={st.particles} onChange={(particles) => s.updateSettings({ particles })} /></Row>
          <Row label="Ambient effects" hint="Clouds, birds, street lights"><Switch on={st.ambient} onChange={(ambient) => s.updateSettings({ ambient })} /></Row>
          <Row label="Water animation"><Switch on={st.waterAnim} onChange={(waterAnim) => s.updateSettings({ waterAnim })} /></Row>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 10 }}>
            <span className="muted small" style={{ alignSelf: 'center', marginRight: 4 }}>Quick renovate:</span>
            {s.categories.map((c) => (
              <span key={c.id} className="chip pick" onClick={() => s.setUi({ catEditor: { open: true, catId: c.id } })}>{c.icon} {c.name}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Notes defaults */}
      <div className="set-section">
        <h3>📝 Notes</h3>
        <div className="set-card">
          <Row label="Default category">
            <select style={{ width: 200 }} value={st.defaultCategory || ''} onChange={(e) => s.updateSettings({ defaultCategory: e.target.value || null })}>
              <option value="">— none —</option>
              {s.categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </Row>
          <Row label="Default priority"><Seg options={['Low', 'Medium', 'High', 'Critical']} value={st.defaultPriority} onChange={(defaultPriority) => s.updateSettings({ defaultPriority })} /></Row>
          <Row label="Default status">
            <select style={{ width: 200 }} value={st.defaultStatus} onChange={(e) => s.updateSettings({ defaultStatus: e.target.value })}>
              {['Inbox', 'Todo', 'In Progress', 'Waiting'].map((x) => <option key={x}>{x}</option>)}
            </select>
          </Row>
        </div>
      </div>

      {/* Notifications */}
      <div className="set-section">
        <h3>🔔 Notifications</h3>
        <div className="set-card">
          <Row label="Reminders"><Switch on={st.notify.reminders} onChange={(v) => s.updateSettings({ notify: { reminders: v } })} /></Row>
          <Row label="Due-date notices" hint="Today / tomorrow / overdue"><Switch on={st.notify.dueDates} onChange={(v) => s.updateSettings({ notify: { dueDates: v } })} /></Row>
          <Row label="Browser notifications" hint="Requires permission; in-app always works">
            <Switch on={st.notify.browser} onChange={(v) => {
              if (v && 'Notification' in window && Notification.permission !== 'granted') Notification.requestPermission()
              s.updateSettings({ notify: { browser: v } })
            }} />
          </Row>
        </div>
      </div>

      {/* Personalization */}
      <div className="set-section">
        <h3>✨ Personalization</h3>
        <div className="set-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
            <label className="field"><span className="lbl">Workspace name</span>
              <input value={s.workspace.name} onChange={(e) => s.updateWorkspace({ name: e.target.value })} /></label>
            <label className="field"><span className="lbl">Village name</span>
              <input value={s.workspace.villageName} onChange={(e) => s.updateWorkspace({ villageName: e.target.value })} /></label>
            <label className="field"><span className="lbl">Greeting line</span>
              <input value={s.workspace.greeting} onChange={(e) => s.updateWorkspace({ greeting: e.target.value })} /></label>
          </div>
          <div>
            <div className="lbl muted small" style={{ marginBottom: 6, fontWeight: 700 }}>Avatar</div>
            <div className="emoji-pick">
              {['🧑‍🌾', '👤', '🧑‍💻', '🦊', '🐻', '🌸', '⚡', '🧙', '🐧', '🌙'].map((e) => (
                <button key={e} className={s.workspace.avatar === e ? 'sel' : ''} onClick={() => s.updateWorkspace({ avatar: e })}>{e}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="set-section">
        <h3>💾 Data · local-first</h3>
        <div className="set-card">
          <p className="muted small" style={{ marginBottom: 12 }}>Everything lives in your browser (IndexedDB). Export regularly for safekeeping — the JSON can be re-imported here or later synced to a backend.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => s.exportData()}>⬇ Export JSON</button>
            <button className="btn" onClick={() => fileRef.current?.click()}>⬆ Import / restore</button>
            <input ref={fileRef} type="file" accept=".json" hidden onChange={onImport} />
            <button className="btn" onClick={() => s.loadDemo()}>🏘 Reload sample village</button>
            <button className="btn danger" onClick={() => { if (confirm('Erase the entire world and start over? Export first!')) s.resetAll() }}>☠ Reset everything</button>
          </div>
        </div>
      </div>
    </div>
  )
}
