import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { englishKeys, fetchWord } from '@/modules/english/api/english'
import { WordForm } from '@/modules/english/components/WordForm'
import { useEnglishT } from '@/modules/english/i18n'
import s from './WordFormPage.module.scss'

/** Add/edit a word: a page of its own on every screen size, outside the app shell. */
export function WordFormPage() {
  const t = useEnglishT()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const close = () => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/english/vocabulary'))


  const { data: word, isLoading, isError } = useQuery({
    queryKey: englishKeys.word(id ?? ''),
    queryFn: () => fetchWord(id!),
    enabled: isEdit,
  })

  return (
    <div className={s.page}>
      <header className={s.head}>
        <button className={s.backBtn} onClick={close} aria-label={t.word.back}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={s.h1}>{isEdit ? t.word.editTitle : t.word.newTitle}</h1>
      </header>
      <div className={s.body}>
        {isEdit && isLoading ? null : isEdit && (isError || !word) ? (
          <div className={s.state}>{t.word.notFound}</div>
        ) : (
          <WordForm word={word ?? null} onSaved={close} onCancel={close} />
        )}
      </div>
    </div>
  )
}
