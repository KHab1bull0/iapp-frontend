export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window

/** Says the word aloud in English, if the device can. */
export function speak(word: string): void {
  if (!canSpeak()) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(word)
  u.lang = 'en-US'
  window.speechSynthesis.speak(u)
}
