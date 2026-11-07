import { useMemo, useRef, useState, type DragEvent } from 'react'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Download, FileSpreadsheet, Play, RotateCcw } from 'lucide-react'
import { toast } from '@/core/components/ui/toast'
import { useToday } from '@/core/hooks/useToday'
import {
  englishKeys,
  fetchGroups,
  fetchTags,
  fetchWords,
  importWords,
  type ImportResult,
} from '@/modules/english/api/english'
import { buildTemplate, parseWorkbook, saveFile, type ParsedRow } from '@/modules/english/lib/excel'
import { classify } from '@/modules/english/lib/importPlan'
import { useEnglishT, useGroupName } from '@/modules/english/i18n'
import s from '../EnglishPages.module.scss'
import p from './ImportPage.module.scss'

type Phase =
  | { name: 'idle' }
  | { name: 'reading' }
  | { name: 'error'; message: string }
  | { name: 'preview'; fileName: string; rows: ParsedRow[] }
  | { name: 'done'; result: ImportResult }

/** Rows the preview shows; the rest are counted. */
const SHOWN = 100

/**
 * English → Vocabulary → Import from Excel: download the template (with the
 * user's tags in it), upload it filled in, check what will happen to
 * each row, then add them all in one go.
 */
export function ImportPage() {
  const t = useEnglishT()
  const today = useToday()
  const qc = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>({ name: 'idle' })
  const [preparing, setPreparing] = useState(false)
  const [dragging, setDragging] = useState(false)

  const groupName = useGroupName()
  const { data: tags = [] } = useQuery({ queryKey: englishKeys.tags(today), queryFn: () => fetchTags(today) })
  const { data: groups = [] } = useQuery({ queryKey: englishKeys.groups, queryFn: fetchGroups })
  const { data: words = [] } = useQuery({
    queryKey: englishKeys.words({}),
    queryFn: () => fetchWords({}),
  })

  const rows = useMemo(() => (phase.name === 'preview' ? phase.rows : []), [phase])
  const plan = useMemo(
    () => classify(rows, words.map((w) => w.word), tags),
    [rows, words, tags],
  )

  const add = useMutation({
    mutationFn: () => importWords({ words: plan.toAdd, today, createTags: plan.newTags.length > 0 }),
    onSuccess: async (result) => {
      await qc.invalidateQueries({ queryKey: englishKeys.all })
      toast(t.imp.done(result.created), 'success')
      setPhase({ name: 'done', result })
    },
    onError: () => toast(t.imp.failed, 'error'),
  })

  async function download() {
    setPreparing(true)
    try {
      saveFile(await buildTemplate(tags, groups, t.imp.template, groupName), t.imp.fileName)
    } finally {
      setPreparing(false)
    }
  }

  async function read(file: File | undefined) {
    if (!file) return
    setPhase({ name: 'reading' })
    const parsed = await parseWorkbook(file)
    if (!parsed.ok) return setPhase({ name: 'error', message: t.imp[parsed.error] })
    if (parsed.rows.length === 0) return setPhase({ name: 'error', message: t.imp.empty })
    setPhase({ name: 'preview', fileName: file.name, rows: parsed.rows })
  }

  function reset() {
    setPhase({ name: 'idle' })
    if (input.current) input.current.value = ''
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    void read(e.dataTransfer.files[0])
  }

  if (phase.name === 'done') {
    const { created, skipped, tagsCreated } = phase.result
    return (
      <div className={s.page}>
        <section className={p.done} aria-label={t.imp.done(created)}>
          <CheckCircle2 size={48} className={p.doneIcon} aria-hidden />
          <h1 className={p.doneTitle}>{t.imp.done(created)}</h1>
          {skipped.length > 0 && <p className={p.muted}>{t.imp.exists(skipped.length)}</p>}
          {tagsCreated.length > 0 && <p className={p.muted}>{t.imp.newTags(tagsCreated.join(', '))}</p>}
          <div className={p.doneActions}>
            <Link to="/english/review" className={p.primary}>
              <Play size={16} aria-hidden /> {t.imp.toReview}
            </Link>
            <Link to="/english/vocabulary" className={p.secondary}>
              {t.imp.toVocabulary}
            </Link>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <p className={p.intro}>{t.imp.intro}</p>

      <section className={p.step} aria-labelledby="import-step-1">
        <span className={p.stepNo} aria-hidden>
          1
        </span>
        <div className={p.stepBody}>
          <h2 id="import-step-1" className={p.stepTitle}>
            {t.imp.step1}
          </h2>
          <p className={p.muted}>{t.imp.step1Sub}</p>
          <button type="button" className={p.secondary} onClick={() => void download()} disabled={preparing}>
            <Download size={16} aria-hidden /> {preparing ? t.imp.downloading : t.imp.download}
          </button>
        </div>
      </section>

      <section
        className={clsx(p.step, dragging && p.dragging)}
        aria-labelledby="import-step-2"
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <span className={p.stepNo} aria-hidden>
          2
        </span>
        <div className={p.stepBody}>
          <h2 id="import-step-2" className={p.stepTitle}>
            {t.imp.step2}
          </h2>
          <p className={p.muted}>{t.imp.step2Sub}</p>
          <input
            ref={input}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            aria-label={t.imp.pick}
            onChange={(e) => void read(e.target.files?.[0])}
          />
          {phase.name === 'preview' ? (
            <div className={p.file}>
              <FileSpreadsheet size={18} aria-hidden />
              <span className={p.fileName}>{phase.fileName}</span>
              <button type="button" className={p.link} onClick={reset}>
                <RotateCcw size={14} aria-hidden /> {t.imp.another}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={p.primary}
              onClick={() => input.current?.click()}
              disabled={phase.name === 'reading'}
            >
              <FileSpreadsheet size={16} aria-hidden /> {phase.name === 'reading' ? t.imp.reading : t.imp.pick}
            </button>
          )}
          {phase.name === 'error' && (
            <p className={p.error} role="alert">
              {phase.message}
            </p>
          )}
        </div>
      </section>

      {phase.name === 'preview' && (
        <section className={p.preview} aria-label={t.imp.ready(plan.counts.new)}>
          <ul className={p.summary}>
            <li className={p.good}>{t.imp.ready(plan.counts.new)}</li>
            {plan.counts.exists > 0 && <li>{t.imp.exists(plan.counts.exists)}</li>}
            {plan.counts.repeated > 0 && <li>{t.imp.repeated(plan.counts.repeated)}</li>}
            {plan.counts.invalid > 0 && <li className={p.bad}>{t.imp.invalid(plan.counts.invalid)}</li>}
          </ul>
          {plan.newTags.length > 0 && (
            <p className={p.notice}>{t.imp.newTags(plan.newTags.join(', '))}</p>
          )}

          <div className={p.tableWrap}>
            <table className={p.table}>
              <thead>
                <tr>
                  <th scope="col">{t.imp.line}</th>
                  <th scope="col">{t.word.word}</th>
                  <th scope="col">{t.word.translation}</th>
                  <th scope="col" className={p.wide}>
                    {t.word.description}
                  </th>
                  <th scope="col">{t.word.tags}</th>
                  <th scope="col">{t.imp.status}</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, SHOWN).map((r, i) => {
                  const status = plan.statuses[i]
                  return (
                    <tr key={r.line} className={status === 'new' ? undefined : p.dim}>
                      <td className={p.num}>{r.line}</td>
                      <td className={p.strong} lang="en">
                        {r.row.word}
                      </td>
                      <td>{r.row.translation}</td>
                      <td className={p.wide} lang="en">
                        {r.row.description}
                      </td>
                      <td>{r.row.tags?.join(', ')}</td>
                      <td>
                        <span className={clsx(p.badge, p[status])}>
                          {status === 'invalid'
                            ? r.problems.map((x) => t.imp.problem[x]).join(', ')
                            : status === 'new'
                              ? t.imp.statusNew
                              : status === 'exists'
                                ? t.imp.statusExists
                                : t.imp.statusRepeated}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {rows.length > SHOWN && <p className={p.muted}>{t.imp.more(rows.length - SHOWN)}</p>}

          <div className={p.actions}>
            <button type="button" className={p.secondary} onClick={reset}>
              {t.imp.another}
            </button>
            <button
              type="button"
              className={p.primary}
              disabled={plan.counts.new === 0 || add.isPending}
              onClick={() => add.mutate()}
            >
              {add.isPending ? t.imp.submitting : t.imp.submit(plan.counts.new)}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
