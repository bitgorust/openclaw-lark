import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockInvokeByPath = vi.fn();
const mockHandleInvokeErrorWithAutoAuth = vi.fn();

vi.mock('../src/core/lark-logger', () => ({
  larkLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

vi.mock('../src/tools/oapi/helpers', async () => {
  const actual = await vi.importActual<typeof import('../src/tools/oapi/helpers')>('../src/tools/oapi/helpers');

  return {
    ...actual,
    createToolContext: () => ({
      getClient: vi.fn(),
      toolClient: () => ({
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
    vi.clearAllMocks();
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
});
