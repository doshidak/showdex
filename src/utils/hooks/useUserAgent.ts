import * as React from 'react';
import UaParser from 'ua-parser-js';

/**
 * Parses the client browser's User Agent via `ua-parser-js`.
 *
 * * Though very unlikely, a re-render will occur when the User Agent changes.
 * * Note that the actual parsed User Agent may not be 100% accurate with the user's actual device.
 *   - As shown in one of the examples below, macOS seems to report a version of 10.15.7,
 *     despite the actual machine being on macOS 12.6.
 *
 * @example
 * ```ts
 * // actual:
 * // AMD Ryzen 5 3600
 * // Windows 10 Home (21H1)
 * // Chrome 106.0.5249.119
 * {
 *   ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
 *   browser: {
 *     name: 'Chrome',
 *     version: '106.0.0.0',
 *     major: '106',
 *   },
 *   engine: {
 *     name: 'Blink',
 *     version: '106.0.0.0',
 *   },
 *   os: {
 *     name: 'Windows',
 *     version: '10',
 *   },
 *   device: {
 *     vendor: undefined,
 *     model: undefined,
 *     type: undefined,
 *   },
 *   cpu: {
 *     architecture: 'amd64',
 *   },
 * }
 * ```
 * @example
 * ```ts
 * // actual:
 * // MacBook Pro 13" 2019 4xTB3 (MacBookPro15,2)
 * // macOS Monterey 12.6 (21G115)
 * // Chrome 106.0.5249.119
 * {
 *   ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
 *   browser: {
 *     name: 'Chrome',
 *     version: '106.0.0.0',
 *     major: '106',
 *   },
 *   engine: {
 *     name: 'Blink',
 *     version: '106.0.0.0',
 *   },
 *   os: {
 *     name: 'Mac OS',
 *     version: '10.15.7',
 *   },
 *   device: {
 *     vendor: undefined,
 *     model: undefined,
 *     type: undefined,
 *   },
 *   cpu: {
 *     architecture: undefined,
 *   },
 * }
 * ```
 * @example
 * ```ts
 * // actual:
 * // iPhone 12 Pro Max (iPhone13,4)
 * // iOS 15.1.1 (19B81)
 * // Chrome 106.0.5249.92
 * {
 *   ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/106.0.5249.92 Mobile/15E148 Safari/604.1',
 *   browser: {
 *     name: 'Chrome',
 *     version: '106.0.5249.92',
 *     major: '106',
 *   },
 *   engine: {
 *     name: 'WebKit',
 *     version: '605.1.15',
 *   },
 *   os: {
 *     name: 'iOS',
 *     version: '15.1',
 *   },
 *   device: {
 *     vendor: 'Apple',
 *     model: 'iPhone',
 *     type: 'mobile',
 *   },
 *   cpu: {
 *     architecture: undefined,
 *   },
 * }
 * ```
 * @example
 * ```ts
 * // actual:
 * // Google Pixel 2 XL (rev_10)
 * // Android 11 (RPA1A.201005.004.A1)
 * // Firefox 108.0a1
 * {
 *   ua: 'Mozilla/5.0 (Android 11; Mobile; rv:108.0) Gecko/108.0 Firefox/108.0',
 *   browser: {
 *     name: 'Firefox',
 *     version: '108.0',
 *     major: '108',
 *   },
 *   engine: {
 *     name: 'Gecko',
 *     version: '108.0',
 *   },
 *   os: {
 *     name: 'Android',
 *     version: '11',
 *   },
 *   device: {
 *     vendor: undefined,
 *     model: undefined,
 *     type: 'mobile',
 *   },
 *   cpu: {
 *     architecture: undefined,
 *   },
 * }
 * ```
 * @since 1.0.5
 */
export const useUserAgent = (): DeepPartial<UaParser.IResult> => {
  const { userAgent = null } = navigator || {};

  const prevUserAgent = React.useRef<string>(userAgent);
  const [parsedAgent, setParsedAgent] = React.useState<DeepPartial<UaParser.IResult>>(UaParser(userAgent));

  React.useEffect(() => {
    if (!userAgent || prevUserAgent.current === userAgent) {
      return;
    }

    const parsed = UaParser(userAgent);

    if (parsed?.ua !== userAgent) {
      return;
    }

    setParsedAgent(parsed);
    prevUserAgent.current = userAgent;
  }, [
    userAgent,
  ]);

  return parsedAgent;
};
