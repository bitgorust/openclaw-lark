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
        senderOpenId: undefined,
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

import { registerFeishuAttendanceShiftTool } from '../src/tools/oapi/attendance/shift';
import { registerFeishuAttendanceGroupTool } from '../src/tools/oapi/attendance/group';

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

describe('attendance tool execute path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries attendance shifts via tenant auth', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuAttendanceShiftTool(api as any);

    mockInvokeByPath.mockResolvedValueOnce({
      code: 0,
      data: {
        user_daily_shifts: [
          {
            user_id: 'ou_1',
            month: '202604',
            day_no: 2,
            group_id: 'group_1',
            shift: {
              id: 'shift_1',
              name: '早班',
            },
          },
        ],
      },
    });

    const result = await registeredTools.feishu_attendance_shift.execute('call-1', {
      action: 'query',
      user_ids: ['ou_1'],
      check_date_from: '2026-04-01',
      check_date_to: '2026-04-30',
      employee_type: 'employee_id',
    });

    expect(mockInvokeByPath).toHaveBeenCalledWith(
      'feishu_attendance_shift.query',
      '/open-apis/attendance/v1/user_daily_shifts/query',
      {
        method: 'POST',
        body: {
          user_ids: ['ou_1'],
          check_date_from: '20260401',
          check_date_to: '20260430',
        },
        query: {
          employee_type: 'employee_id',
        },
        as: 'tenant',
      },
    );

    expect(parseToolResult(result)).toMatchObject({
      employee_type: 'employee_id',
      check_date_from: '20260401',
      check_date_to: '20260430',
      shifts: [
        {
          user_id: 'ou_1',
          check_date: '2026-04-02',
          shift_id: 'shift_1',
          shift_name: '早班',
        },
      ],
    });
  });

  it('gets attendance group details via tenant auth', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuAttendanceGroupTool(api as any);

    mockInvokeByPath.mockResolvedValueOnce({
      code: 0,
      data: {
        group_id: 'group_1',
        group_name: '研发考勤组',
        owner_id: 'ou_admin',
        timezone: 'Asia/Shanghai',
        bind_user_count: 12,
      },
    });

    const result = await registeredTools.feishu_attendance_group.execute('call-2', {
      action: 'get',
      group_id: 'group_1',
      employee_type: 'employee_id',
      dept_type: 'open_department_id',
    });

    expect(mockInvokeByPath).toHaveBeenCalledWith(
      'feishu_attendance_group.get',
      '/open-apis/attendance/v1/groups/group_1',
      {
        method: 'GET',
        query: {
          employee_type: 'employee_id',
          dept_type: 'open_department_id',
        },
        as: 'tenant',
      },
    );

    expect(parseToolResult(result)).toEqual({
      group: {
        group_id: 'group_1',
        group_name: '研发考勤组',
        owner_id: 'ou_admin',
        timezone: 'Asia/Shanghai',
        bind_user_count: 12,
        raw: expect.any(Object),
      },
      raw: expect.any(Object),
    });
  });

  it('lists attendance group users with paging', async () => {
    const { api, registeredTools } = createMockApi();
    registerFeishuAttendanceGroupTool(api as any);

    mockInvokeByPath.mockResolvedValueOnce({
      code: 0,
      data: {
        has_more: true,
        page_token: 'next-1',
        user_list: [
          {
            user_id: 'ou_1',
            name: 'Alice',
            department_ids: ['od_1'],
            member_clock_type: '1',
          },
        ],
      },
    });

    const result = await registeredTools.feishu_attendance_group.execute('call-3', {
      action: 'list_users',
      group_id: 'group_1',
      employee_type: 'employee_id',
      dept_type: 'open_department_id',
      member_clock_type: 1,
      page_size: 100,
    });

    expect(mockInvokeByPath).toHaveBeenCalledWith(
      'feishu_attendance_group.list_users',
      '/open-apis/attendance/v1/groups/group_1/list_user',
      {
        method: 'GET',
        query: {
          employee_type: 'employee_id',
          dept_type: 'open_department_id',
          member_clock_type: '1',
          page_size: '100',
        },
        as: 'tenant',
      },
    );

    expect(parseToolResult(result)).toEqual({
      group_id: 'group_1',
      has_more: true,
      page_token: 'next-1',
      users: [
        {
          user_id: 'ou_1',
          name: 'Alice',
          department_ids: ['od_1'],
          member_clock_type: '1',
          raw: expect.any(Object),
        },
      ],
      raw: expect.any(Object),
    });
  });
});
