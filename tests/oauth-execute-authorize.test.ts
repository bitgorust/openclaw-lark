import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetStoredToken = vi.fn();
const mockGetAppGrantedScopes = vi.fn();
const mockRequestDeviceAuthorization = vi.fn();
const mockPollDeviceToken = vi.fn();
const mockCreateCardEntity = vi.fn();
const mockSendCardByCardId = vi.fn();
const mockUpdateCardKitCardForAuth = vi.fn();

vi.mock('../src/core/lark-logger', () => ({
  larkLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

vi.mock('../src/core/token-store', async () => {
  const actual = await vi.importActual<typeof import('../src/core/token-store')>('../src/core/token-store');
  return {
    ...actual,
    getStoredToken: (...args: unknown[]) => mockGetStoredToken(...args),
    setStoredToken: vi.fn(),
    tokenStatus: vi.fn(() => 'missing'),
  };
});

vi.mock('../src/core/app-scope-checker', async () => {
  const actual = await vi.importActual<typeof import('../src/core/app-scope-checker')>('../src/core/app-scope-checker');
  return {
    ...actual,
    getAppGrantedScopes: (...args: unknown[]) => mockGetAppGrantedScopes(...args),
  };
});

vi.mock('../src/core/device-flow', async () => {
  const actual = await vi.importActual<typeof import('../src/core/device-flow')>('../src/core/device-flow');
  return {
    ...actual,
    requestDeviceAuthorization: (...args: unknown[]) => mockRequestDeviceAuthorization(...args),
    pollDeviceToken: (...args: unknown[]) => mockPollDeviceToken(...args),
  };
});

vi.mock('../src/card/cardkit', async () => {
  const actual = await vi.importActual<typeof import('../src/card/cardkit')>('../src/card/cardkit');
  return {
    ...actual,
    createCardEntity: (...args: unknown[]) => mockCreateCardEntity(...args),
    sendCardByCardId: (...args: unknown[]) => mockSendCardByCardId(...args),
    updateCardKitCardForAuth: (...args: unknown[]) => mockUpdateCardKitCardForAuth(...args),
  };
});

vi.mock('../src/core/lark-client', () => ({
  LarkClient: {
    fromAccount: () => ({ sdk: {} }),
  },
}));

import { executeAuthorize } from '../src/tools/oauth';

function parseToolResult(result: { content: Array<{ text: string }> }) {
  return JSON.parse(result.content[0].text);
}

describe('executeAuthorize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStoredToken.mockResolvedValue(null);
    mockGetAppGrantedScopes.mockResolvedValue(['docs:document:write', 'offline_access']);
    mockRequestDeviceAuthorization.mockResolvedValue({
      deviceCode: 'device-code',
      userCode: 'user-code',
      verificationUri: 'https://example.com/auth',
      verificationUriComplete: 'https://example.com/auth?code=1',
      expiresIn: 600,
      interval: 5,
    });
    mockPollDeviceToken.mockResolvedValue({
      ok: false,
      error: 'access_denied',
      message: 'access denied',
    });
    mockCreateCardEntity.mockResolvedValue('card_1');
    mockSendCardByCardId.mockResolvedValue(undefined);
    mockUpdateCardKitCardForAuth.mockResolvedValue(undefined);
  });

  it('starts device flow for an ordinary user without owner-only rejection', async () => {
    const result = await executeAuthorize({
      account: {
        accountId: 'default',
        enabled: true,
        configured: true,
        appId: 'cli_xxx',
        appSecret: 'secret_xxx',
        brand: 'feishu',
        config: {},
      } as any,
      senderOpenId: 'ou_regular_user',
      scope: 'docs:document:write',
      cfg: {} as any,
      ticket: {
        accountId: 'default',
        chatId: 'oc_xxx',
        messageId: 'om_xxx',
        senderOpenId: 'ou_regular_user',
        chatType: 'p2p',
      } as any,
    });

    expect(parseToolResult(result)).toMatchObject({
      success: true,
      awaiting_authorization: true,
    });
    expect(mockRequestDeviceAuthorization).toHaveBeenCalledTimes(1);
    expect(mockCreateCardEntity).toHaveBeenCalledTimes(1);
    expect(mockSendCardByCardId).toHaveBeenCalledTimes(1);
  });
});
