import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserAuthRequiredError } from '../src/core/tool-client';

const mockGetAppGrantedScopes = vi.fn();
const mockGetStoredToken = vi.fn();
const mockCallWithUAT = vi.fn();
const mockRawLarkRequest = vi.fn();

vi.mock('../src/core/lark-logger', () => ({
  larkLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

vi.mock('../src/core/app-scope-checker', async () => {
  const actual = await vi.importActual<typeof import('../src/core/app-scope-checker')>('../src/core/app-scope-checker');
  return {
    ...actual,
    getAppGrantedScopes: (...args: unknown[]) => mockGetAppGrantedScopes(...args),
  };
});

vi.mock('../src/core/token-store', async () => {
  const actual = await vi.importActual<typeof import('../src/core/token-store')>('../src/core/token-store');
  return {
    ...actual,
    getStoredToken: (...args: unknown[]) => mockGetStoredToken(...args),
  };
});

vi.mock('../src/core/uat-client', async () => {
  const actual = await vi.importActual<typeof import('../src/core/uat-client')>('../src/core/uat-client');
  return {
    ...actual,
    callWithUAT: (...args: unknown[]) => mockCallWithUAT(...args),
  };
});

vi.mock('../src/core/raw-request', () => ({
  rawLarkRequest: (...args: unknown[]) => mockRawLarkRequest(...args),
}));

import { ToolClient } from '../src/core/tool-client';

describe('ToolClient owner policy', () => {
  const account = {
    accountId: 'default',
    enabled: true,
    configured: true,
    appId: 'cli_xxx',
    appSecret: 'secret_xxx',
    brand: 'feishu',
    config: {},
  } as any;

  const config = {
    plugins: {
      entries: {
        feishu: {
          enabled: false,
        },
      },
    },
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAppGrantedScopes.mockResolvedValue(['im:chat:read', 'offline_access']);
  });

  it('allows non-owner users to invoke ordinary user-scoped tools', async () => {
    mockGetStoredToken.mockResolvedValue({
      access_token: 'uat_xxx',
      refresh_token: 'ref_xxx',
      scope: 'im:chat:read offline_access',
    });

    mockCallWithUAT.mockImplementation(async (_opts, apiCall) => apiCall('uat_xxx'));

    const client = new ToolClient({
      account,
      senderOpenId: 'ou_non_owner',
      sdk: {} as any,
      config,
    });

    const result = await client.invoke(
      'feishu_chat.search',
      async (_sdk, _opts, accessToken) => ({ accessToken }),
      { as: 'user' },
    );

    expect(result).toEqual({ accessToken: 'uat_xxx' });
    expect(mockGetStoredToken).toHaveBeenCalledWith('cli_xxx', 'ou_non_owner');
    expect(mockCallWithUAT).toHaveBeenCalledTimes(1);
  });

  it('does not silently fall back to the app owner when sender identity is missing', async () => {
    const client = new ToolClient({
      account,
      senderOpenId: undefined,
      sdk: {} as any,
      config,
    });

    await expect(
      client.invoke(
        'feishu_chat.search',
        async () => ({ ok: true }),
        { as: 'user' },
      ),
    ).rejects.toBeInstanceOf(UserAuthRequiredError);

    expect(mockGetStoredToken).not.toHaveBeenCalled();
    expect(mockCallWithUAT).not.toHaveBeenCalled();
    expect(mockRawLarkRequest).not.toHaveBeenCalled();
  });
});
