import * as os from 'node:os';
import * as path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserAuthRequiredError } from '../src/core/tool-client';

const mockInvokeByPath = vi.fn();
const mockHandleInvokeErrorWithAutoAuth = vi.fn();
const mockFeishuFetch = vi.fn();

vi.mock('../src/core/lark-logger', () => ({
  larkLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

vi.mock('../src/core/feishu-fetch', () => ({
  feishuFetch: (...args: unknown[]) => mockFeishuFetch(...args),
}));

vi.mock('../src/tools/oapi/helpers', async () => {
  const actual = await vi.importActual<typeof import('../src/tools/oapi/helpers')>('../src/tools/oapi/helpers');

  return {
    ...actual,
    createToolContext: () => ({
      getClient: vi.fn(),
      toolClient: () => ({
        account: { appId: 'cli_test' },
        senderOpenId: 'ou_sender',
        invokeByPath: mockInvokeByPath,
      }),
      log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      },
    }),
    handleInvokeErrorWithAutoAuth: (...args: unknown[]) => mockHandleInvokeErrorWithAutoAuth(...args),
  };
});

import { registerFeishuApprovalInstanceTool } from '../src/tools/oapi/approval/instance';
import { registerFeishuApprovalCcTool } from '../src/tools/oapi/approval/cc-search';
import { registerFeishuApprovalCommentTool } from '../src/tools/oapi/approval/comment';
import { registerFeishuApprovalTaskSearchTool } from '../src/tools/oapi/approval/task-search';
import { registerFeishuApprovalTaskTool } from '../src/tools/oapi/approval/task';

function parseToolResult(result: { content: Array<{ text: string }> }) {
  return JSON.parse(result.content[0].text);
}

function createMockApi() {
  const registeredTools: Record<string, any> = {};

  return {
    api: {
      config: {},
      registerTool: (def: any) => {
        registeredTools[def.name] = def;
      },
      logger: { debug: vi.fn() },
    },
    registeredTools,
  };
}

describe('approval tool execute path', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('lists approval instances and expands details by default', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalInstanceTool(api as any);

    mockInvokeByPath
      .mockResolvedValueOnce({
        code: 0,
        data: {
          instance_code_list: ['inst_1'],
          has_more: false,
          page_token: 'next-token',
        },
      })
      .mockResolvedValueOnce({
        code: 0,
        data: {
          instance_code: 'inst_1',
          approval_code: 'approval_1',
          approval_name: 'Leave',
          status: 'PENDING',
          user_id: 'ou_applicant',
          user_name: 'Alice',
          start_time: '1775005200000',
          task_list: [
            {
              task_id: 'task_1',
              task_def_key: 'MANAGER',
              node_name: 'Manager',
              status: 'PENDING',
              user_id: 'ou_manager',
              user_name: 'Bob',
            },
          ],
        },
      });

    const result = await registeredTools.feishu_approval_instance.execute('call-1', {
      action: 'list',
      approval_code: 'approval_1',
      start_time: '2026-04-01T09:00:00+08:00',
      end_time: '2026-04-02T18:30:00+08:00',
    });

    expect(mockInvokeByPath).toHaveBeenNthCalledWith(
      1,
      'feishu_approval_instance.list',
      '/open-apis/approval/v4/instances',
      {
        method: 'GET',
        query: {
          approval_code: 'approval_1',
          start_time: '1775005200000',
          end_time: '1775125800000',
          page_size: '50',
          user_id: 'ou_sender',
          user_id_type: 'open_id',
        },
        as: 'tenant',
      },
    );

    expect(mockInvokeByPath).toHaveBeenNthCalledWith(
      2,
      'feishu_approval_instance.get',
      '/open-apis/approval/v4/instances/inst_1',
      {
        method: 'GET',
        query: {
          user_id: 'ou_sender',
          user_id_type: 'open_id',
        },
        as: 'tenant',
      },
    );

    expect(parseToolResult(result)).toMatchObject({
      auth_mode: 'tenant',
      auth_fallback: false,
      instance_ids: ['inst_1'],
      has_more: false,
      page_token: 'next-token',
      instances: [
        {
          instance_id: 'inst_1',
          approval_code: 'approval_1',
          title: 'Leave',
          pending: true,
        },
      ],
    });
  });

  it('lists bounded approval instances directly with user-mode auth', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalInstanceTool(api as any);

    mockInvokeByPath.mockResolvedValueOnce({
      code: 0,
      data: {
        instance_code_list: ['inst_2'],
        has_more: false,
      },
    });

    const result = await registeredTools.feishu_approval_instance.execute('call-1b', {
      action: 'list',
      approval_code: 'approval_1',
      start_time: '2026-04-01T09:00:00+08:00',
      end_time: '2026-04-02T18:30:00+08:00',
      include_details: false,
    });

    expect(mockInvokeByPath).toHaveBeenNthCalledWith(
      1,
      'feishu_approval_instance.list',
      '/open-apis/approval/v4/instances',
      expect.objectContaining({
        as: 'tenant',
      }),
    );
    expect(mockHandleInvokeErrorWithAutoAuth).not.toHaveBeenCalled();

    expect(parseToolResult(result)).toEqual({
      auth_mode: 'tenant',
      auth_fallback: false,
      instance_ids: ['inst_2'],
      instances: [{ instance_id: 'inst_2' }],
      has_more: false,
      page_token: null,
      raw: {
        instance_code_list: ['inst_2'],
        has_more: false,
      },
    });
  });

  it('uses user mode for detail expansion after list', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalInstanceTool(api as any);

    mockInvokeByPath
      .mockResolvedValueOnce({
        code: 0,
        data: {
          instance_code_list: ['inst_3'],
          has_more: false,
        },
      })
      .mockResolvedValueOnce({
        code: 0,
        data: {
          instance_code: 'inst_3',
          approval_code: 'approval_3',
          approval_name: 'Travel',
          status: 'PENDING',
        },
      });

    const result = await registeredTools.feishu_approval_instance.execute('call-1c', {
      action: 'list',
      approval_code: 'approval_3',
      start_time: '2026-04-01T09:00:00+08:00',
      end_time: '2026-04-02T18:30:00+08:00',
      include_details: true,
    });

    expect(mockInvokeByPath).toHaveBeenNthCalledWith(
      2,
      'feishu_approval_instance.get',
      '/open-apis/approval/v4/instances/inst_3',
      {
        method: 'GET',
        query: {
          user_id: 'ou_sender',
          user_id_type: 'open_id',
        },
        as: 'tenant',
      },
    );

    expect(parseToolResult(result)).toMatchObject({
      auth_mode: 'tenant',
      auth_fallback: false,
      instance_ids: ['inst_3'],
      instances: [
        {
          instance_id: 'inst_3',
          approval_code: 'approval_3',
          title: 'Travel',
        },
      ],
    });
  });

  it('returns shaped approval API errors for get', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalInstanceTool(api as any);

    mockInvokeByPath.mockRejectedValueOnce({
      code: 1390003,
      msg: 'instance code not found',
    });

    const result = await registeredTools.feishu_approval_instance.execute('call-2', {
      action: 'get',
      instance_id: 'missing-instance',
    });

    expect(parseToolResult(result)).toEqual({
      error: {
        type: 'not_found',
        code: 1390003,
        message: 'instance code not found',
      },
    });
  });

  it('returns shaped approval API errors for get with tenant-mode execution', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalInstanceTool(api as any);

    mockInvokeByPath.mockRejectedValueOnce({
      code: 1390003,
      msg: 'instance code not found',
    });

    const result = await registeredTools.feishu_approval_instance.execute('call-2', {
      action: 'get',
      instance_id: 'missing-instance',
    });

    expect(parseToolResult(result)).toEqual({
      error: {
        type: 'not_found',
        code: 1390003,
        message: 'instance code not found',
      },
    });
  });

  it('returns a shaped approval error when user-mode execution hits raw access-token failure', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalInstanceTool(api as any);

    mockHandleInvokeErrorWithAutoAuth.mockResolvedValueOnce({
      content: [
        {
          text: JSON.stringify({
            error: {
              type: 'personal_access_token_required',
              code: undefined,
              message:
                '当前审批接口以应用身份调用，缺少你的个人 access token，因此无法访问“待我审批”等个人审批数据。这不是你的个人权限问题，而是当前工具链的鉴权限制。',
              hint: '可以继续处理你明确指定的审批实例，例如审批实例 ID、审批链接，或一条具体审批通知消息；暂时不能主动列出你全部“待我审批”的审批单。',
            },
          }),
        },
      ],
    });
    mockInvokeByPath.mockRejectedValueOnce({
      msg: 'Missing access token for authorization',
    });

    const result = await registeredTools.feishu_approval_instance.execute('call-token', {
      action: 'list',
      approval_code: 'approval_1',
      start_time: '2026-04-01T00:00:00+08:00',
      end_time: '2026-04-02T23:59:59+08:00',
    });

    expect(parseToolResult(result)).toEqual({
      error: {
        type: 'personal_access_token_required',
        code: undefined,
        message:
          '当前审批接口以应用身份调用，缺少你的个人 access token，因此无法访问“待我审批”等个人审批数据。这不是你的个人权限问题，而是当前工具链的鉴权限制。',
        hint: '可以继续处理你明确指定的审批实例，例如审批实例 ID、审批链接，或一条具体审批通知消息；暂时不能主动列出你全部“待我审批”的审批单。',
      },
    });
  });

  it('sends approve requests with sender fallback user_id', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalTaskTool(api as any);

    mockInvokeByPath.mockResolvedValueOnce({
      code: 0,
      data: {},
    });

    const result = await registeredTools.feishu_approval_task.execute('call-3', {
      action: 'approve',
      approval_code: 'approval_1',
      instance_id: 'inst_1',
      task_id: 'task_1',
      comment: '同意',
    });

    expect(mockInvokeByPath).toHaveBeenCalledWith(
      'feishu_approval_task.approve',
      '/open-apis/approval/v4/tasks/approve',
      {
        method: 'POST',
        body: {
          approval_code: 'approval_1',
          instance_code: 'inst_1',
          task_id: 'task_1',
          user_id: 'ou_sender',
          comment: '同意',
        },
        query: {
          user_id_type: 'open_id',
        },
        as: 'tenant',
      },
    );

    expect(parseToolResult(result)).toEqual({
      action: 'approve',
      ok: true,
      result: {
        task_id: 'task_1',
        instance_id: 'inst_1',
        approval_code: 'approval_1',
      },
      raw: {},
    });
  });

  it('sends rollback requests with task_def_key_list', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalTaskTool(api as any);

    mockInvokeByPath.mockResolvedValueOnce({
      code: 0,
      data: {},
    });

    await registeredTools.feishu_approval_task.execute('call-4', {
      action: 'rollback',
      task_id: 'task_9',
      reason: '补材料',
      task_def_key_list: ['START', 'MANAGER'],
    });

    expect(mockInvokeByPath).toHaveBeenCalledWith(
      'feishu_approval_task.rollback',
      '/open-apis/approval/v4/instances/specified_rollback',
      {
        method: 'POST',
        body: {
          task_id: 'task_9',
          user_id: 'ou_sender',
          reason: '补材料',
          task_def_key_list: ['START', 'MANAGER'],
        },
        query: {
          user_id_type: 'open_id',
        },
        as: 'tenant',
      },
    );
  });

  it('sends add_sign requests with signer list', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalTaskTool(api as any);

    mockInvokeByPath.mockResolvedValueOnce({
      code: 0,
      data: {},
    });

    const result = await registeredTools.feishu_approval_task.execute('call-add-sign', {
      action: 'add_sign',
      approval_code: 'approval_1',
      instance_id: 'inst_1',
      task_id: 'task_1',
      comment: '请共同审批',
      add_sign_user_ids: ['ou_target_1', 'ou_target_2'],
      add_sign_type: 1,
      approval_method: 2,
    });

    expect(mockInvokeByPath).toHaveBeenCalledWith(
      'feishu_approval_task.add_sign',
      '/open-apis/approval/v4/instances/add_sign',
      {
        method: 'POST',
        body: {
          approval_code: 'approval_1',
          instance_code: 'inst_1',
          task_id: 'task_1',
          user_id: 'ou_sender',
          comment: '请共同审批',
          add_sign_user_ids: ['ou_target_1', 'ou_target_2'],
          add_sign_type: 1,
          approval_method: 2,
        },
        query: undefined,
        as: 'tenant',
      },
    );

    expect(parseToolResult(result)).toEqual({
      action: 'add_sign',
      ok: true,
      result: {
        task_id: 'task_1',
        instance_id: 'inst_1',
        approval_code: 'approval_1',
      },
      raw: {},
    });
  });

  it('sends resubmit requests with form payload', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalTaskTool(api as any);

    mockInvokeByPath.mockResolvedValueOnce({
      code: 0,
      data: {},
    });

    const result = await registeredTools.feishu_approval_task.execute('call-resubmit', {
      action: 'resubmit',
      approval_code: 'approval_1',
      instance_id: 'inst_1',
      task_id: 'task_1',
      comment: '补充后重新提交',
      form: '{"field":"value"}',
    });

    expect(mockInvokeByPath).toHaveBeenCalledWith(
      'feishu_approval_task.resubmit',
      '/open-apis/approval/v4/tasks/resubmit',
      {
        method: 'POST',
        body: {
          approval_code: 'approval_1',
          instance_code: 'inst_1',
          task_id: 'task_1',
          user_id: 'ou_sender',
          comment: '补充后重新提交',
          form: '{"field":"value"}',
        },
        query: {
          user_id_type: 'open_id',
        },
        as: 'tenant',
      },
    );

    expect(parseToolResult(result)).toEqual({
      action: 'resubmit',
      ok: true,
      result: {
        task_id: 'task_1',
        instance_id: 'inst_1',
        approval_code: 'approval_1',
      },
      raw: {},
    });
  });

  it('delegates approval task auth failures to auto-auth', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalTaskTool(api as any);

    mockHandleInvokeErrorWithAutoAuth.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify({ auth: 'started' }) }],
      details: { auth: 'started' },
    });

    mockInvokeByPath.mockRejectedValueOnce(
      new UserAuthRequiredError('ou_sender', {
        apiName: 'feishu_approval_task.approve',
        scopes: ['approval:approval:readonly'],
        appScopeVerified: true,
        appId: 'cli_xxx',
      }),
    );

    const result = await registeredTools.feishu_approval_task.execute('call-task-auth', {
      action: 'approve',
      approval_code: 'approval_1',
      instance_id: 'inst_1',
      task_id: 'task_1',
    });

    expect(mockHandleInvokeErrorWithAutoAuth).toHaveBeenCalledTimes(1);
    expect(parseToolResult(result)).toEqual({ auth: 'started' });
  });

  it('queries approval tasks without forcing auth mode', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalTaskSearchTool(api as any);

    mockInvokeByPath.mockResolvedValueOnce({
      code: 0,
      data: {
        tasks: [
          {
            topic: '1',
            user_id: 'ou_sender',
            title: '审批任务示例',
            status: 'Todo',
            process_status: 'Running',
            definition_code: 'approval_1',
            task_id: 'task_1',
            process_id: 'process_1',
          },
        ],
      },
    });

    const result = await registeredTools.feishu_approval_task_search.execute('call-task-query', {
      action: 'query',
      topic: '1',
      page_size: 20,
    });

    expect(mockInvokeByPath).toHaveBeenCalledWith(
      'feishu_approval_task_search.query',
      '/open-apis/approval/v4/tasks/query',
      {
        method: 'GET',
        query: {
          user_id: 'ou_sender',
          user_id_type: 'open_id',
          topic: '1',
          page_size: '20',
        },
      },
    );

    expect(parseToolResult(result)).toEqual({
      action: 'query',
      tasks: [
        {
          task_id: 'task_1',
          instance_id: 'process_1',
          title: '审批任务示例',
          topic: '1',
          user_id: 'ou_sender',
          status: 'Todo',
          process_status: 'Running',
          definition_code: 'approval_1',
          process_id: 'process_1',
          process_external_id: null,
          task_external_id: null,
          initiators: [],
          initiator_names: [],
          urls: {},
          raw: {
            topic: '1',
            user_id: 'ou_sender',
            title: '审批任务示例',
            status: 'Todo',
            process_status: 'Running',
            definition_code: 'approval_1',
            task_id: 'task_1',
            process_id: 'process_1',
          },
        },
      ],
      has_more: false,
      page_token: null,
      raw: {
        tasks: [
          {
            topic: '1',
            user_id: 'ou_sender',
            title: '审批任务示例',
            status: 'Todo',
            process_status: 'Running',
            definition_code: 'approval_1',
            task_id: 'task_1',
            process_id: 'process_1',
          },
        ],
      },
    });
  });

  it('normalizes approval task query fields from numeric/status and process_code payloads', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalTaskSearchTool(api as any);

    mockInvokeByPath.mockResolvedValueOnce({
      code: 0,
      data: {
        tasks: [
          {
            title: '加班',
            task_id: 'task_real_1',
            process_id: '7623331104132566206',
            process_code: '69A3CF36-26DB-4280-B863-4977D3DFC4F5',
            definition_code: '0EE39A23-CABC-4739-AC42-575AD6D5B183',
            topic: 1,
            status: 1,
            process_status: 1,
            user_id: 'ou_sender',
            task_external_id: 'task_real_1',
            initiators: ['ou_initiator'],
            initiator_names: ['刘国锋'],
          },
        ],
      },
    });

    const result = await registeredTools.feishu_approval_task_search.execute('call-task-query-normalize', {
      action: 'query',
      topic: '1',
    });

    expect(parseToolResult(result)).toEqual({
      action: 'query',
      tasks: [
        {
          task_id: 'task_real_1',
          instance_id: '69A3CF36-26DB-4280-B863-4977D3DFC4F5',
          title: '加班',
          topic: '1',
          user_id: 'ou_sender',
          status: '1',
          process_status: '1',
          definition_code: '0EE39A23-CABC-4739-AC42-575AD6D5B183',
          process_id: '7623331104132566206',
          process_external_id: null,
          task_external_id: 'task_real_1',
          initiators: ['ou_initiator'],
          initiator_names: ['刘国锋'],
          urls: {},
          raw: {
            title: '加班',
            task_id: 'task_real_1',
            process_id: '7623331104132566206',
            process_code: '69A3CF36-26DB-4280-B863-4977D3DFC4F5',
            definition_code: '0EE39A23-CABC-4739-AC42-575AD6D5B183',
            topic: 1,
            status: 1,
            process_status: 1,
            user_id: 'ou_sender',
            task_external_id: 'task_real_1',
            initiators: ['ou_initiator'],
            initiator_names: ['刘国锋'],
          },
        },
      ],
      has_more: false,
      page_token: null,
      raw: {
        tasks: [
          {
            title: '加班',
            task_id: 'task_real_1',
            process_id: '7623331104132566206',
            process_code: '69A3CF36-26DB-4280-B863-4977D3DFC4F5',
            definition_code: '0EE39A23-CABC-4739-AC42-575AD6D5B183',
            topic: 1,
            status: 1,
            process_status: 1,
            user_id: 'ou_sender',
            task_external_id: 'task_real_1',
            initiators: ['ou_initiator'],
            initiator_names: ['刘国锋'],
          },
        ],
      },
    });
  });

  it('auto-auths approval task query when raw access-token failure is returned', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalTaskSearchTool(api as any);

    mockHandleInvokeErrorWithAutoAuth.mockResolvedValueOnce({
      content: [{ text: JSON.stringify({ auth: 'started' }) }],
    });
    mockInvokeByPath.mockResolvedValueOnce({
      code: 999,
      msg: 'Missing access token for authorization',
    });

    const result = await registeredTools.feishu_approval_task_search.execute('call-task-query-auth', {
      action: 'query',
      topic: '1',
    });

    expect(mockHandleInvokeErrorWithAutoAuth).toHaveBeenCalledTimes(1);
    expect(mockHandleInvokeErrorWithAutoAuth.mock.calls[0]?.[0]).toBeInstanceOf(UserAuthRequiredError);
    expect(parseToolResult(result)).toEqual({ auth: 'started' });
  });

  it('searches approval tasks with tenant-mode auth', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalTaskSearchTool(api as any);

    mockInvokeByPath.mockResolvedValueOnce({
      code: 0,
      data: {
        tasks: [
          {
            title: '审批任务搜索结果',
            task_id: 'task_search_1',
            process_id: 'process_search_1',
            definition_code: 'approval_1',
            status: 'PENDING',
          },
        ],
        count: 1,
      },
    });

    const result = await registeredTools.feishu_approval_task_search.execute('call-task-search', {
      action: 'search',
      approval_code: 'approval_1',
      task_status: 'PENDING',
      page_size: 20,
    });

    expect(mockInvokeByPath).toHaveBeenCalledWith(
      'feishu_approval_task_search.search',
      '/open-apis/approval/v4/tasks/search',
      {
        method: 'POST',
        query: {
          user_id_type: 'open_id',
          page_size: '20',
        },
        body: {
          approval_code: 'approval_1',
          task_status: 'PENDING',
        },
        as: 'tenant',
      },
    );

    expect(parseToolResult(result)).toEqual({
      action: 'search',
      tasks: [
        {
          task_id: 'task_search_1',
          instance_id: 'process_search_1',
          title: '审批任务搜索结果',
          topic: null,
          user_id: null,
          status: 'PENDING',
          process_status: null,
          definition_code: 'approval_1',
          process_id: 'process_search_1',
          process_external_id: null,
          task_external_id: null,
          initiators: [],
          initiator_names: [],
          urls: {},
          raw: {
            title: '审批任务搜索结果',
            task_id: 'task_search_1',
            process_id: 'process_search_1',
            definition_code: 'approval_1',
            status: 'PENDING',
          },
        },
      ],
      count: 1,
      has_more: false,
      page_token: null,
      raw: {
        tasks: [
          {
            title: '审批任务搜索结果',
            task_id: 'task_search_1',
            process_id: 'process_search_1',
            definition_code: 'approval_1',
            status: 'PENDING',
          },
        ],
        count: 1,
      },
    });
  });

  it('gets approval task detail through instance detail lookup', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalTaskSearchTool(api as any);

    mockInvokeByPath.mockResolvedValueOnce({
      code: 0,
      data: {
        instance_code: 'inst_1',
        approval_code: 'approval_1',
        approval_name: '请假审批',
        status: 'PENDING',
        user_id: 'ou_applicant',
        open_id: 'ou_applicant',
        user_name: 'Alice',
        form: JSON.stringify([
          {
            id: 'widget_reason',
            name: '请假原因',
            type: 'textarea',
            value: '家中有事',
          },
        ]),
        task_list: [
          {
            task_id: 'task_1',
            task_def_key: 'MANAGER',
            node_name: '直属领导',
            status: 'PENDING',
            user_id: 'ou_manager',
            open_id: 'ou_manager',
            user_name: 'Bob',
            start_time: '1775008800000',
          },
        ],
      },
    });

    const result = await registeredTools.feishu_approval_task_search.execute('call-task-detail', {
      action: 'get_detail',
      instance_id: 'inst_1',
      task_id: 'task_1',
    });

    expect(mockInvokeByPath).toHaveBeenCalledWith(
      'feishu_approval_task_search.get_detail',
      '/open-apis/approval/v4/instances/inst_1',
      {
        method: 'GET',
        query: {
          user_id: 'ou_sender',
          user_id_type: 'open_id',
        },
        as: 'tenant',
      },
    );

    expect(parseToolResult(result)).toMatchObject({
      action: 'get_detail',
      task_id: 'task_1',
      instance_id: 'inst_1',
      found: true,
      task: {
        task_id: 'task_1',
        node_id: 'MANAGER',
        node_name: '直属领导',
        status: 'PENDING',
        user_id: 'ou_manager',
        open_id: 'ou_manager',
        user_name: 'Bob',
      },
      instance: {
        instance_id: 'inst_1',
        approval_code: 'approval_1',
        title: '请假审批',
        form: {
          fields: [
            expect.objectContaining({
              id: 'widget_reason',
              name: '请假原因',
              type: 'textarea',
              value: '家中有事',
              text: '家中有事',
            }),
          ],
          text: '请假原因: 家中有事',
        },
      },
    });
  });

  it('matches approval task detail when instance task list uses id and exposes attachment hints', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalTaskSearchTool(api as any);

    mockInvokeByPath.mockResolvedValueOnce({
      code: 0,
      data: {
        instance_code: 'inst_real',
        approval_code: 'approval_real',
        approval_name: '加班',
        status: 'PENDING',
        form: JSON.stringify([
          {
            id: 'widget_attachment',
            name: '凭证',
            type: 'attachmentV2',
            ext: 'IMG_2598.jpeg',
            value: ['https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=real'],
          },
        ]),
        task_list: [
          {
            id: 'task_real',
            node_id: 'NODE_REAL',
            node_name: '审批',
            status: 'PENDING',
            open_id: 'ou_approver',
            user_id: 'u_approver',
          },
        ],
      },
    });

    const result = await registeredTools.feishu_approval_task_search.execute('call-task-detail-real', {
      action: 'get_detail',
      instance_id: 'inst_real',
      task_id: 'task_real',
    });

    expect(parseToolResult(result)).toMatchObject({
      action: 'get_detail',
      task_id: 'task_real',
      instance_id: 'inst_real',
      found: true,
      task: {
        task_id: 'task_real',
        node_id: 'NODE_REAL',
        node_name: '审批',
      },
      instance: {
        form: {
          fields: [
            expect.objectContaining({
              id: 'widget_attachment',
              type: 'attachmentV2',
              attachment_urls: [
                'https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=real',
              ],
              file_name: 'IMG_2598.jpeg',
            }),
          ],
        },
      },
    });
  });

  it('downloads approval attachment from internal drive stream url', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalTaskSearchTool(api as any);

    mockFeishuFetch.mockResolvedValueOnce(
      new Response(Buffer.from('image-bytes'), {
        status: 200,
        headers: {
          'content-type': 'image/jpeg',
          'content-disposition': 'attachment; filename="IMG_2598.jpeg"',
        },
      }),
    );

    const result = await registeredTools.feishu_approval_task_search.execute('call-task-attachment-download', {
      action: 'download_attachment',
      attachment_url:
        'https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=real',
    });

    expect(mockFeishuFetch).toHaveBeenCalledWith(
      'https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=real',
      { method: 'GET' },
    );

    expect(parseToolResult(result)).toMatchObject({
      action: 'download_attachment',
      source_url:
        'https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=real',
      file_name: 'IMG_2598.jpeg',
      size_bytes: 11,
      content_type: 'image/jpeg',
      saved_path: expect.stringContaining('IMG_2598.jpeg'),
    });
  });

  it('sanitizes attachment filenames before saving into controlled tmpdir', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalTaskSearchTool(api as any);

    mockFeishuFetch.mockResolvedValueOnce(
      new Response(Buffer.from('safe-bytes'), {
        status: 200,
        headers: {
          'content-type': 'text/plain',
        },
      }),
    );

    const result = await registeredTools.feishu_approval_task_search.execute('call-task-attachment-download-safe-name', {
      action: 'download_attachment',
      attachment_url:
        'https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=safe-name',
      file_name: '..\\\\..\\\\nested/evil.txt',
    });

    expect(parseToolResult(result)).toMatchObject({
      action: 'download_attachment',
      file_name: 'evil.txt',
      saved_path: path.join(os.tmpdir(), 'openclaw-lark', 'approval-attachments', 'evil.txt'),
    });
  });

  it('ignores arbitrary output_path directories and stores attachment under controlled tmpdir', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalTaskSearchTool(api as any);

    mockFeishuFetch.mockResolvedValueOnce(
      new Response(Buffer.from('safe-bytes'), {
        status: 200,
        headers: {
          'content-type': 'text/plain',
          'content-disposition': 'attachment; filename="server-name.txt"',
        },
      }),
    );

    const result = await registeredTools.feishu_approval_task_search.execute(
      'call-task-attachment-download-output-path-root',
      {
        action: 'download_attachment',
        attachment_url:
          'https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=output-path',
        output_path: '/etc/cron.d/plugin.conf',
      },
    );

    expect(parseToolResult(result)).toMatchObject({
      action: 'download_attachment',
      file_name: 'plugin.conf',
      saved_path: path.join(os.tmpdir(), 'openclaw-lark', 'approval-attachments', 'plugin.conf'),
    });
  });

  it('parses text attachment by downloading on demand', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalTaskSearchTool(api as any);

    mockFeishuFetch.mockResolvedValueOnce(
      new Response('发票号: 123456\n金额: 88.00', {
        status: 200,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'content-disposition': 'attachment; filename="invoice.txt"',
        },
      }),
    );

    const result = await registeredTools.feishu_approval_task_search.execute('call-task-attachment-parse-text', {
      action: 'parse_attachment',
      attachment_url:
        'https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=text',
    });

    expect(parseToolResult(result)).toMatchObject({
      action: 'parse_attachment',
      file_name: 'invoice.txt',
      content_type: 'text/plain; charset=utf-8',
      parsed: true,
      text: '发票号: 123456\n金额: 88.00',
      preview: '发票号: 123456\n金额: 88.00',
      saved_path: expect.stringContaining('invoice.txt'),
    });
  });

  it('parses image attachment as metadata only', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalTaskSearchTool(api as any);

    const jpegBytes = Buffer.from([
      0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06,
      0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d,
      0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f,
      0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c,
      0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34,
      0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff,
      0xc0, 0x00, 0x11, 0x08, 0x00, 0x02, 0x00, 0x03, 0x03, 0x01, 0x22, 0x00,
      0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xd9,
    ]);

    mockFeishuFetch.mockResolvedValueOnce(
      new Response(jpegBytes, {
        status: 200,
        headers: {
          'content-type': 'image/jpeg',
          'content-disposition': 'attachment; filename="IMG_2598.jpeg"',
        },
      }),
    );

    const result = await registeredTools.feishu_approval_task_search.execute('call-task-attachment-parse-image', {
      action: 'parse_attachment',
      attachment_url:
        'https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=image',
    });

    expect(parseToolResult(result)).toMatchObject({
      action: 'parse_attachment',
      file_name: 'IMG_2598.jpeg',
      content_type: 'image/jpeg',
      parsed: false,
      image: {
        width: 3,
        height: 2,
      },
      note: expect.stringContaining('does not run OCR'),
      saved_path: expect.stringContaining('IMG_2598.jpeg'),
    });
  });

  it('rejects parse_attachment saved_path outside controlled attachment directory', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalTaskSearchTool(api as any);

    const result = await registeredTools.feishu_approval_task_search.execute('call-task-attachment-parse-outside-root', {
      action: 'parse_attachment',
      saved_path: path.join(os.tmpdir(), 'approval-tool-outside-root.txt'),
    });

    expect(parseToolResult(result)).toMatchObject({
      error: {
        type: 'api_error',
        message: expect.stringContaining('Local file access denied'),
      },
    });
  });

  it('returns shaped tool errors for attachment download failures', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalTaskSearchTool(api as any);

    const result = await registeredTools.feishu_approval_task_search.execute('call-task-attachment-download-error', {
      action: 'download_attachment',
      attachment_url: 'https://example.com/not-allowed',
    });

    expect(parseToolResult(result)).toMatchObject({
      error: {
        type: 'api_error',
        message: expect.stringContaining('unsupported approval attachment host'),
      },
    });
  });

  it('searches approval cc list with tenant-mode auth', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalCcTool(api as any);

    mockInvokeByPath.mockResolvedValueOnce({
      code: 0,
      data: {
        count: 1,
        cc_list: [
          {
            approval: {
              code: 'approval_1',
              name: '请假',
            },
            instance: {
              code: 'inst_1',
              title: '请假审批',
              status: 'pending',
              link: {
                pc_link: 'https://example.com/pc',
              },
            },
            cc: {
              user_id: 'ou_sender',
              create_time: '1775008800000',
              read_status: 'unread',
              title: '抄送标题',
            },
          },
        ],
      },
    });

    const result = await registeredTools.feishu_approval_cc.execute('call-cc-search', {
      action: 'search',
      read_status: 'UNREAD',
      page_size: 20,
    });

    expect(mockInvokeByPath).toHaveBeenCalledWith(
      'feishu_approval_cc.search',
      '/open-apis/approval/v4/instances/search_cc',
      {
        method: 'POST',
        query: {
          user_id_type: 'open_id',
          page_size: '20',
        },
        body: {
          user_id: 'ou_sender',
          read_status: 'UNREAD',
        },
        as: 'tenant',
      },
    );

    expect(parseToolResult(result)).toEqual({
      action: 'search',
      cc_list: [
        {
          approval: {
            code: 'approval_1',
            name: '请假',
            approval_id: null,
            icon: null,
            is_external: false,
            batch_cc_read: null,
          },
          group: {
            external_id: null,
            name: null,
          },
          instance: {
            code: 'inst_1',
            external_id: null,
            user_id: null,
            start_time: null,
            end_time: null,
            status: 'pending',
            title: '请假审批',
            extra: null,
            serial_id: null,
            links: {
              pc_link: 'https://example.com/pc',
            },
          },
          cc: {
            user_id: 'ou_sender',
            create_time: '2026-04-01T10:00:00+08:00',
            read_status: 'unread',
            title: '抄送标题',
            extra: null,
            links: {},
          },
          raw: {
            approval: {
              code: 'approval_1',
              name: '请假',
            },
            instance: {
              code: 'inst_1',
              title: '请假审批',
              status: 'pending',
              link: {
                pc_link: 'https://example.com/pc',
              },
            },
            cc: {
              user_id: 'ou_sender',
              create_time: '1775008800000',
              read_status: 'unread',
              title: '抄送标题',
            },
          },
        },
      ],
      count: 1,
      has_more: false,
      page_token: null,
      raw: {
        count: 1,
        cc_list: [
          {
            approval: {
              code: 'approval_1',
              name: '请假',
            },
            instance: {
              code: 'inst_1',
              title: '请假审批',
              status: 'pending',
              link: {
                pc_link: 'https://example.com/pc',
              },
            },
            cc: {
              user_id: 'ou_sender',
              create_time: '1775008800000',
              read_status: 'unread',
              title: '抄送标题',
            },
          },
        ],
      },
    });
  });

  it('lists approval comments with user-mode auth', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalCommentTool(api as any);

    mockInvokeByPath.mockResolvedValueOnce({
      code: 0,
      data: {
        comments: [
          {
            id: 'comment_1',
            content: '请补充附件',
            create_time: '1775005200000',
            update_time: '1775008800000',
            is_delete: 0,
            commentator: 'ou_manager',
          },
        ],
      },
    });

    const result = await registeredTools.feishu_approval_comment.execute('call-comment-list', {
      action: 'list',
      instance_id: 'inst_1',
      page_size: 20,
    });

    expect(mockInvokeByPath).toHaveBeenCalledWith(
      'feishu_approval_comment.list',
      '/open-apis/approval/v4/instances/inst_1/comments',
      {
        method: 'GET',
        query: {
          user_id_type: 'open_id',
          user_id: 'ou_sender',
          page_size: '20',
        },
        as: 'tenant',
      },
    );

    expect(parseToolResult(result)).toEqual({
      action: 'list',
      auth_mode: 'tenant',
      auth_fallback: false,
      comments: [
        {
          id: 'comment_1',
          content: '请补充附件',
          create_time: '2026-04-01T09:00:00+08:00',
          update_time: '2026-04-01T10:00:00+08:00',
          is_deleted: false,
          commentator: 'ou_manager',
          extra: null,
          at_info_list: [],
          replies: [],
          raw: {
            id: 'comment_1',
            content: '请补充附件',
            create_time: '1775005200000',
            update_time: '1775008800000',
            is_delete: 0,
            commentator: 'ou_manager',
          },
        },
      ],
      raw: {
        comments: [
          {
            id: 'comment_1',
            content: '请补充附件',
            create_time: '1775005200000',
            update_time: '1775008800000',
            is_delete: 0,
            commentator: 'ou_manager',
          },
        ],
      },
    });
  });

  it('lists approval comments directly with tenant-mode auth', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalCommentTool(api as any);

    mockInvokeByPath.mockResolvedValueOnce({
      code: 0,
      data: {
        comments: [],
      },
    });

    const result = await registeredTools.feishu_approval_comment.execute('call-comment-list-fallback', {
      action: 'list',
      instance_id: 'inst_1',
    });

    expect(mockInvokeByPath).toHaveBeenNthCalledWith(
      1,
      'feishu_approval_comment.list',
      '/open-apis/approval/v4/instances/inst_1/comments',
      expect.objectContaining({ as: 'tenant' }),
    );
    expect(parseToolResult(result)).toEqual({
      action: 'list',
      auth_mode: 'tenant',
      auth_fallback: false,
      comments: [],
      raw: {
        comments: [],
      },
    });
  });

  it('creates approval comments with tenant-mode auth', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuApprovalCommentTool(api as any);

    mockInvokeByPath.mockResolvedValueOnce({
      code: 0,
      data: {
        comment_id: 'comment_2',
      },
    });

    const result = await registeredTools.feishu_approval_comment.execute('call-comment-create', {
      action: 'create',
      instance_id: 'inst_1',
      content: '请补充附件',
    });

    expect(mockInvokeByPath).toHaveBeenCalledWith(
      'feishu_approval_comment.create',
      '/open-apis/approval/v4/instances/inst_1/comments',
      {
        method: 'POST',
        query: {
          user_id_type: 'open_id',
          user_id: 'ou_sender',
        },
        body: {
          content: '请补充附件',
          at_info_list: undefined,
          parent_comment_id: undefined,
          comment_id: undefined,
          disable_bot: undefined,
          extra: undefined,
        },
        as: 'tenant',
      },
    );

    expect(parseToolResult(result)).toEqual({
      action: 'create',
      ok: true,
      comment_id: 'comment_2',
      raw: {
        comment_id: 'comment_2',
      },
    });
  });
});
