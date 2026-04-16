import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToolClient, UserAuthRequiredError } from '../src/core/tool-client';

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

  it('injects tenant access token for tenant-mode raw path requests', async () => {
    mockGetAppGrantedScopes.mockResolvedValue(['approval:approval']);
    mockRawLarkRequest
      .mockResolvedValueOnce({
        tenant_access_token: 'tat_xxx',
        expire: 7200,
      })
      .mockResolvedValueOnce({
        code: 0,
        data: {
          ok: true,
        },
      });

    const client = new ToolClient({
      account,
      senderOpenId: 'ou_sender',
      sdk: {} as any,
      config,
    });

    const result = await client.invokeByPath(
      'feishu_approval_task.approve',
      '/open-apis/approval/v4/tasks/approve',
      {
        method: 'POST',
        body: { task_id: 'task_1' },
        as: 'tenant',
      },
    );

    expect(mockRawLarkRequest).toHaveBeenNthCalledWith(1, {
      brand: 'feishu',
      path: '/open-apis/auth/v3/tenant_access_token/internal',
      method: 'POST',
      body: {
        app_id: 'cli_xxx',
        app_secret: 'secret_xxx',
      },
    });

    expect(mockRawLarkRequest).toHaveBeenNthCalledWith(2, {
      brand: 'feishu',
      path: '/open-apis/approval/v4/tasks/approve',
      method: 'POST',
      query: undefined,
      headers: undefined,
      accessToken: 'tat_xxx',
      body: { task_id: 'task_1' },
    });

    expect(result).toEqual({
      code: 0,
      data: {
        ok: true,
      },
    });
  });

  it('does not fetch tenant access token for ordinary tenant-mode sdk calls', async () => {
    mockGetAppGrantedScopes.mockResolvedValue(['approval:approval']);

    const client = new ToolClient({
      account,
      senderOpenId: 'ou_sender',
      sdk: {} as any,
      config,
    });

    const result = await client.invoke(
      'feishu_approval_task.approve',
      async (_sdk, _opts, accessToken) => ({ accessToken }),
      { as: 'tenant' },
    );

    expect(result).toEqual({ accessToken: undefined });
    expect(mockRawLarkRequest).not.toHaveBeenCalled();
  });

  it('does not treat offline_access as a satisfiable one-of business scope', async () => {
    mockGetAppGrantedScopes.mockResolvedValue(['offline_access']);

    const client = new ToolClient({
      account,
      senderOpenId: 'ou_sender',
      sdk: {} as any,
      config,
    });

    await expect(
      client.invoke(
        'feishu_approval_task_search.query',
        async () => ({ ok: true }),
        { as: 'user' },
      ),
    ).rejects.toMatchObject({
      name: 'AppScopeMissingError',
      missingScopes: expect.arrayContaining(['approval:approval:readonly']),
    });

    expect(mockGetStoredToken).not.toHaveBeenCalled();
    expect(mockCallWithUAT).not.toHaveBeenCalled();
  });
});
