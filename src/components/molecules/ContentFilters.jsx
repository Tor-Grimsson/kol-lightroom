import { useState, useMemo, useRef, useEffect } from 'react'
import Tag from './Tag.jsx'
import Divider from '../atoms/Divider.jsx'
import Icon from '../loaders/Icon.jsx'
import ViewToggle from './ViewToggle'

/**
 * ContentFilters — universal filter component for content grids.
 *
 * Reusable filter component with expandable panel, tag-based filtering,
 * search, and view-mode toggle. Used across Shop, Collections, Specimens,
 * Typefaces, etc.
 *
 * @param {Object} props
 * @param {Array} props.items — array of items to filter
 * @param {string} props.title — section title (e.g., "Shop", "Collections")
 * @param {number} props.totalCount — total count before filtering
 * @param {Array} props.filterGroups — [{label, key, values}, ...]
 * @param {Function} props.renderItem — (filteredItems, viewMode, layout) => ReactNode
 * @param {Array} props.viewModeOptions — optional view mode options for ViewToggle
 * @param {string} props.defaultViewMode — default view mode (default: 'list')
 * @param {Function} props.onFilterChange — optional callback when filters change
 * @param {Array} props.mutuallyExclusiveFilters — filter keys that should be mutually exclusive
 * @param {Array} props.customFilterKeys — filter keys handled by renderItem, not by ContentFilters
 */
const ContentFilters = ({
  items,
  title,
  totalCount,
  filterGroups = [],
  renderItem,
  viewModeOptions,
  viewMode: viewModeProp,
  onViewModeChange,
  defaultViewMode = 'list',
  layoutOptions,
  defaultLayout = 'grid',
  onFilterChange,
  mutuallyExclusiveFilters = [],
  customFilterKeys = [],
  searchKeys = ['label', 'name', 'title', 'type'],
  headerActions,
  showCountOnlyWhenFiltering = false,
}) => {
  const [activeFilters, setActiveFilters] = useState(new Set())
  const [isExpanded, setIsExpanded] = useState(false)
  const [internalViewMode, setInternalViewMode] = useState(defaultViewMode)
  const viewMode = viewModeProp !== undefined ? viewModeProp : internalViewMode
  const [layout, setLayout] = useState(defaultLayout)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const searchRef = useRef(null)

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus()
  }, [searchOpen])

  const toggleFilter = (filterType, value) => {
    const newFilters = new Set(activeFilters)
    const filterKey = `${filterType}:${value}`
    if (newFilters.has(filterKey)) {
      newFilters.delete(filterKey)
    } else {
      if (mutuallyExclusiveFilters.includes(filterType)) {
        Array.from(newFilters).forEach((existing) => {
          if (existing.startsWith(`${filterType}:`)) newFilters.delete(existing)
        })
      }
      newFilters.add(filterKey)
    }
    setActiveFilters(newFilters)
    onFilterChange?.(newFilters, viewMode)
  }

  const clearAllFilters = () => {
    setActiveFilters(new Set())
    onFilterChange?.(new Set(), viewMode)
  }

  const handleViewModeChange = (mode) => {
    if (onViewModeChange) onViewModeChange(mode)
    else setInternalViewMode(mode)
    onFilterChange?.(activeFilters, mode)
  }

  const filteredItems = useMemo(() => {
    let result = items
    if (searchText) {
      const q = searchText.toLowerCase()
      result = result.filter((item) =>
        searchKeys.some((key) => {
          const val = item[key]
          return val && String(val).toLowerCase().includes(q)
        }),
      )
    }
    if (activeFilters.size === 0) return result
    return result.filter((item) => {
      let matches = true
      activeFilters.forEach((filter) => {
        const [filterType, value] = filter.split(':')
        if (customFilterKeys.includes(filterType)) return
        const itemValue = item[filterType]
        if (Array.isArray(itemValue)) {
          if (!itemValue.includes(value)) matches = false
        } else if (itemValue !== value) {
          matches = false
        }
      })
      return matches
    })
  }, [items, activeFilters, customFilterKeys, searchText, searchKeys])

  const renderFilterGroup = (group) => (
    <div key={group.key}>
      <h4 className="kol-helper-12 text-fg-48">{group.label}</h4>
      <div className="flex flex-wrap gap-2 pt-3">
        {group.values.map((value) => {
          const filterKey = `${group.key}:${value}`
          const isActive = activeFilters.has(filterKey)
          return (
            <div key={value} onClick={() => toggleFilter(group.key, value)}>
              <Tag size="md" variant="default" hash={false} className={isActive ? 'border-fg-32' : 'border-fg-08'}>
                {value}
              </Tag>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="w-full" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-6">
          <h2 className="kol-helper-14">{title}</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-fg-04 rounded-sm transition-colors leading-none"
              aria-label="Toggle filters"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
            >
              <Icon name="filter" size={16} />
            </button>
            <div
              className="flex items-center rounded-full cursor-pointer"
              style={{
                height: 28,
                width: searchOpen ? 200 : 28,
                background: searchOpen ? 'var(--kol-opacity-hex-04, rgba(255,255,255,0.04))' : 'transparent',
                transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1), background 400ms cubic-bezier(0.16, 1, 0.3, 1)',
                overflow: 'hidden',
              }}
              onClick={() => {
                if (searchOpen) { setSearchOpen(false); setSearchText('') }
                else setSearchOpen(true)
              }}
            >
              <span
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 28, height: 28,
                  opacity: searchOpen ? 0 : 1,
                  transition: 'opacity 300ms cubic-bezier(0.16, 1, 0.3, 1)',
                  position: searchOpen ? 'absolute' : 'relative',
                }}
              >
                <Icon name="search" size={16} />
              </span>
              {searchOpen && (
                <input
                  ref={searchRef}
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder=""
                  className="bg-transparent outline-none kol-helper-12 flex-1 text-fg-80 caret-current px-4"
                  onBlur={() => { if (!searchText) setSearchOpen(false) }}
                  onKeyDown={(e) => { if (e.key === 'Escape') { setSearchOpen(false); setSearchText('') } }}
                />
              )}
            </div>
            {headerActions}
          </div>
          {activeFilters.size > 0 && (
            <span
              className="kol-helper-12 text-fg-48 cursor-pointer select-none group flex items-center gap-2"
              onClick={(e) => { e.stopPropagation(); clearAllFilters() }}
            >
              <span className="underline">({activeFilters.size}) {activeFilters.size === 1 ? 'filter' : 'filters'} active</span>
              <span className="hidden group-hover:inline text-fg-64">×</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-8">
          {(!showCountOnlyWhenFiltering || isExpanded || searchOpen || activeFilters.size > 0) && (
            <span className="kol-helper-14 text-fg-64">
              {filteredItems.length} of {totalCount}
            </span>
          )}
          {viewModeOptions && (
            <div className="flex gap-6">
              {viewModeOptions.map((opt) => (
                <span
                  key={opt.value}
                  onClick={() => handleViewModeChange(opt.value)}
                  className={`kol-helper-14 cursor-pointer select-none ${viewMode === opt.value ? 'text-fg-96' : 'text-fg-32 hover:text-fg-48'}`}
                  style={{ textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  {opt.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <Divider className="mb-4" />

      {isExpanded && (
        <div className="flex items-start gap-16 pb-4">
          {filterGroups.map((group) => renderFilterGroup(group))}
          {activeFilters.size > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="kol-helper-12 transition-colors underline text-fg-48"
              style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Clear all ({activeFilters.size})
            </button>
          )}
        </div>
      )}

      {layoutOptions && (
        <div className="flex items-center justify-end gap-4 mt-4">
          {layoutOptions.map((opt) => (
            <span
              key={opt.value}
              onClick={() => setLayout(opt.value)}
              className={`kol-helper-12 cursor-pointer select-none ${layout === opt.value ? 'text-fg-96' : 'text-fg-32 hover:text-fg-48'}`}
              style={{ textTransform: 'uppercase', letterSpacing: 1 }}
            >
              {opt.label}
            </span>
          ))}
        </div>
      )}

      <div className="mt-8" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {renderItem(filteredItems, viewMode, layout)}
      </div>
    </div>
  )
}

export default ContentFilters
