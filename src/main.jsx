import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import vocabulary from './data/vocabulary.json'

const ARTICLES = {
  die: { label: 'die', dir: 'left', emoji: '🌸', hint: '← left' },
  der: { label: 'der', dir: 'right', emoji: '🦊', hint: 'right →' },
  das: { label: 'das', dir: 'up', emoji: '☁️', hint: '↑ up' },
  den: { label: 'den', dir: 'down', emoji: '🍪', hint: '↓ down' },
}

const COLORS = {
  die: 'from-rose-100 to-pink-50 border-rose-200',
  der: 'from-orange-100 to-amber-50 border-orange-200',
  das: 'from-sky-100 to-cyan-50 border-sky-200',
  den: 'from-violet-100 to-purple-50 border-violet-200',
}

function normalizeData(data) {
  return ['die', 'der', 'das', 'den'].flatMap(article =>
    (data[article] || []).map((item, index) => ({
      ...item,
      article,
      id: `${article}-${index}-${item.word}`,
    }))
  )
}

function App() {
  const allWords = useMemo(() => normalizeData(vocabulary), [])
  const [mode, setMode] = useState('play')
  const [deck, setDeck] = useState([])
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(() => Number(localStorage.getItem('article-swipe-best') || 0))
  const [feedback, setFeedback] = useState(null)
  const [search, setSearch] = useState('')
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const start = useRef({ x: 0, y: 0 })

  const resetGame = useCallback(() => {
    const shuffled = [...allWords].sort(() => Math.random() - 0.5)
    setDeck(shuffled)
    setIndex(0)
    setScore(0)
    setStreak(0)
    setFeedback(null)
    setDrag({ x: 0, y: 0 })
    setMode('play')
  }, [allWords])

  useEffect(() => { resetGame() }, [resetGame])

  const current = deck[index]
  const remaining = Math.max(deck.length - index, 0)
  const progress = deck.length ? Math.min((index / deck.length) * 100, 100) : 0

  const submitAnswer = useCallback((article) => {
    if (!current || feedback) return
    const correct = article === current.article
    const nextScore = score + (correct ? 1 : -1)
    const nextStreak = correct ? streak + 1 : 0
    setScore(nextScore)
    setStreak(nextStreak)
    if (nextStreak > best) {
      setBest(nextStreak)
      localStorage.setItem('article-swipe-best', String(nextStreak))
    }
    setFeedback({ correct, chosen: article })
    window.setTimeout(() => {
      setFeedback(null)
      setDrag({ x: 0, y: 0 })
      if (index + 1 >= deck.length) setMode('done')
      else setIndex(i => i + 1)
    }, 560)
  }, [best, current, deck.length, feedback, index, score, streak])

  const commitSwipe = useCallback((x, y) => {
    const ax = Math.abs(x), ay = Math.abs(y)
    if (Math.max(ax, ay) < 85) { setDrag({ x: 0, y: 0 }); return }
    let article
    if (ax > ay) article = x < 0 ? 'die' : 'der'
    else article = y < 0 ? 'das' : 'den'
    submitAnswer(article)
  }, [submitAnswer])

  const onPointerDown = e => {
    if (!current || feedback) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    start.current = { x: e.clientX, y: e.clientY }
    setDragging(true)
  }
  const onPointerMove = e => {
    if (!dragging || feedback) return
    setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y })
  }
  const onPointerUp = e => {
    if (!dragging) return
    setDragging(false)
    commitSwipe(e.clientX - start.current.x, e.clientY - start.current.y)
  }

  useEffect(() => {
    const onKey = e => {
      if (mode !== 'play' || feedback) return
      if (e.key === 'ArrowLeft') submitAnswer('die')
      if (e.key === 'ArrowRight') submitAnswer('der')
      if (e.key === 'ArrowUp') submitAnswer('das')
      if (e.key === 'ArrowDown') submitAnswer('den')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [feedback, mode, submitAnswer])

  const results = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return allWords.filter(x => `${x.word} ${x.meaning} ${x.category}`.toLowerCase().includes(q)).slice(0, 12)
  }, [allWords, search])

  const cardStyle = {
    transform: `translate3d(${drag.x}px, ${drag.y}px, 0) rotate(${drag.x / 18}deg)`,
    transition: dragging ? 'none' : 'transform .22s ease-out',
  }

  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-br from-orange-50 via-rose-50 to-sky-50 px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 flex items-center justify-between gap-3">
          <button onClick={resetGame} className="group flex items-center gap-2 text-left">
            <span className="floaty grid h-11 w-11 place-items-center rounded-2xl bg-white text-2xl shadow-sm">🇩🇪</span>
            <span><span className="block text-lg font-black tracking-tight text-stone-800">Artikel Swipe</span><span className="text-xs font-semibold text-stone-500">German article trainer</span></span>
          </button>
          <div className="flex items-center gap-2 rounded-2xl border border-white/80 bg-white/75 px-3 py-2 shadow-sm backdrop-blur">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Best</span>
            <span className="text-lg font-black text-stone-800">🔥 {best}</span>
          </div>
        </header>

        <section className="mb-5">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔎</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search a German word, meaning or category…" className="w-full rounded-2xl border border-white bg-white/90 py-3.5 pl-11 pr-4 text-sm font-medium text-stone-800 outline-none ring-0 placeholder:text-stone-400 shadow-sm focus:border-orange-200 focus:shadow-md" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-2 py-1 text-sm font-bold text-stone-400 hover:bg-stone-100">✕</button>}
            {results.length > 0 && (
              <div className="absolute z-30 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-white bg-white/95 p-2 shadow-xl backdrop-blur">
                {results.map(item => <button key={item.id} onClick={() => setSearch(item.word)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-orange-50">
                  <span><span className="block font-extrabold text-stone-800">{item.word}</span><span className="text-xs text-stone-500">{item.meaning} · {item.category}</span></span>
                  <span className={`rounded-xl px-3 py-1 text-sm font-black ${COLORS[item.article]} bg-gradient-to-br border`}>{item.article}</span>
                </button>)}
              </div>
            )}
          </div>
        </section>

        {mode === 'done' ? <Done score={score} best={best} total={deck.length} onRestart={resetGame} /> : (
          <>
            <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
              <Stat label="Score" value={`${score >= 0 ? '+' : ''}${score}`} />
              <Stat label="Streak" value={`🔥 ${streak}`} />
              <Stat label="Cards" value={remaining} />
            </div>

            <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/70">
              <div className="h-full rounded-full bg-gradient-to-r from-orange-400 via-rose-400 to-sky-400 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>

            <div className="relative mx-auto h-[430px] max-w-[360px] sm:h-[470px] sm:max-w-[390px]">
              <div className="absolute inset-x-5 top-4 h-[calc(100%-18px)] rounded-[2rem] border border-white/80 bg-white/50 rotate-3" />
              <div className="absolute inset-x-5 top-2 h-[calc(100%-18px)] rounded-[2rem] border border-white/80 bg-white/70 -rotate-2" />
              {current && <article
                onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
                style={cardStyle}
                className={`no-select absolute inset-0 touch-none cursor-grab active:cursor-grabbing rounded-[2rem] border-2 bg-gradient-to-br p-6 card-shadow ${COLORS[current.article]} ${feedback ? (feedback.correct ? 'pop' : 'shake') : ''}`}
              >
                <div className="flex h-full flex-col items-center justify-between text-center">
                  <div className="flex w-full items-center justify-between text-xs font-black uppercase tracking-widest text-stone-400"><span>{current.category}</span><span>{index + 1}/{deck.length}</span></div>
                  <div>
                    <div className="mb-5 text-5xl">{ARTICLES[current.article].emoji}</div>
                    <h1 className="text-4xl font-black tracking-tight text-stone-900 sm:text-5xl">{current.word.replace(/^\w+\s/, '')}</h1>
                    <p className="mt-3 text-lg font-semibold text-stone-500">{current.meaning}</p>
                    <p className="mt-2 text-xs font-bold text-stone-400">Guess the article</p>
                  </div>
                  <div className="w-full">
                    {feedback ? <Feedback correct={feedback.correct} current={current} chosen={feedback.chosen} /> : <div className="grid grid-cols-2 gap-2 text-xs font-black text-stone-500"><span>← die</span><span>der →</span><span>↑ das</span><span>↓ den</span></div>}
                  </div>
                </div>
              </article>}
            </div>

            <div className="mx-auto mt-4 max-w-[460px]">
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {Object.entries(ARTICLES).map(([article, info]) => <button key={article} disabled={!!feedback} onClick={() => submitAnswer(article)} className={`rounded-2xl border-2 bg-gradient-to-br p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-md active:scale-95 disabled:opacity-50 ${COLORS[article]}`}><span className="block text-lg font-black text-stone-800">{article}</span><span className="text-[10px] font-bold text-stone-500">{info.hint}</span></button>)}
              </div>
              <p className="mt-3 text-center text-xs font-semibold text-stone-400">Swipe the card • or use ↑ ↓ ← → keys</p>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

function Stat({ label, value }) { return <div className="rounded-2xl border border-white bg-white/75 px-3 py-2.5 text-center shadow-sm backdrop-blur"><div className="text-[10px] font-black uppercase tracking-widest text-stone-400">{label}</div><div className="text-xl font-black text-stone-800">{value}</div></div> }
function Feedback({ correct, current, chosen }) { return <div className={`rounded-2xl border bg-white/80 px-4 py-3 ${correct ? 'border-emerald-200' : 'border-rose-200'}`}><div className="text-lg font-black">{correct ? '✨ Richtig! +1' : '💥 Nope! −1'}</div><div className="mt-0.5 text-xs font-bold text-stone-500">It’s <span className="text-stone-800">{current.word}</span> · you chose <span className="text-stone-800">{chosen}</span></div></div> }
function Done({ score, best, total, onRestart }) { return <section className="mx-auto max-w-lg rounded-[2rem] border-2 border-white bg-white/85 p-8 text-center shadow-xl backdrop-blur"><div className="mb-3 text-6xl">🏆</div><h2 className="text-3xl font-black text-stone-900">Deck complete!</h2><p className="mt-2 text-stone-500">You swiped through {total.toLocaleString()} cards.</p><div className="my-7 grid grid-cols-2 gap-3"><Stat label="Final score" value={`${score >= 0 ? '+' : ''}${score}`} /><Stat label="Best streak" value={`🔥 ${best}`} /></div><button onClick={onRestart} className="w-full rounded-2xl bg-stone-900 px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-stone-800">Play again ↻</button></section> }

createRoot(document.getElementById('root')).render(<App />)
