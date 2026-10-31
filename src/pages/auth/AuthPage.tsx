import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'
import api from '@/core/api/axios'
import { useAuth } from '@/core/contexts/AuthContext'
import { useLang, type Lang } from '@/core/i18n'
import { useCoreT } from '@/core/i18n/useCoreT'
import { apiErrorText } from '@/core/i18n/errors'
import s from './AuthPage.module.scss'

type Mode = 'login' | 'register'

/** Each language named in itself, so it can be found before signing in. */
const LANGUAGE_NAMES: Record<Lang, string> = { uz: "O'zbekcha", en: 'English' }

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const { lang, setLang } = useLang()
  const t = useCoreT()
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
      setError(apiErrorText(err, lang))
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
      <div className={s.langSwitch} role="radiogroup" aria-label={t.preferences.appLanguage}>
        {(Object.keys(LANGUAGE_NAMES) as Lang[]).map((value) => (
          <button
            key={value}
            role="radio"
            lang={value}
            aria-checked={lang === value}
            className={clsx(s.langOption, lang === value && s.active)}
            onClick={() => setLang(value)}
          >
            {LANGUAGE_NAMES[value]}
          </button>
        ))}
      </div>
      <div className={s.authBrand}>
        <div className={s.logoMark}>
          <LayoutGrid size={18} />
        </div>
        <span className={s.authBrandName}>IAPP</span>
      </div>

      <div className={s.authCard}>
        <h1 className={s.authTitle}>{isLogin ? t.auth.welcomeBack : t.auth.createAccount}</h1>
        <p className={s.authSub}>
          {isLogin ? t.auth.signInSub : t.auth.registerSub}
        </p>

        <div className={s.tabs}>
          <button
            className={clsx(s.tab, isLogin && s.active)}
            onClick={() => { setMode('login'); setError('') }}
          >
            {t.auth.signIn}
          </button>
          <button
            className={clsx(s.tab, !isLogin && s.active)}
            onClick={() => { setMode('register'); setError('') }}
          >
            {t.auth.register}
          </button>
        </div>

        <form onSubmit={handleSubmit} className={s.authForm}>
          <label className={s.field}>
            <span className={s.fieldLabel}>{t.auth.username}</span>
            <div className={s.inputWrap}>
              <input
                className={s.input}
                placeholder={isLogin ? t.auth.usernamePlaceholder : t.auth.newUsernamePlaceholder}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                minLength={3}
              />
            </div>
          </label>

          <label className={s.field}>
            <span className={s.fieldLabel}>{t.auth.password}</span>
            <div className={s.inputWrap}>
              <input
                className={s.input}
                type="password"
                placeholder={isLogin ? t.auth.passwordPlaceholder : t.auth.newPasswordPlaceholder}
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
            {loading ? t.auth.wait : isLogin ? t.auth.signIn : t.auth.createAccount}
          </button>
        </form>

        <p className={s.authSwitch}>
          {isLogin ? t.auth.noAccount : t.auth.haveAccount}{' '}
          <button type="button" onClick={switchMode}>
            {isLogin ? t.auth.register : t.auth.signIn}
          </button>
        </p>
      </div>
    </div>
  )
}
