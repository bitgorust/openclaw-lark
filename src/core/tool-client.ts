/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * ToolClient — 工具层统一客户端。
 *
 * 专为 `src/tools/` 下的工具设计，封装 account 解析、SDK 管理、
 * TAT/UAT 自动切换和 scope 预检。工具代码只需声明 API 名称和调用逻辑，
 * 身份选择/scope 校验/token 管理全部由 `invoke()` 内聚处理。
 *
 * 用法：
 * ```typescript
 * const client = createToolClient(config);
 *
 * // UAT 调用 — 通过 { as: "user" } 指定用户身份
 * const res = await client.invoke(
 *   "calendar.v4.calendarEvent.create",
 *   (sdk, opts) => sdk.calendar.calendarEvent.create(payload, opts),
 *   { as: "user" },
 * );
 *
 * // TAT 调用 — 默认走应用身份
 * const res = await client.invoke(
 *   "calendar.v4.calendar.list",
 *   (sdk) => sdk.calendar.calendar.list(payload),
 *   { as: "tenant" },
 * );
 * ```
 */

import * as Lark from '@larksuiteoapi/node-sdk';
import type { ClawdbotConfig } from 'openclaw/plugin-sdk';
import type { ConfiguredLarkAccount } from './types';
import { getEnabledLarkAccounts, getLarkAccount } from './accounts';
import { LarkClient, getResolvedConfig } from './lark-client';
import { getTicket } from './lark-ticket';
import { callWithUAT } from './uat-client';
import { getStoredToken } from './token-store';
import { getAppGrantedScopes, invalidateAppScopeCache, missingScopes } from './app-scope-checker';
import { type ToolActionKey, getRequiredScopeSpec } from './scope-manager';
import { rawLarkRequest } from './raw-request';
import { type ExecutionAuthMode, getCapabilityAuthPolicy, isAuthModeAllowed } from './capability-auth';
import {
  AppScopeCheckFailedError,
  AppScopeMissingError,
  LARK_ERROR,
  NeedAuthorizationError,
  TenantOnlyCapabilityError,
  UnsupportedAuthModeError,
  UserAuthRequiredError,
  UserScopeInsufficientError,
} from './auth-errors';
import type { AuthHint, ScopeErrorInfo, TryInvokeResult } from './auth-errors';

// Re-export for backward compatibility — 下游模块可继续从 tool-client 导入
export {
  LARK_ERROR,
  NeedAuthorizationError,
  AppScopeCheckFailedError,
  AppScopeMissingError,
  TenantOnlyCapabilityError,
  UnsupportedAuthModeError,
  UserAuthRequiredError,
  UserScopeInsufficientError,
};
export type { ScopeErrorInfo, AuthHint, TryInvokeResult };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Per-request options returned by `Lark.withUserAccessToken()`. */
type LarkRequestOptions = ReturnType<typeof Lark.withUserAccessToken>;

/**
 * @deprecated 使用 `InvokeFn` 代替。
 * Callback that receives the SDK client and per-request UAT options.
 */
export type ApiFn<T> = (sdk: Lark.Client, opts: LarkRequestOptions) => Promise<T>;

/**
 * invoke() 的回调签名。
 *
 * - UAT 模式：`opts` 为 `Lark.withUserAccessToken(token)`，需传给 SDK 方法；`accessToken` 为 User Access Token 原始字符串
 * - TAT 模式：`opts` 为 `undefined`，SDK 默认走应用身份；`accessToken` 为 Tenant Access Token 原始字符串
 */
export type InvokeFn<T> = (sdk: Lark.Client, opts?: LarkRequestOptions, accessToken?: string) => Promise<T>;

/** invoke() 的选项。 */
export interface InvokeOptions {
  /** 强制 token 类型。省略时根据 API meta 自动选择（优先 user）。 */
  as?: 'user' | 'tenant';
  /** 覆盖 senderOpenId。 */
  userOpenId?: string;
  /** 直接指定所需 scopes，跳过从 meta.json 读取。宽松模式：只要应用拥有部分 scope（交集非空）即可调用。 */
  /** 严格模式：指定所需 scopes，应用必须拥有所有 scope，缺一个都会报 AppScopeMissingError。 */
}

/** invokeByPath() 的选项 — 在 InvokeOptions 基础上增加 HTTP 请求参数。 */
export type InvokeByPathOptions = InvokeOptions & {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string>;
  /** 自定义请求 header，会与 Authorization / Content-Type 合并（自定义优先）。 */
  headers?: Record<string, string>;
};

// ---------------------------------------------------------------------------
// ToolClient
// ---------------------------------------------------------------------------

export class ToolClient {
  readonly config: ClawdbotConfig;
  /** 当前解析的账号信息（appId、appSecret 保证存在）。 */
  readonly account: ConfiguredLarkAccount;

  /** 当前请求的用户 open_id（来自 LarkTicket，可能为 undefined）。 */
  readonly senderOpenId: string | undefined;

  /** Lark SDK 实例（TAT 身份），直接调用即可。 */
  readonly sdk: Lark.Client;

  constructor(params: {
    account: ConfiguredLarkAccount;
    senderOpenId: string | undefined;
    sdk: Lark.Client;
    config: ClawdbotConfig;
  }) {
    this.account = params.account;
    this.senderOpenId = params.senderOpenId;
    this.sdk = params.sdk;
    this.config = params.config;
  }

  // -------------------------------------------------------------------------
  // invoke() — 统一 API 调用入口
  // -------------------------------------------------------------------------

  /**
   * 统一 API 调用入口。
   *
   * 自动处理：
   * - 根据 API meta 选择 UAT / TAT
   * - 严格模式：检查应用和用户是否拥有所有 API 要求的 scope
   * - 无 token 或 scope 不足时抛出结构化错误
   * - UAT 模式下复用 callWithUAT 的 refresh + retry
   *
   * @param apiName - meta.json 中的 toolName，如 `"calendar.v4.calendarEvent.create"`
   * @param fn - API 调用逻辑。UAT 时 opts 已注入 token，TAT 时 opts 为 undefined。
   * @param options - 可选配置：
   *   - `as`: 指定 UAT/TAT
   *   - `userOpenId`: 覆盖用户 ID
   *
   * @throws {@link AppScopeMissingError} 应用未开通 API 所需 scope
   * @throws {@link UserAuthRequiredError} 用户未授权或 scope 不足
   * @throws {@link UserScopeInsufficientError} 服务端报用户 scope 不足
   *
   * @example
   * // UAT 调用 — 通过 { as: "user" } 指定
   * const res = await client.invoke(
   *   "calendar.v4.calendarEvent.create",
   *   (sdk, opts) => sdk.calendar.calendarEvent.create(payload, opts),
   *   { as: "user" },
   * );
   *
   * @example
   * // TAT 调用
   * const res = await client.invoke(
   *   "calendar.v4.calendar.list",
   *   (sdk) => sdk.calendar.calendar.list(payload),
   *   { as: "tenant" },
   * );
   *
   */
  async invoke<T>(toolAction: ToolActionKey, fn: InvokeFn<T>, options?: InvokeOptions): Promise<T> {
    return this._invokeInternal(toolAction, fn, options);
  }

  private async invokeWithMode<T>(
    toolAction: ToolActionKey,
    fn: InvokeFn<T>,
    tokenType: ExecutionAuthMode,
    options: InvokeOptions | undefined,
    requiredScopes: string[],
    scopeNeedType: 'one' | 'all',
    requireTenantAccessToken: boolean,
  ): Promise<T> {
    // ---- App Granted Scopes 检查（应用已开通的权限）----
    // UAT 调用额外要求 offline_access（OAuth Device Flow 的前提权限），
    // 但它不能参与业务 scope 的 "one-of" 命中判断。
    const requiresOfflineAccess = tokenType === 'user';

    let appScopeVerified = true;
    if (requiredScopes.length > 0 || requiresOfflineAccess) {
      const appGrantedScopes = await getAppGrantedScopes(this.sdk, this.account.appId, tokenType);

      if (appGrantedScopes.length > 0) {
        const hasRequiredBusinessScopes =
          requiredScopes.length === 0 ||
          scopeNeedType === 'one'
            ? requiredScopes.some((scope) => appGrantedScopes.includes(scope))
            : missingScopes(appGrantedScopes, requiredScopes).length === 0;
        const hasOfflineAccess = !requiresOfflineAccess || appGrantedScopes.includes('offline_access');

        if (!hasRequiredBusinessScopes || !hasOfflineAccess) {
          const missingAppScopes = [
            ...missingScopes(appGrantedScopes, requiredScopes),
            ...(!hasOfflineAccess ? ['offline_access'] : []),
          ];
          throw new AppScopeMissingError(
            { apiName: toolAction, scopes: missingAppScopes, appId: this.account.appId },
            scopeNeedType,
            tokenType,
            requiredScopes,
          );
        }
      } else {
        // 查询失败（返回空数组）→ 跳过本地 scope 预检，让服务端返回更准确的错误。
        appScopeVerified = false;
      }
    }

    if (tokenType === 'tenant') {
      return this.invokeAsTenant(toolAction, fn, requiredScopes, requireTenantAccessToken);
    }

    const userOpenId = options?.userOpenId ?? this.senderOpenId;
    return this.invokeAsUser(toolAction, fn, requiredScopes, userOpenId, appScopeVerified);
  }

  /**
   * 内部 invoke 实现，只支持 ToolActionKey（严格类型检查）
   */
  private async _invokeInternal<T>(
    toolAction: ToolActionKey,
    fn: InvokeFn<T>,
    options?: InvokeOptions,
    requireTenantAccessToken = false,
  ): Promise<T> {
    // 检查旧版插件是否已禁用 (error)
    const feishuEntry = this.config.plugins?.entries?.feishu;
    if (feishuEntry && feishuEntry.enabled !== false) {
      throw new Error(
        '❌ 检测到旧版插件未禁用。\n' +
          '👉 请依次运行命令：\n' +
          '```\n' +
          'openclaw config set plugins.entries.feishu.enabled false --json\n' +
          'openclaw gateway restart\n' +
          '```',
      );
    }

    const { requiredScopes, scopeNeedType } = getRequiredScopeSpec(toolAction);
    const authPolicy = getCapabilityAuthPolicy(toolAction);
    const tokenType: ExecutionAuthMode = options?.as ?? authPolicy.preferredMode;

    if (options?.as && !isAuthModeAllowed(toolAction, options.as)) {
      if (authPolicy.canonicalAuthModes.includes('tenant-only') && options.as === 'user') {
        throw new TenantOnlyCapabilityError({
          toolAction,
          requiredMode: 'tenant',
          requestedMode: options.as,
          canonicalAuthModes: authPolicy.canonicalAuthModes,
        });
      }

      throw new UnsupportedAuthModeError({
        toolAction,
        requiredMode: authPolicy.preferredMode,
        requestedMode: options.as,
        canonicalAuthModes: authPolicy.canonicalAuthModes,
      });
    }

    try {
      return await this.invokeWithMode(
        toolAction,
        fn,
        tokenType,
        options,
        requiredScopes,
        scopeNeedType,
        requireTenantAccessToken,
      );
    } catch (err) {
      if (
        !options?.as &&
        authPolicy.fallbackMode === 'tenant' &&
        (err instanceof AppScopeMissingError ||
          err instanceof UserAuthRequiredError ||
          err instanceof UserScopeInsufficientError)
      ) {
        return this.invokeWithMode(toolAction, fn, 'tenant', options, requiredScopes, scopeNeedType, requireTenantAccessToken);
      }
      throw err;
    }
  }

  /**
   * invoke() 的非抛出包装，适用于"允许失败"的子操作。
   *
   * - 成功 → `{ ok: true, data }`
   * - 用户授权错误（可通过 OAuth 恢复）→ `{ ok: false, authHint }`
   * - 应用权限缺失 / appScopeVerified=false → **仍然 throw**（需管理员操作）
   * - 其他错误 → `{ ok: false, error }`
   */
  // -------------------------------------------------------------------------
  // invokeByPath() — SDK 未覆盖的 API 调用入口
  // -------------------------------------------------------------------------

  /**
   * 对 SDK 未覆盖的飞书 API 发起 raw HTTP 请求，同时复用 invoke() 的
   * auth/scope/refresh 全链路。
   *
   * @param apiName - 逻辑 API 名称（用于日志和错误信息），如 `"im.v1.chatP2p.batchQuery"`
   * @param path - API 路径（以 `/open-apis/` 开头），如 `"/open-apis/im/v1/chat_p2p/batch_query"`
   * @param options - HTTP 方法、body、query 及 InvokeOptions（as、userOpenId 等）
   *
   * @example
   * ```typescript
   * const res = await client.invokeByPath<{ data: { items: Array<{ chat_id: string }> } }>(
   *   "im.v1.chatP2p.batchQuery",
   *   "/open-apis/im/v1/chat_p2p/batch_query",
   *   {
   *     method: "POST",
   *     body: { chatter_ids: [openId] },
   *     as: "user",
   *   },
   * );
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async invokeByPath<T = any>(toolAction: ToolActionKey, path: string, options?: InvokeByPathOptions): Promise<T> {
    const fn: InvokeFn<T> = async (_sdk, _opts, accessToken) => {
      return this.rawRequest<T>(path, {
        method: options?.method,
        body: options?.body,
        query: options?.query,
        headers: options?.headers,
        accessToken,
      });
    };
    return this._invokeInternal(toolAction, fn, options, true);
  }

  // -------------------------------------------------------------------------
  // Private: TAT path
  // -------------------------------------------------------------------------

  private async invokeAsTenant<T>(
    toolAction: ToolActionKey,
    fn: InvokeFn<T>,
    requiredScopes: string[],
    requireTenantAccessToken: boolean,
  ): Promise<T> {
    try {
      const accessToken = requireTenantAccessToken ? await this.getTenantAccessToken() : undefined;
      return await fn(this.sdk, undefined, accessToken);
    } catch (err) {
      this.rethrowStructuredError(err, toolAction, requiredScopes, undefined, 'tenant');
      throw err;
    }
  }

  // -------------------------------------------------------------------------
  // Private: UAT path
  // -------------------------------------------------------------------------

  private async invokeAsUser<T>(
    toolAction: ToolActionKey,
    fn: InvokeFn<T>,
    requiredScopes: string[],
    userOpenId: string | undefined,
    appScopeVerified: boolean,
  ): Promise<T> {
    if (!userOpenId) {
      throw new UserAuthRequiredError('unknown', {
        apiName: toolAction,
        scopes: requiredScopes,
        appScopeVerified,
        appId: this.account.appId,
      });
    }

    // 预检：是否有已存储的 token
    const stored = await getStoredToken(this.account.appId, userOpenId);
    if (!stored) {
      throw new UserAuthRequiredError(userOpenId, {
        apiName: toolAction,
        scopes: requiredScopes,
        appScopeVerified,
        appId: this.account.appId,
      });
    }

    // 预检：token 的 scope 是否满足 API 要求
    // ---- User Granted Scopes 检查（用户授权的权限）----
    // 仅在 App Granted Scopes 检查成功时进行本地预检。
    // 当 App Scope 检查失败时（appScopeVerified=false），跳过预检，
    // 让请求走到服务端 — 服务端会返回准确的错误码：
    //   LARK_ERROR.APP_SCOPE_MISSING (99991672) → App Granted Scopes 缺失（管理员需在开放平台开通）
    //   LARK_ERROR.USER_SCOPE_INSUFFICIENT (99991679) → User Granted Scopes 缺失（需引导用户 OAuth 授权）
    if (appScopeVerified && stored.scope && requiredScopes.length > 0) {
      // 检查用户是否授权了所有 Required Scopes
      const userGrantedScopes = new Set(stored.scope.split(/\s+/).filter(Boolean));
      const { scopeNeedType } = getRequiredScopeSpec(toolAction);
      const missingUserScopes =
        scopeNeedType === 'one' && requiredScopes.some((scope) => userGrantedScopes.has(scope))
          ? []
          : requiredScopes.filter((s) => !userGrantedScopes.has(s));
      if (missingUserScopes.length > 0) {
        throw new UserAuthRequiredError(userOpenId, {
          apiName: toolAction,
          scopes: missingUserScopes,
          appScopeVerified,
          appId: this.account.appId,
        });
      }
    }

    // 通过 callWithUAT 执行（自动 refresh + retry）
    try {
      return await callWithUAT(
        {
          userOpenId,
          appId: this.account.appId,
          appSecret: this.account.appSecret,
          domain: this.account.brand,
        },
        (accessToken) => fn(this.sdk, Lark.withUserAccessToken(accessToken), accessToken),
      );
    } catch (err) {
      if (err instanceof NeedAuthorizationError) {
        throw new UserAuthRequiredError(userOpenId, {
          apiName: toolAction,
          scopes: requiredScopes,
          appScopeVerified,
        });
      }
      this.rethrowStructuredError(err, toolAction, requiredScopes, userOpenId, 'user');
      throw err;
    }
  }

  // -------------------------------------------------------------------------
  // Private: raw HTTP request
  // -------------------------------------------------------------------------

  /**
   * 发起 raw HTTP 请求到飞书 API，委托 rawLarkRequest 处理。
   */
  private async rawRequest<T>(
    path: string,
    options: {
      method?: string;
      body?: unknown;
      query?: Record<string, string>;
      headers?: Record<string, string>;
      accessToken?: string;
    },
  ): Promise<T> {
    return rawLarkRequest<T>({
      brand: this.account.brand,
      path,
      ...options,
    });
  }

  private async getTenantAccessToken(): Promise<string> {
    const tokenResponse = await rawLarkRequest<{
      tenant_access_token?: string;
      access_token?: string;
    }>({
      brand: this.account.brand,
      path: '/open-apis/auth/v3/tenant_access_token/internal',
      method: 'POST',
      body: {
        app_id: this.account.appId,
        app_secret: this.account.appSecret,
      },
    });

    const accessToken = tokenResponse.tenant_access_token ?? tokenResponse.access_token;
    if (!accessToken) {
      throw new Error('Failed to obtain tenant access token for raw Feishu API request');
    }
    return accessToken;
  }

  // -------------------------------------------------------------------------
  // Private: structured error detection
  // -------------------------------------------------------------------------

  /**
   * 识别飞书服务端错误码并转换为结构化错误。
   *
   * - LARK_ERROR.APP_SCOPE_MISSING (99991672) → AppScopeMissingError（清缓存后抛出）
   * - LARK_ERROR.USER_SCOPE_INSUFFICIENT (99991679) → UserScopeInsufficientError
   */
  private rethrowStructuredError(
    err: unknown,
    apiName: string,
    effectiveScopes: string[],
    userOpenId?: string,
    tokenType?: 'user' | 'tenant',
  ): void {
    const code =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err as any)?.code ?? (err as any)?.response?.data?.code;

    if (code === LARK_ERROR.APP_SCOPE_MISSING) {
      // 应用 scope 不足 — 清缓存（管理员可能刚开通）
      invalidateAppScopeCache(this.account.appId);
      throw new AppScopeMissingError(
        {
          apiName,
          scopes: effectiveScopes,
          appId: this.account.appId,
        },
        'all',
        tokenType,
      );
    }

    if (code === LARK_ERROR.USER_SCOPE_INSUFFICIENT && userOpenId) {
      throw new UserScopeInsufficientError(userOpenId, {
        apiName,
        scopes: effectiveScopes,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * 从配置创建 {@link ToolClient}。
 *
 * 自动从当前 {@link LarkTicket} 解析 accountId 和 senderOpenId。
 * 如果 LarkTicket 不可用（如非消息场景），回退到 `accountIndex`
 * 指定的账号。
 *
 * @param config - OpenClaw 配置对象
 * @param accountIndex - 回退账号索引（默认 0）
 */
export function createToolClient(config: ClawdbotConfig, accountIndex = 0): ToolClient {
  const ticket = getTicket();

  // 1. 解析账号
  //
  // `config` is the closure-captured snapshot from plugin registration and may be
  // stale after a hot-reload.  Use getResolvedConfig() to always get the live config.
  const resolveConfig = getResolvedConfig(config);

  let account: ConfiguredLarkAccount | undefined;

  if (ticket?.accountId) {
    const resolved = getLarkAccount(resolveConfig, ticket.accountId);
    if (!resolved.configured) {
      throw new Error(
        `Feishu account "${ticket.accountId}" is not configured (missing appId or appSecret). ` +
          `Please check channels.feishu.accounts.${ticket.accountId} in your config.`,
      );
    }
    if (!resolved.enabled) {
      throw new Error(
        `Feishu account "${ticket.accountId}" is disabled. ` +
          `Set channels.feishu.accounts.${ticket.accountId}.enabled to true, or remove it to use defaults.`,
      );
    }
    account = resolved;
  }

  if (!account) {
    const accounts = getEnabledLarkAccounts(resolveConfig);
    if (accounts.length === 0) {
      throw new Error(
        'No enabled Feishu accounts configured. ' + 'Please add appId and appSecret in config under channels.feishu',
      );
    }
    if (accountIndex >= accounts.length) {
      throw new Error(`Requested account index ${accountIndex} but only ${accounts.length} accounts available`);
    }
    const fallback = accounts[accountIndex];
    if (!fallback.configured) {
      throw new Error(`Account at index ${accountIndex} is not fully configured (missing appId or appSecret)`);
    }
    account = fallback;
  }

  // 2. 获取 SDK 实例（复用 LarkClient 的缓存）
  const larkClient = LarkClient.fromAccount(account);

  // 3. 组装 ToolClient
  return new ToolClient({
    account,
    senderOpenId: ticket?.senderOpenId,
    sdk: larkClient.sdk,
    config,
  });
}
