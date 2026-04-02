import { describe, expect, it } from 'vitest';
import {
  buildApprovalInstanceGetQuery,
  buildApprovalInstanceListQuery,
  normalizeApprovalInstance,
  shapeApprovalError,
} from '../src/tools/oapi/approval/instance';
import { buildApprovalRollbackRequest, buildApprovalTaskRequest } from '../src/tools/oapi/approval/task';

describe('approval instance helpers', () => {
  it('converts list time filters into millisecond query params', () => {
    expect(
      buildApprovalInstanceListQuery({
        approval_code: 'approval-code',
        start_time: '2026-04-01T09:00:00+08:00',
        end_time: '2026-04-02T18:30:00+08:00',
        page_size: 100,
        page_token: 'token-1',
        locale: 'zh-CN',
        user_id: 'ou_user',
        user_id_type: 'open_id',
      }),
    ).toEqual({
      approval_code: 'approval-code',
      start_time: '1775005200000',
      end_time: '1775125800000',
      page_size: '100',
      page_token: 'token-1',
      locale: 'zh-CN',
      user_id: 'ou_user',
      user_id_type: 'open_id',
    });
  });

  it('passes through numeric approval timestamps unchanged', () => {
    expect(
      buildApprovalInstanceListQuery({
        approval_code: 'approval-code',
        start_time: '1775005200000',
        end_time: '1775125800000',
      }),
    ).toEqual({
      approval_code: 'approval-code',
      start_time: '1775005200000',
      end_time: '1775125800000',
    });
  });

  it('builds optional get query only when fields are present', () => {
    expect(
      buildApprovalInstanceGetQuery({
        locale: 'en-US',
        user_id: 'ou_applicant',
        user_id_type: 'open_id',
      }),
    ).toEqual({
      locale: 'en-US',
      user_id: 'ou_applicant',
      user_id_type: 'open_id',
    });
    expect(buildApprovalInstanceGetQuery({})).toBeUndefined();
  });

  it('normalizes approval details for agent consumption', () => {
    const normalized = normalizeApprovalInstance({
      instance_code: 'inst_123',
      approval_code: 'approval_456',
      approval_name: 'Overtime Approval',
      status: 'PENDING',
      user_id: 'ou_applicant',
      open_id: 'ou_applicant',
      user_name: 'Alice',
      department_name: 'R&D',
      start_time: '1775005200000',
      end_time: '1775125800000',
      task_list: [
        {
          task_id: 'task_1',
          task_def_key: 'START',
          node_name: '直属领导',
          status: 'PENDING',
          user_id: 'ou_manager',
          open_id: 'ou_manager',
          user_name: 'Bob',
          start_time: '1775008800000',
        },
      ],
    });

    expect(normalized).toEqual({
      instance_id: 'inst_123',
      approval_code: 'approval_456',
      title: 'Overtime Approval',
      status: 'PENDING',
      applicant: {
        user_id: 'ou_applicant',
        open_id: 'ou_applicant',
        name: 'Alice',
        department_name: 'R&D',
      },
      approvers: [
        {
          task_id: 'task_1',
          node_id: 'START',
          node_name: '直属领导',
          status: 'PENDING',
          user_id: 'ou_manager',
          open_id: 'ou_manager',
          user_name: 'Bob',
        },
      ],
      create_time: '2026-04-01T09:00:00+08:00',
      finish_time: '2026-04-02T18:30:00+08:00',
      pending: true,
      tasks: [
        {
          task_id: 'task_1',
          node_id: 'START',
          node_name: '直属领导',
          status: 'PENDING',
          user_id: 'ou_manager',
          open_id: 'ou_manager',
          user_name: 'Bob',
          start_time: '2026-04-01T10:00:00+08:00',
          end_time: null,
        },
      ],
      raw: expect.any(Object),
    });
  });
});

describe('approval task helpers', () => {
  it('builds approve/reject request bodies with sender fallback', () => {
    expect(
      buildApprovalTaskRequest(
        {
          action: 'approve',
          approval_code: 'approval_456',
          instance_id: 'inst_123',
          task_id: 'task_1',
          comment: 'Looks good',
        },
        'ou_sender',
      ),
    ).toEqual({
      body: {
        approval_code: 'approval_456',
        instance_code: 'inst_123',
        task_id: 'task_1',
        user_id: 'ou_sender',
        comment: 'Looks good',
      },
      query: {
        user_id_type: 'open_id',
      },
      path: '/open-apis/approval/v4/tasks/approve',
    });
  });

  it('builds transfer requests with target user', () => {
    expect(
      buildApprovalTaskRequest({
        action: 'transfer',
        approval_code: 'approval_456',
        instance_id: 'inst_123',
        task_id: 'task_1',
        user_id: 'ou_sender',
        transfer_user_id: 'ou_target',
        user_id_type: 'open_id',
      }),
    ).toEqual({
      body: {
        approval_code: 'approval_456',
        instance_code: 'inst_123',
        task_id: 'task_1',
        user_id: 'ou_sender',
        transfer_user_id: 'ou_target',
      },
      query: {
        user_id_type: 'open_id',
      },
      path: '/open-apis/approval/v4/tasks/transfer',
    });
  });

  it('builds rollback requests with task_def_key_list', () => {
    expect(
      buildApprovalRollbackRequest(
        {
          action: 'rollback',
          task_id: 'task_9',
          reason: 'Please add more detail',
          task_def_key_list: ['START', 'APPROVAL_1'],
          extra: 'not_used_yet',
        },
        'ou_sender',
      ),
    ).toEqual({
      body: {
        task_id: 'task_9',
        user_id: 'ou_sender',
        reason: 'Please add more detail',
        task_def_key_list: ['START', 'APPROVAL_1'],
        extra: 'not_used_yet',
      },
      query: {
        user_id_type: 'open_id',
      },
      path: '/open-apis/approval/v4/instances/specified_rollback',
    });
  });
});

describe('approval error shaping', () => {
  it('classifies well-known approval API errors', () => {
    expect(shapeApprovalError({ code: 1390003, msg: 'instance code not found' })).toEqual({
      type: 'not_found',
      code: 1390003,
      message: 'instance code not found',
    });
    expect(shapeApprovalError({ code: 1390009, msg: 'no operation permission' })).toEqual({
      type: 'permission_denied',
      code: 1390009,
      message: 'no operation permission',
    });
    expect(shapeApprovalError({ code: 1390015, msg: 'task already approved' })).toEqual({
      type: 'already_processed',
      code: 1390015,
      message: 'task already approved',
    });
  });
});
