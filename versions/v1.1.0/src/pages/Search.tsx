import { useState } from 'react'
import { search, getPeople } from '../api'
import { SignalBadge, SourceIcon, Skeleton } from '../components/UI'
import { Search as SearchIcon, Filter } from 'lucide-react'

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ person: '', source: '', stance: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [people, setPeople] = useState<any[]>([])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      if (people.length === 0) {
        const p = await getPeople()
        setPeople(p.data || p)
      }
      const params: Record<string, string> = { q: query }
      if (filters.person) params.person = filters.person
      if (filters.source) params.source = filters.source
      if (filters.stance) params.stance = filters.stance
      const r = await search(params)
      setResults(r.data || r)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-[28px] font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Search</h1>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <SearchIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-tertiary)' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search contents, signals..."
              className="w-full h-10 pl-10 pr-4 rounded-md border text-sm outline-none"
              style={{ borderColor: 'var(--color-border)' }}
            />
          </div>
          <button type="button" onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 h-10 rounded-md border text-sm"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
            <Filter size={16} /> Filters
          </button>
          <button type="submit" className="px-5 h-10 rounded-md text-white text-sm font-semibold" style={{ background: 'var(--color-primary)' }}>
            Search
          </button>
        </div>

        {showFilters && (
          <div className="flex gap-3 mt-3 p-4 rounded-lg" style={{ background: 'var(--color-bg-secondary)' }}>
            <select value={filters.person} onChange={e => setFilters({ ...filters, person: e.target.value })}
              className="h-9 px-3 rounded-md border text-sm" style={{ borderColor: 'var(--color-border)' }}>
              <option value="">All people</option>
              {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={filters.source} onChange={e => setFilters({ ...filters, source: e.target.value })}
              className="h-9 px-3 rounded-md border text-sm" style={{ borderColor: 'var(--color-border)' }}>
              <option value="">All sources</option>
              <option value="substack">Substack</option>
              <option value="twitter">Twitter</option>
              <option value="reddit">Reddit</option>
              <option value="pdf">PDF</option>
            </select>
            <select value={filters.stance} onChange={e => setFilters({ ...filters, stance: e.target.value })}
              className="h-9 px-3 rounded-md border text-sm" style={{ borderColor: 'var(--color-border)' }}>
              <option value="">All stances</option>
              <option value="bullish">Bullish</option>
              <option value="bearish">Bearish</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>
        )}
      </form>

      {loading ? <Skeleton lines={6} /> : results.length > 0 ? (
        <div className="space-y-3">
          {results.map((item: any) => (
            <div key={item.id} className="border rounded-lg p-4 hover:shadow-sm transition-all" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-start gap-3">
                <SourceIcon type={item.source_type} size={20} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{item.person_name || 'Unknown'}</span>
                    {item.stance && <SignalBadge stance={item.stance} score={item.score} />}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {item.title || item.body?.slice(0, 150)}
                  </p>
                  <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
                    {item.published_at ? new Date(item.published_at).toLocaleString() : ''}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : query && !loading ? (
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No results found.</p>
      ) : null}
    </div>
  )
}
