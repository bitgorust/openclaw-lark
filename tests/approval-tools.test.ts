import { describe, expect, it } from 'vitest';
import {
  buildApprovalInstanceGetQuery,
  buildApprovalInstanceListQuery,
  shapeApprovalError,
} from '../src/tools/oapi/approval/instance';
import { getApprovalAuthPolicy } from '../src/tools/oapi/approval/auth-policy';
import {
  buildApprovalCcSearchRequest,
  normalizeApprovalCcItem,
} from '../src/tools/oapi/approval/cc-search';
import { normalizeApprovalComment } from '../src/tools/oapi/approval/comment';
import {
  normalizeApprovalInstance,
} from '../src/tools/oapi/approval/instance';
import { buildApprovalRollbackRequest, buildApprovalTaskRequest } from '../src/tools/oapi/approval/task';
import { buildApprovalTaskQueryRequest } from '../src/tools/oapi/approval/task-search';

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

  it('builds add_sign requests with extra signers', () => {
    expect(
      buildApprovalTaskRequest(
        {
          action: 'add_sign',
          approval_code: 'approval_456',
          instance_id: 'inst_123',
          task_id: 'task_1',
          add_sign_user_ids: ['ou_target_1', 'ou_target_2'],
          add_sign_type: 1,
          approval_method: 2,
          user_id: 'ou_sender',
          comment: '请共同审批',
        },
        'ou_fallback',
      ),
    ).toEqual({
      body: {
        approval_code: 'approval_456',
        instance_code: 'inst_123',
        task_id: 'task_1',
        user_id: 'ou_sender',
        comment: '请共同审批',
        add_sign_user_ids: ['ou_target_1', 'ou_target_2'],
        add_sign_type: 1,
        approval_method: 2,
      },
      query: undefined,
      path: '/open-apis/approval/v4/instances/add_sign',
    });
  });

  it('builds resubmit requests with form payload', () => {
    expect(
      buildApprovalTaskRequest(
        {
          action: 'resubmit',
          approval_code: 'approval_456',
          instance_id: 'inst_123',
          task_id: 'task_1',
          form: '{"field":"value"}',
          user_id: 'ou_sender',
          comment: '重新提交',
        },
        'ou_fallback',
      ),
    ).toEqual({
      body: {
        approval_code: 'approval_456',
        instance_code: 'inst_123',
        task_id: 'task_1',
        user_id: 'ou_sender',
        comment: '重新提交',
        form: '{"field":"value"}',
      },
      query: {
        user_id_type: 'open_id',
      },
      path: '/open-apis/approval/v4/tasks/resubmit',
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
    expect(shapeApprovalError({ msg: 'Missing access token for authorization' })).toEqual({
      type: 'personal_access_token_required',
      code: undefined,
      message:
        '当前审批接口以应用身份调用，缺少你的个人 access token，因此无法访问“待我审批”等个人审批数据。这不是你的个人权限问题，而是当前工具链的鉴权限制。',
      hint: '可以继续处理你明确指定的审批实例，例如审批实例 ID、审批链接，或一条具体审批通知消息；暂时不能主动列出你全部“待我审批”的审批单。',
    });
  });
});

describe('approval auth policy', () => {
  it('tracks target auth mode separately from current execution mode', () => {
    expect(getApprovalAuthPolicy('instance', 'list')).toEqual({
      targetAuthMode: 'dual-mode',
      currentExecutionMode: 'user',
      rationale: 'Instance queries should prefer user identity for personal-context reads, while retaining tenant-mode fallback for bounded scoped lookups.',
    });
    expect(getApprovalAuthPolicy('task', 'approve')).toEqual({
      targetAuthMode: 'user-required',
      currentExecutionMode: 'user',
      rationale: 'Task actions carry acting-user semantics in conversational approval flows and should default to user identity.',
    });
    expect(getApprovalAuthPolicy('task', 'add_sign')).toEqual({
      targetAuthMode: 'user-required',
      currentExecutionMode: 'user',
      rationale: 'Task actions carry acting-user semantics in conversational approval flows and should default to user identity.',
    });
    expect(getApprovalAuthPolicy('task-search', 'query')).toEqual({
      targetAuthMode: 'user-required',
      currentExecutionMode: 'user',
      rationale: 'User task query is explicitly user-oriented and should run with user identity.',
    });
    expect(getApprovalAuthPolicy('cc', 'search')).toEqual({
      targetAuthMode: 'user-required',
      currentExecutionMode: 'user',
      rationale: 'CC search is a personal inbox-style query and should run with user identity.',
    });
    expect(getApprovalAuthPolicy('comment', 'list')).toEqual({
      targetAuthMode: 'dual-mode',
      currentExecutionMode: 'user',
      rationale: 'Comment list requests should prefer user identity and can fall back to tenant mode for explicit instance reads.',
    });
  });
});

describe('approval task search helpers', () => {
  it('builds user task query with sender fallback', () => {
    expect(
      buildApprovalTaskQueryRequest(
        {
          action: 'query',
          topic: '1',
          page_size: 20,
        },
        'ou_sender',
      ),
    ).toEqual({
      user_id: 'ou_sender',
      user_id_type: 'open_id',
      topic: '1',
      page_size: '20',
    });
  });
});

describe('approval cc helpers', () => {
  it('builds cc search requests with sender fallback', () => {
    expect(
      buildApprovalCcSearchRequest(
        {
          action: 'search',
          read_status: 'UNREAD',
          page_size: 20,
          locale: 'zh-CN',
        },
        'ou_sender',
      ),
    ).toEqual({
      query: {
        user_id_type: 'open_id',
        page_size: '20',
      },
      body: {
        user_id: 'ou_sender',
        read_status: 'UNREAD',
        locale: 'zh-CN',
      },
    });
  });

  it('normalizes cc results for agent consumption', () => {
    expect(
      normalizeApprovalCcItem({
        approval: {
          code: 'approval_1',
          name: '请假',
          approval_id: 'approval-id-1',
          icon: 'https://example.com/icon.png',
          is_external: false,
          external: {
            batch_cc_read: true,
          },
        },
        group: {
          external_id: 'group_1',
          name: '人事',
        },
        instance: {
          code: 'inst_1',
          external_id: 'inst-ext-1',
          user_id: 'ou_applicant',
          start_time: '1775005200000',
          end_time: '1775125800000',
          status: 'pending',
          title: '请假审批',
          extra: 'instance-extra',
          serial_id: 'serial-1',
          link: {
            pc_link: 'https://example.com/pc',
            mobile_link: 'https://example.com/mobile',
          },
        },
        cc: {
          user_id: 'ou_sender',
          create_time: '1775008800000',
          read_status: 'unread',
          title: '抄送标题',
          extra: 'cc-extra',
          link: {
            pc_link: 'https://example.com/cc-pc',
          },
        },
      }),
    ).toEqual({
      approval: {
        code: 'approval_1',
        name: '请假',
        approval_id: 'approval-id-1',
        icon: 'https://example.com/icon.png',
        is_external: false,
        batch_cc_read: true,
      },
      group: {
        external_id: 'group_1',
        name: '人事',
      },
      instance: {
        code: 'inst_1',
        external_id: 'inst-ext-1',
        user_id: 'ou_applicant',
        start_time: '2026-04-01T09:00:00+08:00',
        end_time: '2026-04-02T18:30:00+08:00',
        status: 'pending',
        title: '请假审批',
        extra: 'instance-extra',
        serial_id: 'serial-1',
        links: {
          pc_link: 'https://example.com/pc',
          mobile_link: 'https://example.com/mobile',
        },
      },
      cc: {
        user_id: 'ou_sender',
        create_time: '2026-04-01T10:00:00+08:00',
        read_status: 'unread',
        title: '抄送标题',
        extra: 'cc-extra',
        links: {
          pc_link: 'https://example.com/cc-pc',
        },
      },
      raw: expect.any(Object),
    });
  });
});

describe('approval comment helpers', () => {
  it('normalizes approval comments with replies', () => {
    expect(
      normalizeApprovalComment({
        id: 'comment_1',
        content: '请补充附件',
        create_time: '1775005200000',
        update_time: '1775008800000',
        is_delete: 0,
        commentator: 'ou_manager',
        extra: 'comment-extra',
        at_info_list: [{ user_id: 'ou_sender', name: 'Alice', offset: '0' }],
        replies: [
          {
            id: 'reply_1',
            content: '已补充',
            create_time: '1775012400000',
            update_time: '1775012400000',
            is_delete: 0,
            commentator: 'ou_sender',
          },
        ],
      }),
    ).toEqual({
      id: 'comment_1',
      content: '请补充附件',
      create_time: '2026-04-01T09:00:00+08:00',
      update_time: '2026-04-01T10:00:00+08:00',
      is_deleted: false,
      commentator: 'ou_manager',
      extra: 'comment-extra',
      at_info_list: [{ user_id: 'ou_sender', name: 'Alice', offset: '0' }],
      replies: [
        {
          id: 'reply_1',
          content: '已补充',
          create_time: '2026-04-01T11:00:00+08:00',
          update_time: '2026-04-01T11:00:00+08:00',
          is_deleted: false,
          commentator: 'ou_sender',
          extra: null,
          at_info_list: [],
          replies: [],
          raw: expect.any(Object),
        },
      ],
      raw: expect.any(Object),
    });
  });
});
