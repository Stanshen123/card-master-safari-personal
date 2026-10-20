import { describe, expect, it } from 'vitest';

import {
  extensionContentHostUrl,
  extensionHostPermissionPattern,
  extensionOwnedDeckHostUrl,
  extensionOwnedNewTabHostUrl,
  isBrowserVerificationUrl,
} from './content-host-url';

describe('扩展页面宿主地址', () => {
  it.each([
    'http://127.0.0.1:5173/writing',
    'https://127.0.0.1/writing',
    'http://localhost:5173/',
    'https://localhost/',
    'http://[::1]:3000/',
    'https://www.baidu.com/',
    'http://example.com/',
    'file:///tmp/example.html',
    'ftp://example.com/file.txt',
  ])('允许普通页面 %s', (url) => {
    expect(extensionContentHostUrl(url)).toBe(true);
  });

  it.each([
    'chrome://extensions/',
    'https://chromewebstore.google.com/detail/example/extension-id',
    'https://chrome.google.com/webstore/detail/example/extension-id',
    'https://microsoftedge.microsoft.com/addons/detail/example/extension-id',
    'https://addons.mozilla.org/firefox/addon/example/',
    'https://accounts.google.com/signin/oauth/id?client_id=example',
    'https://accounts.google.com/o/oauth2/v2/auth',
    'https://accounts.youtube.com/accounts/SetSID',
    'https://appleid.apple.com/auth/authorize',
    'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    'https://challenges.cloudflare.com/turnstile/v0/api.js',
    'https://widget.hcaptcha.com/1/api.js',
    'https://client-api.arkoselabs.com/fc/api/',
    'https://static.geetest.com/static/js/gt.js',
    'https://www.google.com/recaptcha/api2/anchor',
    'https://www.gstatic.com/recaptcha/releases/example/recaptcha__en.js',
    'https://www.recaptcha.net/recaptcha/api.js',
    'about:blank',
    'not-a-url',
  ])('拒绝不可注入地址 %s', (url) => {
    expect(extensionContentHostUrl(url)).toBe(false);
  });

  it.each([
    'https://challenges.cloudflare.com/turnstile/v0/api.js',
    'https://newassets.hcaptcha.com/captcha/v1/index.html',
    'https://client-api.arkoselabs.com/fc/api/',
    'https://static.geetest.com/static/js/gt.js',
    'https://www.google.com/recaptcha/api2/anchor',
  ])('识别验证服务页面 %s', (url) => {
    expect(isBrowserVerificationUrl(url)).toBe(true);
  });

  it('不把普通 Google 页面误判为验证页面', () => {
    expect(
      isBrowserVerificationUrl('https://www.google.com/search?q=test'),
    ).toBe(false);
  });

  it('生成当前页面的精确站点权限模式', () => {
    expect(
      extensionHostPermissionPattern('https://www.baidu.com/search?q=1'),
    ).toBe('https://www.baidu.com/*');
    expect(extensionHostPermissionPattern('file:///tmp/example.html')).toBe(
      'file:///*',
    );
    expect(extensionHostPermissionPattern('http://localhost:3000/')).toBe(
      'http://localhost:3000/*',
    );
    expect(
      extensionHostPermissionPattern(
        'https://chromewebstore.google.com/detail/example/id',
      ),
    ).toBeNull();
  });

  it('只允许卡牌大师自己的新标签页作为扩展页面宿主', () => {
    const newTabUrl = 'chrome-extension://card-master/new-tab.html';
    expect(extensionOwnedNewTabHostUrl(newTabUrl, newTabUrl)).toBe(true);
    expect(
      extensionOwnedNewTabHostUrl(
        'chrome-extension://card-master/new-tab-settings.html',
        newTabUrl,
      ),
    ).toBe(false);
    expect(
      extensionOwnedNewTabHostUrl(
        'chrome-extension://another-extension/new-tab.html',
        newTabUrl,
      ),
    ).toBe(false);
  });

  it('把安装页和新标签页一样挂上完整牌阵宿主', () => {
    const newTabUrl = 'chrome-extension://card-master/new-tab.html';
    const installUrl = 'chrome-extension://card-master/install.html';
    expect(extensionOwnedDeckHostUrl(installUrl, [newTabUrl, installUrl])).toBe(
      true,
    );
    expect(
      extensionOwnedDeckHostUrl(
        `${installUrl}?source=https://example.com/a.user.js`,
        [newTabUrl, installUrl],
      ),
    ).toBe(true);
    expect(
      extensionOwnedDeckHostUrl(
        'chrome-extension://card-master/new-tab-settings.html',
        [newTabUrl, installUrl],
      ),
    ).toBe(false);
  });
});
