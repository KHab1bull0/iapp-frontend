import { useState } from 'react'
import clsx from 'clsx'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sun, Moon, Plus, SlidersHorizontal } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { useTheme } from '@/contexts/ThemeContext'
import { useMobileFilter } from '@/contexts/MobileFilterContext'
import { formatHeaderDate } from '@/lib/format'
import s from './AppLayout.module.scss'

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { filterOpen } = useMobileFilter()
  const location = useLocation()
  const navigate = useNavigate()
  const isTransactions = location.pathname === '/transactions'

  return (
    <div className={clsx(s.app, sidebarCollapsed && s.collapsed)}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />

      <main className={s.main}>
        <header className={s.mheader}>
          <div className={s.mheaderBrand}>
            <span className={s.mheaderTitle}>IAPP</span>
            <span className={s.mheaderDate}>{formatHeaderDate(new Date())}</span>
          </div>
          <div className={s.mheaderActions}>
            {isTransactions && filterOpen ? (
              <button className={s.iconBtn} onClick={filterOpen} aria-label="Open filters">
                <SlidersHorizontal size={18} />
              </button>
            ) : (
              <button className={s.iconBtn} onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}
          </div>
        </header>

        <div className={s.scroll}>
          <Outlet />
        </div>

        {/* The FAB is itself tablet-and-below only, so it always routes. */}
        <button
          className={s.fab}
          onClick={() => navigate('/transactions/new')}
          aria-label="Add transaction"
        >
          <Plus size={22} />
        </button>

        <BottomNav />
      </main>
    </div>
  )
}
