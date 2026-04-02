import { describe, expect, it } from 'vitest';
import {
  buildAttendanceShiftQueryRequest,
  normalizeAttendanceShiftResponse,
  shapeAttendanceError,
} from '../src/tools/oapi/attendance/shift';
import {
  buildAttendanceGroupGetQuery,
  buildAttendanceGroupListUsersQuery,
  normalizeAttendanceGroup,
  normalizeAttendanceGroupUsersResponse,
} from '../src/tools/oapi/attendance/group';

describe('attendance shift helpers', () => {
  it('normalizes attendance date formats into yyyymmdd request fields', () => {
    expect(
      buildAttendanceShiftQueryRequest({
        action: 'query',
        user_ids: ['ou_1', 'ou_2'],
        check_date_from: '2026-04-01',
        check_date_to: '20260430',
        employee_type: 'employee_id',
      }),
    ).toEqual({
      body: {
        user_ids: ['ou_1', 'ou_2'],
        check_date_from: '20260401',
        check_date_to: '20260430',
      },
      query: {
        employee_type: 'employee_id',
      },
    });
  });

  it('normalizes shift records for agent consumption', () => {
    const normalized = normalizeAttendanceShiftResponse({
      user_daily_shifts: [
        {
          user_id: 'ou_1',
          month: '202604',
          day_no: 2,
          group_id: 'group_1',
          is_rest_day: false,
          shift: {
            id: 'shift_1',
            name: '早班',
          },
        },
      ],
    });

    expect(normalized).toEqual({
      shifts: [
        {
          user_id: 'ou_1',
          check_date: '2026-04-02',
          shift_id: 'shift_1',
          shift_name: '早班',
          group_id: 'group_1',
          is_rest_day: false,
          raw: expect.any(Object),
        },
      ],
      raw: expect.any(Object),
    });
  });
});

describe('attendance group helpers', () => {
  it('builds group get query with defaults', () => {
    expect(buildAttendanceGroupGetQuery({})).toEqual({
      employee_type: 'employee_id',
      dept_type: 'open_department_id',
    });
  });

  it('builds list users query with paging and filters', () => {
    expect(
      buildAttendanceGroupListUsersQuery({
        employee_type: 'employee_id',
        dept_type: 'open_department_id',
        member_clock_type: 1,
        page_size: 100,
        page_token: 'next-1',
      }),
    ).toEqual({
      employee_type: 'employee_id',
      dept_type: 'open_department_id',
      member_clock_type: '1',
      page_size: '100',
      page_token: 'next-1',
    });
  });

  it('normalizes attendance group and group users', () => {
    expect(
      normalizeAttendanceGroup({
        group_id: 'group_1',
        group_name: '研发考勤组',
        owner_id: 'ou_admin',
        timezone: 'Asia/Shanghai',
        bind_user_count: 12,
      }),
    ).toEqual({
      group_id: 'group_1',
      group_name: '研发考勤组',
      owner_id: 'ou_admin',
      timezone: 'Asia/Shanghai',
      bind_user_count: 12,
      raw: expect.any(Object),
    });

    expect(
      normalizeAttendanceGroupUsersResponse({
        has_more: true,
        page_token: 'next-2',
        user_list: [
          {
            user_id: 'ou_1',
            name: 'Alice',
            department_ids: ['od_1', 'od_2'],
            member_clock_type: '1',
          },
        ],
      }),
    ).toEqual({
      users: [
        {
          user_id: 'ou_1',
          name: 'Alice',
          department_ids: ['od_1', 'od_2'],
          member_clock_type: '1',
          raw: expect.any(Object),
        },
      ],
      has_more: true,
      page_token: 'next-2',
      raw: expect.any(Object),
    });
  });
});

describe('attendance error shaping', () => {
  it('classifies well-known attendance errors', () => {
    expect(shapeAttendanceError({ code: 1220004, msg: 'group not found' })).toEqual({
      type: 'not_found',
      code: 1220004,
      message: 'group not found',
    });
    expect(shapeAttendanceError({ code: 1220005, msg: 'permission denied' })).toEqual({
      type: 'permission_denied',
      code: 1220005,
      message: 'permission denied',
    });
    expect(shapeAttendanceError({ code: 1220001, msg: 'invalid param' })).toEqual({
      type: 'invalid_request',
      code: 1220001,
      message: 'invalid param',
    });
  });
});
