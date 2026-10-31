import { defineMessages, useMessages } from '@/core/i18n'
import type { RepeatUnit } from './api/tasks'

const UZ_UNIT: Record<RepeatUnit, string> = { day: 'kun', week: 'hafta', month: 'oy' }
const enUnit = (n: number, unit: RepeatUnit) => `${n} ${unit}${n === 1 ? '' : 's'}`

const enOrdinal = (n: number) => {
  const tens = n % 100
  if (tens >= 11 && tens <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
}

export const tasksMessages = defineMessages(
  {
    title: 'Vazifalar',
    add: "Vazifa qo'shish",
    newTask: 'Yangi vazifa',
    editTask: 'Vazifani tahrirlash',
    back: 'Orqaga',
    notFound: "Vazifa topilmadi. U o'chirilgan bo'lishi mumkin.",
    retry: 'Qayta urinish',
    loadFailed: 'Vazifalarni yuklab bo‘lmadi',
    overdue: 'Kechikkan',
    today: 'Bugun',
    done: 'Bajarilgan',
    nothingToday: "Bugun vazifa yo'q",
    nothingTodaySub: 'Keyingisini “Barcha vazifalar”da rejalashtiring.',
    noTasks: "Hali vazifa yo'q",
    noTasksSub: "+ tugmasi bilan qo'shing: bir martalik, jadval bo'yicha yoki bajarilgandan keyin.",
    completeLabel: (title: string) => `${title} — bajarildi`,
    undoLabel: (title: string) => `${title} — qaytarish`,
    doneToast: (title: string) => `“${title}” bajarildi`,
    undo: 'Qaytarish',
    undoFailed: 'Qaytarib bo‘lmadi',
    completeFailed: 'Vazifani bajarib bo‘lmadi',
    home: {
      failed: 'Bugungi vazifalarni yuklab bo‘lmadi',
      due: (n: number) => `Bugun ${n} ta vazifa`,
      overdue: (n: number) => `${n} ta kechikkan`,
    },
    form: {
      title: 'Nomi',
      titlePlaceholder: 'Nima qilish kerak?',
      date: 'Sana',
      nextDate: 'Keyingi sana',
      time: 'Vaqt',
      noDateHint: "Sanasiz vazifa “Barcha vazifalar”da qoladi va “Bugun”da chiqmaydi.",
      repeat: 'Takrorlash',
      modes: {
        none: { label: 'Bir marta', hint: 'Bir martalik vazifa' },
        schedule: { label: "Jadval bo'yicha", hint: "Belgilangan kunlarda, kalendar kabi. O'tkazib yuborilgan kunlar to'planmaydi." },
        after_done: { label: 'Bajarilgandan keyin', hint: 'Oxirgi marta bajargan kuningizdan hisoblanadi.' },
      },
      every: 'Har',
      unit: 'Birlik',
      // Uzbek nouns don't change after a number (3 kun), so the count isn't used.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      unitLabel: (unit: RepeatUnit, _n: number) => UZ_UNIT[unit],
      on: 'Kunlari',
      weekdays: 'Hafta kunlari',
      note: 'Izoh',
      optional: 'Ixtiyoriy',
      save: 'Saqlash',
      saving: 'Saqlanmoqda…',
      cancel: 'Bekor qilish',
      delete: "O'chirish",
      deleteTitle: (title: string) => `“${title}” o'chirilsinmi?`,
      deleteDesc: "Vazifa va uning tarixi o'chiriladi. Buni qaytarib bo'lmaydi.",
      added: "Vazifa qo'shildi",
      updated: 'Vazifa yangilandi',
      saveFailed: 'Vazifani saqlab bo‘lmadi',
      deleted: "Vazifa o'chirildi",
      deleteFailed: "Vazifani o'chirib bo‘lmadi",
    },
    repeat: {
      weekdays: ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'],
      everyOne: (unit: RepeatUnit) => ({ day: 'Har kuni', week: 'Har hafta', month: 'Har oy' })[unit],
      everyN: (n: number, unit: RepeatUnit) => `Har ${n} ${UZ_UNIT[unit]}da`,
      everyNWeeks: (n: number, days: string) => `Har ${n} haftada: ${days}`,
      monthly: (n: number, day: number) => (n === 1 ? `Har oyning ${day}-sanasida` : `Har ${n} oyda, ${day}-sanasida`),
      afterDone: (n: number, unit: RepeatUnit) => `Bajarilgandan ${n} ${UZ_UNIT[unit]} keyin`,
    },
    due: {
      noDate: 'Sanasiz',
      today: 'Bugun',
      tomorrow: 'Ertaga',
      overdue: (n: number) => `${n} kun kechikdi`,
    },
    groups: {
      overdue: 'Kechikkan',
      today: 'Bugun',
      tomorrow: 'Ertaga',
      week: 'Shu hafta',
      later: 'Keyinroq',
      none: 'Sanasiz',
    },
  },
  {
    title: 'Tasks',
    add: 'Add task',
    newTask: 'New task',
    editTask: 'Edit task',
    back: 'Back',
    notFound: 'Task not found. It may have been deleted.',
    retry: 'Retry',
    loadFailed: 'Failed to load tasks',
    overdue: 'Overdue',
    today: 'Today',
    done: 'Done',
    nothingToday: 'Nothing due today',
    nothingTodaySub: "Plan what's next in All tasks.",
    noTasks: 'No tasks yet',
    noTasksSub: 'Add one with the + button: once, on a schedule, or after done.',
    completeLabel: (title: string) => `Complete ${title}`,
    undoLabel: (title: string) => `Undo ${title}`,
    doneToast: (title: string) => `“${title}” done`,
    undo: 'Undo',
    undoFailed: 'Could not undo',
    completeFailed: 'Could not complete the task',
    home: {
      failed: "Couldn't load today's tasks",
      due: (n: number) => `${n} due today`,
      overdue: (n: number) => `${n} overdue`,
    },
    form: {
      title: 'Title',
      titlePlaceholder: 'What needs doing?',
      date: 'Date',
      nextDate: 'Next date',
      time: 'Time',
      noDateHint: "Without a date it stays in All tasks and won't come up in Today.",
      repeat: 'Repeat',
      modes: {
        none: { label: 'Once', hint: 'A one-off task' },
        schedule: { label: 'Schedule', hint: 'On fixed days, like a calendar. Missed days are not queued.' },
        after_done: { label: 'After done', hint: 'Counted from the day you last did it.' },
      },
      every: 'Every',
      unit: 'Unit',
      unitLabel: (unit: RepeatUnit, n: number) => (n === 1 ? unit : `${unit}s`),
      on: 'On',
      weekdays: 'Weekdays',
      note: 'Note',
      optional: 'Optional',
      save: 'Save',
      saving: 'Saving…',
      cancel: 'Cancel',
      delete: 'Delete',
      deleteTitle: (title: string) => `Delete “${title}”?`,
      deleteDesc: "The task and its history are removed. This can't be undone.",
      added: 'Task added',
      updated: 'Task updated',
      saveFailed: 'Could not save the task',
      deleted: 'Task deleted',
      deleteFailed: 'Could not delete the task',
    },
    repeat: {
      weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      everyOne: (unit: RepeatUnit) => `Every ${unit}`,
      everyN: (n: number, unit: RepeatUnit) => `Every ${enUnit(n, unit)}`,
      everyNWeeks: (n: number, days: string) => `Every ${n} weeks: ${days}`,
      monthly: (n: number, day: number) =>
        `${n === 1 ? 'Every month' : `Every ${n} months`} on the ${enOrdinal(day)}`,
      afterDone: (n: number, unit: RepeatUnit) => `${enUnit(n, unit)} after done`,
    },
    due: {
      noDate: 'No date',
      today: 'Today',
      tomorrow: 'Tomorrow',
      overdue: (n: number) => `${n} day${n === 1 ? '' : 's'} overdue`,
    },
    groups: {
      overdue: 'Overdue',
      today: 'Today',
      tomorrow: 'Tomorrow',
      week: 'This week',
      later: 'Later',
      none: 'No date',
    },
  },
)

export type TasksMessages = (typeof tasksMessages)['uz']

export function useTasksT(): TasksMessages {
  return useMessages(tasksMessages)
}
