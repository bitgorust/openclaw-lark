import { describe, expect, it } from 'vitest';
import {
  buildApprovalInstanceGetQuery,
  buildApprovalInstanceListQuery,
  normalizeApprovalInstance,
  shapeApprovalError,
} from '../src/tools/oapi/approval/instance';
import { getApprovalAuthPolicy } from '../src/tools/oapi/approval/auth-policy';
import {
  buildApprovalCcSearchRequest,
  normalizeApprovalCcItem,
} from '../src/tools/oapi/approval/cc-search';
import { normalizeApprovalComment } from '../src/tools/oapi/approval/comment';
import {
  buildApprovalRollbackRequest, buildApprovalTaskRequest } from '../src/tools/oapi/approval/task';
import { buildApprovalTaskQueryRequest } from '../src/tools/oapi/approval/task-search';
import { checkAppScopes, getRequiredScopeSpec, getRequiredScopes } from '../src/core/scope-manager';
import { GENERATED_TOOL_SCOPE_SPECS } from '../src/core/generated/feishu-tool-scope-specs.js';

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
        locale: 'ru-RU',
        user_id: 'ou_applicant',
        user_id_type: 'open_id',
      }),
    ).toEqual({
      locale: 'ru-RU',
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
      form: JSON.stringify([
        {
          id: 'widget_reason',
          name: '加班事由',
          type: 'textarea',
          value: '线上故障处理',
        },
        {
          id: 'widget_hours',
          name: '加班时长',
          type: 'number',
          value: '3',
        },
      ]),
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
      form: {
        fields: [
          {
            id: 'widget_reason',
            name: '加班事由',
            type: 'textarea',
            value: '线上故障处理',
            text: '线上故障处理',
            raw: expect.any(Object),
          },
          {
            id: 'widget_hours',
            name: '加班时长',
            type: 'number',
            value: '3',
            text: '3',
            raw: expect.any(Object),
          },
        ],
        text: '加班事由: 线上故障处理\n加班时长: 3',
      },
      raw: expect.any(Object),
    });
  });

  it('normalizes approval task ids from task_list.id and extracts attachment field hints', () => {
    const normalized = normalizeApprovalInstance({
      instance_code: 'inst_attach_1',
      approval_code: 'approval_attach_1',
      approval_name: '加班',
      status: 'PENDING',
      form: JSON.stringify([
        {
          id: 'widget_attachment',
          name: '凭证',
          type: 'attachmentV2',
          ext: 'IMG_2598.jpeg',
          value: [
            'https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=abc',
          ],
        },
      ]),
      task_list: [
        {
          id: 'task_attach_1',
          node_id: 'NODE_1',
          node_name: '审批',
          status: 'PENDING',
          open_id: 'ou_approver',
          user_id: 'u_approver',
        },
      ],
    });

    expect(normalized).toMatchObject({
      tasks: [
        {
          task_id: 'task_attach_1',
          node_id: 'NODE_1',
        },
      ],
      approvers: [
        {
          task_id: 'task_attach_1',
        },
      ],
      form: {
        fields: [
          {
            id: 'widget_attachment',
            name: '凭证',
            type: 'attachmentV2',
            attachment_urls: ['https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=abc'],
            file_name: 'IMG_2598.jpeg',
          },
        ],
      },
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
      targetAuthMode: 'app-only',
      currentExecutionMode: 'tenant',
      allowTenantFallback: false,
      rationale: 'canonical contract is tenant-only',
    });
    expect(getApprovalAuthPolicy('task', 'approve')).toEqual({
      targetAuthMode: 'app-only',
      currentExecutionMode: 'tenant',
      allowTenantFallback: false,
      rationale: 'canonical contract is tenant-only',
    });
    expect(getApprovalAuthPolicy('task', 'add_sign')).toEqual({
      targetAuthMode: 'app-only',
      currentExecutionMode: 'tenant',
      allowTenantFallback: false,
      rationale: 'canonical contract is tenant-only',
    });
    expect(getApprovalAuthPolicy('task-search', 'query')).toEqual({
      targetAuthMode: 'dual-mode',
      currentExecutionMode: 'user',
      allowTenantFallback: true,
      rationale:
        'canonical contract is dual-mode; prefer user context and fall back to tenant when user auth is unavailable',
    });
    expect(getApprovalAuthPolicy('task-search', 'search')).toEqual({
      targetAuthMode: 'app-only',
      currentExecutionMode: 'tenant',
      allowTenantFallback: false,
      rationale: 'canonical contract is tenant-only',
    });
    expect(getApprovalAuthPolicy('task-search', 'get_detail')).toEqual({
      targetAuthMode: 'app-only',
      currentExecutionMode: 'tenant',
      allowTenantFallback: false,
      rationale: 'canonical contract is tenant-only',
    });
    expect(getApprovalAuthPolicy('cc', 'search')).toEqual({
      targetAuthMode: 'app-only',
      currentExecutionMode: 'tenant',
      allowTenantFallback: false,
      rationale: 'canonical contract is tenant-only',
    });
    expect(getApprovalAuthPolicy('comment', 'list')).toEqual({
      targetAuthMode: 'app-only',
      currentExecutionMode: 'tenant',
      allowTenantFallback: false,
      rationale: 'canonical contract is tenant-only',
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

  it('uses the real app-configurable scope set for personal task query', () => {
    expect(getRequiredScopes('feishu_approval_task_search.query')).toEqual(['approval:approval:readonly']);
  });

  it('uses official required scopes for approval task search', () => {
    expect(getRequiredScopes('feishu_approval_task_search.search')).toEqual([
      'approval:approval.list:readonly',
      'approval:approval:readonly',
    ]);
  });

  it('uses official required scopes for approval task detail lookup', () => {
    expect(getRequiredScopes('feishu_approval_task_search.get_detail')).toEqual([
      'approval:approval',
      'approval:approval:readonly',
      'approval:instance',
    ]);
  });

  it('treats approval task search official scopes as any-of for app checks', () => {
    expect(checkAppScopes('feishu_approval_task_search.search', ['approval:approval:readonly'])).toBe(true);
    expect(checkAppScopes('feishu_approval_task_search.search', ['approval:approval.list:readonly'])).toBe(true);
    expect(checkAppScopes('feishu_approval_task_search.search', ['approval:approval'])).toBe(false);
  });

  it('uses official required scopes for approval comment create', () => {
    expect(getRequiredScopes('feishu_approval_comment.create')).toEqual([
      'approval:approval',
      'approval:instance.comment',
    ]);
  });

  it('reads generated official scope metadata instead of legacy manual fallback', () => {
    expect(getRequiredScopeSpec('feishu_approval_comment.create')).toMatchObject({
      source: 'official',
      scopeNeedType: 'one',
    });
  });

  it('fails fast when an action loses its generated official scope metadata', () => {
    const toolAction = 'feishu_approval_task.approve';
    const previous = GENERATED_TOOL_SCOPE_SPECS[toolAction];

    delete GENERATED_TOOL_SCOPE_SPECS[toolAction];
    try {
      expect(() => getRequiredScopeSpec(toolAction)).toThrow(
        /Manual scope fallback is not allowed for feishu_approval_task\.approve/,
      );
    } finally {
      GENERATED_TOOL_SCOPE_SPECS[toolAction] = previous;
    }
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
