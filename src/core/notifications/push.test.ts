import { afterEach, describe, expect, test } from 'vitest'
import { installFakePush, uninstallFakePush, UA } from '@/test/push'
import { deviceName } from './device'
import { detectBlocker, urlBase64ToUint8Array } from './push'

afterEach(() => uninstallFakePush())

describe('urlBase64ToUint8Array', () => {
  test('decodes base64url, padding and all', () => {
    // "-" and "_" are base64url for "+" and "/"; no "=" padding is sent.
    expect(Array.from(urlBase64ToUint8Array('-_8'))).toEqual([0xfb, 0xff])
    expect(Array.from(urlBase64ToUint8Array('AQID'))).toEqual([1, 2, 3])
    expect(Array.from(urlBase64ToUint8Array('AQIDBA'))).toEqual([1, 2, 3, 4])
  })

  test('a 65-byte VAPID key comes out 65 bytes long, starting 0x04 (uncompressed point)', () => {
    const key = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
    const bytes = urlBase64ToUint8Array(key)
    expect(bytes.length).toBe(65)
    expect(bytes[0]).toBe(4)
  })
})

describe('detectBlocker', () => {
  test('iPhone Safari in a tab must be installed first', () => {
    installFakePush({ ua: UA.iphone, supported: false })
    expect(detectBlocker()).toBe('ios-needs-install')
  })

  test('iPadOS posing as a Mac is still iOS', () => {
    installFakePush({ ua: UA.mac, maxTouchPoints: 5, supported: false })
    expect(detectBlocker()).toBe('ios-needs-install')
  })

  test('the iPhone app opened from the home screen can subscribe', () => {
    installFakePush({ ua: UA.iphone, standalone: true })
    expect(detectBlocker()).toBeNull()
  })

  test('no PushManager anywhere else is plain unsupported', () => {
    installFakePush({ supported: false })
    expect(detectBlocker()).toBe('unsupported')
  })
})

describe('deviceName', () => {
  test.each([
    [UA.iphone, 'iPhone · Safari'],
    [UA.mac, 'Mac · Chrome'],
    // A home-screen app on iOS has no "Safari/" token.
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148', 'iPhone · Safari'],
    ['Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36', 'Android · Chrome'],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0', 'Windows · Edge'],
    ['Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0', 'Linux · Firefox'],
    ['curl/8.0', ''],
  ])('%s → %s', (ua, name) => {
    expect(deviceName(ua)).toBe(name)
  })
})
