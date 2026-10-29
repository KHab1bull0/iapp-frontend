/** An unsigned token AuthContext can parse; the signature is never checked client-side. */
export function fakeToken(sub: string, username: string): string {
  const b64 = (o: object) => btoa(JSON.stringify(o))
  const exp = Math.floor(Date.now() / 1000) + 3600
  return `${b64({ alg: 'none' })}.${b64({ sub, username, exp })}.sig`
}
