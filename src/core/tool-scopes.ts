/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * Tool scopes runtime snapshot.
 *
 * ToolActionKey and generated scope data come from the Feishu metadata
 * generation pipeline. Manual data here is reserved for explicit runtime
 * fallbacks only.
 */

import type { GeneratedToolActionKey } from './generated/feishu-tool-action-keys.js';
import { GENERATED_TOOL_SCOPES } from './generated/feishu-tool-scopes.js';

// ===== 类型定义 =====

export type ToolActionKey = GeneratedToolActionKey;
/**
 * Tool Scope 映射类型
 *
 * 将每个 ToolActionKey 映射到其所需的 scope 数组
 */
export type ToolScopeMapping = Record<ToolActionKey, string[]>;

// ===== 数据 =====

/**
 * Tool Scope 数据
 *
 * 每个工具动作所需的飞书权限列表（Required Scopes）。
 * 当前运行时快照完全来自生成产物；手工 fallback 只允许通过
 * `scope-manager` 里的显式 exception 机制临时放行。
 *
 * ## 数据说明
 *
 * - 空数组 `[]` 表示该工具动作不需要任何权限
 * - 多个权限表示需要同时拥有所有权限（AND 关系）
 * - 所有 scope 都是 user scopes（用户级权限）
 *
 * ## 示例
 *
 * ```typescript
 * TOOL_SCOPES["feishu_calendar_event.create"]
 * // 返回: ["calendar:calendar.event:create", "calendar:calendar.event:update"]
 * ```
 *
 * @see {@link ToolActionKey} 所有可用的工具动作键
 */
export const TOOL_SCOPES: ToolScopeMapping = {
  ...(GENERATED_TOOL_SCOPES as unknown as Partial<ToolScopeMapping>),
} as ToolScopeMapping;

// ===== 必需的应用身份权限 =====

/**
 * 飞书插件运行必须开通的应用身份权限清单
 *
 * 这些权限是插件基础功能（消息接收、卡片交互、基本信息查询等）所必需的，
 * 如果缺失这些权限，插件将无法正常工作。
 *
 * 权限分类：
 * - im:message.* - 消息接收和发送
 * - im:chat.* - 群聊管理
 * - im:resource - 消息资源（图片、文件等）
 * - cardkit:card.* - 卡片交互
 * - application:application:self_manage - 应用自身权限查询（权限检查基础）
 * - contact:contact.base:readonly - 通讯录基础信息
 * - docx:document:readonly - 文档基础只读（文档链接预览等）
 *
 * 最后更新: 2026-03-03
 */
export const REQUIRED_APP_SCOPES = [
  'contact:contact.base:readonly',
  'docx:document:readonly',
  'im:chat:read',
  'im:chat:update',
  'im:message.group_at_msg:readonly',
  'im:message.p2p_msg:readonly',
  'im:message.pins:read',
  'im:message.pins:write_only',
  'im:message.reactions:read',
  'im:message.reactions:write_only',
  'im:message:readonly',
  'im:message:recall',
  'im:message:send_as_bot',
  'im:message:send_multi_users',
  'im:message:send_sys_msg',
  'im:message:update',
  'im:resource',
  'application:application:self_manage',
  'cardkit:card:write',
  'cardkit:card:read',
] as const;

/**
 * 必需应用权限类型
 */
export type RequiredAppScope = (typeof REQUIRED_APP_SCOPES)[number];

/**
 * 必需权限用途说明
 *
 * 描述每个必需权限的具体用途，帮助管理员理解为什么需要开通该权限。
 */
export const REQUIRED_SCOPE_DESCRIPTIONS: Record<RequiredAppScope, string> = {
  'contact:contact.base:readonly': '获取用户基本信息（姓名、头像）',
  'docx:document:readonly': '读取文档内容、预览文档链接',
  'im:chat:read': '读取群聊信息、获取群成员列表',
  'im:chat:update': '修改群聊设置（群名称、群公告等）',
  'im:message.group_at_msg:readonly': '接收群聊中 @ 机器人的消息',
  'im:message.p2p_msg:readonly': '接收私聊消息',
  'im:message.pins:read': '读取消息置顶状态',
  'im:message.pins:write_only': '置顶/取消置顶消息',
  'im:message.reactions:read': '读取消息表情回复',
  'im:message.reactions:write_only': '添加/删除消息表情回复',
  'im:message:readonly': '读取消息内容、历史消息',
  'im:message:recall': '↩撤回机器人发送的消息',
  'im:message:send_as_bot': '以机器人身份发送消息',
  'im:message:send_multi_users': '批量发送私聊消息',
  'im:message:send_sys_msg': '发送系统通知消息',
  'im:message:update': '更新/编辑已发送的消息',
  'im:resource': '上传/下载消息资源（图片、文件等）',
  'application:application:self_manage': '查询应用自身权限状态（诊断基础）',
  'cardkit:card:write': '创建和更新消息卡片',
  'cardkit:card:read': '读取消息卡片状态',
};

// ===== 高敏感权限 =====

/**
 * 高敏感权限清单
 *
 * 这些权限具有较高的敏感度，不应在批量授权时自动申请。
 * 用户需要明确知晓这些权限的影响后，才能手动授权。
 *
 * 权限说明：
 * - im:message.send_as_user - 以用户身份发送消息（高风险，可能被滥用发送钓鱼或垃圾消息）
 * - space:document:delete - 删除云文档
 * - calendar:calendar.event:delete - 删除日程
 * - base:table:delete - 删除多维表格数据表
 *
 * 使用场景：
 * - 批量授权时会自动过滤掉这些权限
 * - 需要这些权限的功能会单独提示用户授权
 *
 * 最后更新: 2026-03-17
 */
export const SENSITIVE_SCOPES = [
  'im:message.send_as_user',
  'space:document:delete',
  'calendar:calendar.event:delete',
  'base:table:delete',
] as const;

/**
 * 高敏感权限类型
 */
export type SensitiveScope = (typeof SENSITIVE_SCOPES)[number];

/**
 * 过滤掉高敏感权限
 *
 * 用于批量授权时排除高敏感权限，这些权限需要用户明确授权。
 *
 * @param scopes - 原始权限列表
 * @returns 过滤后的权限列表（不包含高敏感权限）
 *
 * @example
 * ```typescript
 * const allScopes = ["im:message", "im:message.send_as_user", "calendar:calendar:read"];
 * const safeScopes = filterSensitiveScopes(allScopes);
 * // 返回: ["im:message", "calendar:calendar:read"]
 * ```
 */
export function filterSensitiveScopes(scopes: string[]): string[] {
  const sensitiveSet = new Set<string>(SENSITIVE_SCOPES);
  return scopes.filter((scope) => !sensitiveSet.has(scope));
}

// ===== 统计信息 =====

/**
 * 工具动作总数: 96
 * 唯一 scope 总数: 74
 * 必需应用权限总数: 20
 * 高敏感权限总数: 4
 */
