const CONTENT_HOST_PROTOCOLS = new Set(['http:', 'https:', 'file:', 'ftp:']);

const IDENTITY_PROVIDER_HOSTS = new Set([
  'account.live.com',
  'accounts.google.com',
  'accounts.youtube.com',
  'appleid.apple.com',
  'login.live.com',
  'login.microsoftonline.com',
  'login.yahoo.com',
]);

export const VERIFICATION_PROVIDER_EXCLUDE_MATCHES = [
  '*://challenges.cloudflare.com/*',
  '*://*.challenges.cloudflare.com/*',
  '*://*.arkoselabs.com/*',
  '*://*.funcaptcha.com/*',
  '*://*.geetest.com/*',
  '*://*.geevisit.com/*',
  '*://*.gsensebot.com/*',
  '*://*.hcaptcha.com/*',
  '*://www.google.com/recaptcha/*',
  '*://www.gstatic.com/recaptcha/*',
  '*://www.recaptcha.net/recaptcha/*',
  '*://recaptcha.net/recaptcha/*',
] as const;

export const CONTENT_HOST_EXCLUDE_MATCHES = [...IDENTITY_PROVIDER_HOSTS].map(
  (host) => `*://${host}/*`,
);
CONTENT_HOST_EXCLUDE_MATCHES.push(...VERIFICATION_PROVIDER_EXCLUDE_MATCHES);

function hostnameMatches(hostname: string, domain: string) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function isBrowserVerificationUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.toLowerCase();
    if (
      hostnameMatches(hostname, 'challenges.cloudflare.com') ||
      hostnameMatches(hostname, 'arkoselabs.com') ||
      hostnameMatches(hostname, 'funcaptcha.com') ||
      hostnameMatches(hostname, 'geetest.com') ||
      hostnameMatches(hostname, 'geevisit.com') ||
      hostnameMatches(hostname, 'gsensebot.com') ||
      hostnameMatches(hostname, 'hcaptcha.com')
    ) {
      return true;
    }
    return (
      url.pathname.startsWith('/recaptcha/') &&
      (hostname === 'www.google.com' ||
        hostname === 'www.gstatic.com' ||
        hostname === 'www.recaptcha.net' ||
        hostname === 'recaptcha.net')
    );
  } catch {
    return false;
  }
}

function browserProtectedPage(url: URL) {
  return (
    IDENTITY_PROVIDER_HOSTS.has(url.hostname) ||
    isBrowserVerificationUrl(url.href) ||
    url.hostname === 'chromewebstore.google.com' ||
    (url.hostname === 'chrome.google.com' &&
      url.pathname.startsWith('/webstore')) ||
    (url.hostname === 'microsoftedge.microsoft.com' &&
      url.pathname.startsWith('/addons')) ||
    url.hostname === 'addons.mozilla.org'
  );
}

export function extensionContentHostUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    return (
      CONTENT_HOST_PROTOCOLS.has(url.protocol) && !browserProtectedPage(url)
    );
  } catch {
    return false;
  }
}

export function extensionOwnedNewTabHostUrl(
  rawUrl: string,
  extensionNewTabUrl: string,
) {
  return extensionOwnedDeckHostUrl(rawUrl, [extensionNewTabUrl]);
}

export function extensionOwnedDeckHostUrl(
  rawUrl: string,
  ownedPageUrls: readonly string[],
) {
  try {
    const current = new URL(rawUrl);
    return ownedPageUrls.some((ownedPageUrl) => {
      const owned = new URL(ownedPageUrl);
      return (
        current.protocol === owned.protocol &&
        current.host === owned.host &&
        current.pathname === owned.pathname
      );
    });
  } catch {
    return false;
  }
}

export function extensionHostPermissionPattern(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    if (!extensionContentHostUrl(rawUrl)) return null;
    return url.protocol === 'file:'
      ? 'file:///*'
      : `${url.protocol}//${url.host}/*`;
  } catch {
    return null;
  }
}
