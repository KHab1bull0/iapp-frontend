import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'
import api from '@/core/api/axios'
import { useAuth } from '@/core/contexts/AuthContext'
import s from './AuthPage.module.scss'

type Mode = 'login' | 'register'

interface ApiError {
  response?: { data?: { message?: string | string[] } }
}

function extractMessage(err: unknown): string {
  const e = err as ApiError
  const msg = e?.response?.data?.message
  if (Array.isArray(msg)) return msg[0]
  return msg ?? 'Something went wrong'
}

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const { data } = await api.post<{ access_token: string }>(endpoint, { username, password })
      login(data.access_token)
      navigate('/', { replace: true })
    } catch (err) {
      setError(extractMessage(err))
    } finally {
      setLoading(false)
    }
  }

  function switchMode() {
    setMode((m) => (m === 'login' ? 'register' : 'login'))
    setError('')
  }

  const isLogin = mode === 'login'

  return (
    <div className={s.authPage}>
      <div className={s.authBrand}>
        <div className={s.logoMark}>
          <LayoutGrid size={18} />
        </div>
        <span className={s.authBrandName}>IAPP</span>
      </div>

      <div className={s.authCard}>
        <h1 className={s.authTitle}>{isLogin ? 'Welcome back' : 'Create account'}</h1>
        <p className={s.authSub}>
          {isLogin ? 'Sign in to your account' : 'Choose a username and password to get started'}
        </p>

        <div className={s.tabs}>
          <button
            className={clsx(s.tab, isLogin && s.active)}
            onClick={() => { setMode('login'); setError('') }}
          >
            Sign in
          </button>
          <button
            className={clsx(s.tab, !isLogin && s.active)}
            onClick={() => { setMode('register'); setError('') }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className={s.authForm}>
          <label className={s.field}>
            <span className={s.fieldLabel}>Username</span>
            <div className={s.inputWrap}>
              <input
                className={s.input}
                placeholder={isLogin ? 'Your username' : 'Pick a username (3–50 chars)'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                minLength={3}
              />
            </div>
          </label>

          <label className={s.field}>
            <span className={s.fieldLabel}>Password</span>
            <div className={s.inputWrap}>
              <input
                className={s.input}
                type="password"
                placeholder={isLogin ? 'Your password' : 'At least 4 characters'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
                minLength={4}
              />
            </div>
          </label>

          {error && <div className={s.authError} role="alert">{error}</div>}

          <button type="submit" className={s.btnPrimary} disabled={loading}>
            {loading ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className={s.authSwitch}>
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button type="button" onClick={switchMode}>
            {isLogin ? 'Register' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
