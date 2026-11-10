/**
 * "iPhone · Safari" from a user agent, for the devices list. Deliberately
 * small: the order matters (Edge and Opera also say Chrome, every iOS browser
 * also says Safari) and anything unrecognised falls back to a plain name.
 */
export function deviceName(ua: string): string {
  const os =
    /iPhone|iPod/.test(ua) ? 'iPhone'
    : /iPad/.test(ua) ? 'iPad'
    : /Android/.test(ua) ? 'Android'
    : /CrOS/.test(ua) ? 'ChromeOS'
    : /Macintosh|Mac OS X/.test(ua) ? 'Mac'
    : /Windows/.test(ua) ? 'Windows'
    : /Linux/.test(ua) ? 'Linux'
    : null

  const browser =
    /Edg(A|iOS)?\//.test(ua) ? 'Edge'
    : /OPR\/|Opera/.test(ua) ? 'Opera'
    : /SamsungBrowser/.test(ua) ? 'Samsung Internet'
    : /YaBrowser/.test(ua) ? 'Yandex'
    : /Firefox|FxiOS/.test(ua) ? 'Firefox'
    : /Chrome|CriOS|Chromium/.test(ua) ? 'Chrome'
    // A home-screen app on iOS drops the "Safari/" token, and that is the
    // only place iOS delivers push at all; any other WebKit is Safari too.
    : /Safari|AppleWebKit/.test(ua) ? 'Safari'
    : null

  return [os, browser].filter(Boolean).join(' · ')
}
