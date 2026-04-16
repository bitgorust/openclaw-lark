/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * feishu_approval_task_search tool -- query approval tasks.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import { Type } from '@sinclair/typebox';
import { imageSize } from 'image-size';
import {
  StringEnum,
  createToolContext,
  handleInvokeErrorWithAutoAuth,
  isInvokeError,
  json,
  normalizeRawInvokeError,
  registerTool,
} from '../helpers';
import { feishuFetch } from '../../../core/feishu-fetch';
import { validateLocalMediaRoots } from '../../../messaging/outbound/media-url-utils';
import { getApprovalAuthPolicy } from './auth-policy';
import { buildApprovalInstanceGetQuery, normalizeApprovalInstance, shapeApprovalError } from './instance';

const APPROVAL_USER_ID_TYPES = ['open_id', 'union_id', 'user_id'] as const;
const APPROVAL_TASK_QUERY_TOPICS = ['1', '2', '3', '17', '18'] as const;
const APPROVAL_TASK_SEARCH_STATUSES = [
  'PENDING',
  'REJECTED',
  'APPROVED',
  'TRANSFERRED',
  'DONE',
  'RM_REPEAT',
  'PROCESSED',
  'ALL',
] as const;
const APPROVAL_LOCALES = [
  'zh-CN',
  'en-US',
  'ja-JP',
  'zh-HK',
  'zh-TW',
  'de-DE',
  'es-ES',
  'fr-FR',
  'id-ID',
  'it-IT',
  'ko-KR',
  'pt-BR',
  'th-TH',
  'vi-VN',
  'ms-MY',
  'ru-RU',
] as const;
const APPROVAL_ATTACHMENT_STORAGE_DIR = path.join(os.tmpdir(), 'openclaw-lark', 'approval-attachments');
const APPROVAL_ATTACHMENT_ALLOWED_ROOTS = [APPROVAL_ATTACHMENT_STORAGE_DIR] as const;

const FeishuApprovalTaskSearchSchema = Type.Union([
  Type.Object({
    action: Type.Literal('query'),
    user_id: Type.Optional(
      Type.String({
        description: '待查询用户 ID。未传时默认使用当前消息发送者 open_id。',
      }),
    ),
    topic: StringEnum([...APPROVAL_TASK_QUERY_TOPICS], {
      description: '任务分组。1=待我审批，2=我发起的，3=抄送我的，17=我已审批，18=我已转交。',
    }),
    page_size: Type.Optional(
      Type.Integer({
        description: '分页大小。',
        minimum: 1,
      }),
    ),
    page_token: Type.Optional(
      Type.String({
        description: '分页标记。',
      }),
    ),
    user_id_type: Type.Optional(StringEnum([...APPROVAL_USER_ID_TYPES])),
  }),
  Type.Object({
    action: Type.Literal('search'),
    user_id: Type.Optional(
      Type.String({
        description: '待查询用户 ID。部分个人任务搜索场景建议传入；未传时可由服务端按其他条件搜索。',
      }),
    ),
    approval_code: Type.Optional(
      Type.String({
        description: '审批定义 Code。',
      }),
    ),
    instance_code: Type.Optional(
      Type.String({
        description: '审批实例 Code。',
      }),
    ),
    instance_external_id: Type.Optional(
      Type.String({
        description: '审批实例外部 ID。',
      }),
    ),
    group_external_id: Type.Optional(
      Type.String({
        description: '审批定义分组外部 ID。',
      }),
    ),
    task_title: Type.Optional(
      Type.String({
        description: '审批任务标题关键词。',
      }),
    ),
    task_status: Type.Optional(StringEnum([...APPROVAL_TASK_SEARCH_STATUSES])),
    task_start_time_from: Type.Optional(
      Type.String({
        description: '任务开始时间下界。支持 Unix 毫秒时间戳字符串。',
      }),
    ),
    task_start_time_to: Type.Optional(
      Type.String({
        description: '任务开始时间上界。支持 Unix 毫秒时间戳字符串。',
      }),
    ),
    locale: Type.Optional(StringEnum([...APPROVAL_LOCALES])),
    task_status_list: Type.Optional(
      Type.Array(Type.String(), {
        description: '任务状态列表。按官方接口透传。',
      }),
    ),
    order: Type.Optional(
      Type.Number({
        description: '排序方向。按官方接口透传。',
      }),
    ),
    with_revoked_instance: Type.Optional(
      Type.Boolean({
        description: '是否包含已撤回实例。',
      }),
    ),
    page_size: Type.Optional(
      Type.Integer({
        description: '分页大小。',
        minimum: 1,
      }),
    ),
    page_token: Type.Optional(
      Type.String({
        description: '分页标记。',
      }),
    ),
    user_id_type: Type.Optional(StringEnum([...APPROVAL_USER_ID_TYPES])),
  }),
  Type.Object({
    action: Type.Literal('get_detail'),
    task_id: Type.String({
      description: '审批任务 ID。',
    }),
    instance_id: Type.String({
      description: '审批实例 ID。建议直接使用 query/search 结果中的 instance_id。',
    }),
    locale: Type.Optional(StringEnum([...APPROVAL_LOCALES])),
    user_id: Type.Optional(
      Type.String({
        description: '发起审批用户 ID。未传时默认使用当前消息发送者 open_id（如果存在）。',
      }),
    ),
    user_id_type: Type.Optional(StringEnum([...APPROVAL_USER_ID_TYPES])),
  }),
  Type.Object({
    action: Type.Literal('download_attachment'),
    attachment_url: Type.String({
      description: '审批详情中 attachmentV2 字段返回的附件下载 URL。',
    }),
    output_path: Type.Optional(
      Type.String({
        description:
          '保存文件名提示。可选；实际总是保存到工具专用临时目录中，传入路径时仅使用其文件名部分。',
      }),
    ),
    file_name: Type.Optional(
      Type.String({
        description: '可选的文件名。未传时优先从审批字段 ext 或响应头中推断。',
      }),
    ),
  }),
  Type.Object({
    action: Type.Literal('parse_attachment'),
    attachment_url: Type.Optional(
      Type.String({
        description: '审批详情中 attachmentV2 字段返回的附件下载 URL。与 saved_path 二选一；若同时提供，优先使用 saved_path。',
      }),
    ),
    saved_path: Type.Optional(
      Type.String({
        description: '已下载到本地的附件路径。与 attachment_url 二选一。',
      }),
    ),
    output_path: Type.Optional(
      Type.String({
        description: '当使用 attachment_url 且需要先下载时，可选的文件名提示；实际总是保存到工具专用临时目录中。',
      }),
    ),
    file_name: Type.Optional(
      Type.String({
        description: '可选的文件名提示。未传时优先从响应头或本地路径推断。',
      }),
    ),
    parse_mode: Type.Optional(
      StringEnum(['auto', 'metadata', 'text'], {
        description: '解析模式。auto=自动选择；metadata=仅返回文件元数据；text=仅对文本类文件尝试抽取正文。',
      }),
    ),
  }),
]);

type ApprovalUserIdType = (typeof APPROVAL_USER_ID_TYPES)[number];
type ApprovalTaskQueryTopic = (typeof APPROVAL_TASK_QUERY_TOPICS)[number];
type ApprovalTaskSearchStatus = (typeof APPROVAL_TASK_SEARCH_STATUSES)[number];
type ApprovalLocale = (typeof APPROVAL_LOCALES)[number];

type FeishuApprovalTaskSearchParams =
  | {
      action: 'query';
      user_id?: string;
      topic: ApprovalTaskQueryTopic;
      page_size?: number;
      page_token?: string;
      user_id_type?: ApprovalUserIdType;
    }
  | {
      action: 'search';
      user_id?: string;
      approval_code?: string;
      instance_code?: string;
      instance_external_id?: string;
      group_external_id?: string;
      task_title?: string;
      task_status?: ApprovalTaskSearchStatus;
      task_start_time_from?: string;
      task_start_time_to?: string;
      locale?: ApprovalLocale;
      task_status_list?: string[];
      order?: number;
      with_revoked_instance?: boolean;
      page_size?: number;
      page_token?: string;
      user_id_type?: ApprovalUserIdType;
    }
  | {
      action: 'get_detail';
      task_id: string;
      instance_id: string;
      locale?: ApprovalLocale;
      user_id?: string;
      user_id_type?: ApprovalUserIdType;
    }
  | {
      action: 'download_attachment';
      attachment_url: string;
      output_path?: string;
      file_name?: string;
    }
  | {
      action: 'parse_attachment';
      attachment_url?: string;
      saved_path?: string;
      output_path?: string;
      file_name?: string;
      parse_mode?: 'auto' | 'metadata' | 'text';
    };

const APPROVAL_ATTACHMENT_HOSTS = new Set([
  'internal-api-drive-stream.feishu.cn',
  'internal-api-drive-stream.larksuite.com',
]);

interface ApprovalTaskQuerySummary {
  task_id: string | null;
  instance_id: string | null;
  title: string | null;
  topic: string | null;
  user_id: string | null;
  status: string | null;
  process_status: string | null;
  definition_code: string | null;
  process_id: string | null;
  process_external_id: string | null;
  task_external_id: string | null;
  initiators: string[];
  initiator_names: string[];
  urls: Record<string, string>;
  raw: Record<string, any>;
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeScalarString(value: unknown): string | null {
  if (typeof value === 'string') {
    return normalizeString(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
}

function normalizeUrls(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0),
  );
}

function normalizeApprovalTaskQueryItem(raw: Record<string, any>): ApprovalTaskQuerySummary {
  return {
    task_id: normalizeString(raw.task_id),
    instance_id:
      normalizeString(raw.instance_code ?? raw.instance_id ?? raw.process_code) ??
      normalizeScalarString(raw.process_id),
    title: normalizeString(raw.title),
    topic: normalizeScalarString(raw.topic),
    user_id: normalizeString(raw.user_id),
    status: normalizeScalarString(raw.status),
    process_status: normalizeScalarString(raw.process_status),
    definition_code: normalizeString(raw.definition_code),
    process_id: normalizeString(raw.process_id),
    process_external_id: normalizeString(raw.process_external_id),
    task_external_id: normalizeString(raw.task_external_id),
    initiators: Array.isArray(raw.initiators) ? raw.initiators.filter((item): item is string => typeof item === 'string') : [],
    initiator_names: Array.isArray(raw.initiator_names)
      ? raw.initiator_names.filter((item): item is string => typeof item === 'string')
      : [],
    urls: normalizeUrls(raw.urls),
    raw,
  };
}

export function buildApprovalTaskQueryRequest(
  params: Extract<FeishuApprovalTaskSearchParams, { action: 'query' }>,
  fallbackUserId?: string,
): Record<string, string> {
  const userId = params.user_id ?? fallbackUserId;
  if (!userId) {
    throw new Error('approval task query requires user_id, and no sender open_id is available in the current context');
  }

  const query: Record<string, string> = {
    user_id: userId,
    user_id_type: params.user_id_type ?? 'open_id',
  };
  if (params.topic) query.topic = params.topic;
  if (params.page_size !== undefined) query.page_size = String(params.page_size);
  if (params.page_token) query.page_token = params.page_token;
  return query;
}

export function buildApprovalTaskSearchRequest(params: Extract<FeishuApprovalTaskSearchParams, { action: 'search' }>): {
  query: Record<string, string>;
  body: Record<string, unknown>;
} {
  const query: Record<string, string> = {
    user_id_type: params.user_id_type ?? 'open_id',
  };
  if (params.page_size !== undefined) query.page_size = String(params.page_size);
  if (params.page_token) query.page_token = params.page_token;

  const body: Record<string, unknown> = {};
  if (params.user_id) body.user_id = params.user_id;
  if (params.approval_code) body.approval_code = params.approval_code;
  if (params.instance_code) body.instance_code = params.instance_code;
  if (params.instance_external_id) body.instance_external_id = params.instance_external_id;
  if (params.group_external_id) body.group_external_id = params.group_external_id;
  if (params.task_title) body.task_title = params.task_title;
  if (params.task_status) body.task_status = params.task_status;
  if (params.task_start_time_from) body.task_start_time_from = params.task_start_time_from;
  if (params.task_start_time_to) body.task_start_time_to = params.task_start_time_to;
  if (params.locale) body.locale = params.locale;
  if (params.task_status_list) body.task_status_list = params.task_status_list;
  if (params.order !== undefined) body.order = params.order;
  if (params.with_revoked_instance !== undefined) body.with_revoked_instance = params.with_revoked_instance;

  return {
    query,
    body,
  };
}

function assertApprovalAttachmentUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error('attachment_url must be a valid absolute URL');
  }

  if (url.protocol !== 'https:') {
    throw new Error('approval attachment download only supports https URLs');
  }

  if (!APPROVAL_ATTACHMENT_HOSTS.has(url.hostname)) {
    throw new Error(`unsupported approval attachment host: ${url.hostname}`);
  }

  return url;
}

function inferAttachmentFileName(resp: Response, fallback?: string): string {
  const contentDisposition = resp.headers.get('content-disposition');
  const filenameStarMatch = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i);
  if (filenameStarMatch) {
    const decoded = decodeURIComponent(filenameStarMatch[1]);
    if (decoded.trim()) return decoded.trim();
  }

  const filenameMatch = contentDisposition?.match(/filename="?([^";]+)"?/i);
  if (filenameMatch?.[1]?.trim()) {
    return filenameMatch[1].trim();
  }

  const trimmedFallback = fallback?.trim();
  if (trimmedFallback) return trimmedFallback;

  return `approval-attachment-${Date.now()}`;
}

function sanitizeAttachmentFileName(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed) {
    return `approval-attachment-${Date.now()}`;
  }

  const normalized = trimmed.replace(/\\/g, '/');
  const baseName = path.posix.basename(normalized).trim();
  if (!baseName || baseName === '.' || baseName === '..') {
    return `approval-attachment-${Date.now()}`;
  }

  return baseName;
}

function resolveApprovalAttachmentSavedPath(fileName: string, outputPath?: string): string {
  const preferredName = outputPath ? sanitizeAttachmentFileName(outputPath) : fileName;
  return path.join(APPROVAL_ATTACHMENT_STORAGE_DIR, preferredName);
}

function assertApprovalAttachmentSavedPath(savedPath: string): string {
  const resolvedPath = path.resolve(savedPath);
  validateLocalMediaRoots(resolvedPath, APPROVAL_ATTACHMENT_ALLOWED_ROOTS);
  return resolvedPath;
}

async function downloadApprovalAttachment(params: Extract<FeishuApprovalTaskSearchParams, { action: 'download_attachment' }>) {
  const url = assertApprovalAttachmentUrl(params.attachment_url);
  const resp = await feishuFetch(url.toString(), { method: 'GET' });

  if (!resp.ok) {
    throw new Error(`approval attachment download failed: HTTP ${resp.status} ${resp.statusText}`);
  }

  const fileName = sanitizeAttachmentFileName(inferAttachmentFileName(resp, params.file_name));
  const finalPath = resolveApprovalAttachmentSavedPath(fileName, params.output_path);
  const buffer = Buffer.from(await resp.arrayBuffer());

  await fs.mkdir(path.dirname(finalPath), { recursive: true });
  await fs.writeFile(finalPath, buffer);

  return {
    action: 'download_attachment' as const,
    source_url: url.toString(),
    file_name: path.basename(finalPath),
    saved_path: finalPath,
    size_bytes: buffer.length,
    content_type: resp.headers.get('content-type'),
  };
}

function isTextLikeContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const mime = contentType.split(';')[0].trim().toLowerCase();
  return (
    mime.startsWith('text/') ||
    mime === 'application/json' ||
    mime === 'application/xml' ||
    mime === 'text/xml' ||
    mime === 'application/javascript' ||
    mime === 'application/x-javascript' ||
    mime === 'text/csv'
  );
}

function inferContentTypeFromPath(savedPath: string): string | null {
  const ext = path.extname(savedPath).toLowerCase();
  switch (ext) {
    case '.txt':
    case '.md':
    case '.csv':
    case '.log':
      return 'text/plain';
    case '.json':
      return 'application/json';
    case '.xml':
      return 'application/xml';
    case '.html':
    case '.htm':
      return 'text/html';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.pdf':
      return 'application/pdf';
    case '.doc':
      return 'application/msword';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.xls':
      return 'application/vnd.ms-excel';
    case '.xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case '.ppt':
      return 'application/vnd.ms-powerpoint';
    case '.pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    default:
      return null;
  }
}

async function parseLocalApprovalAttachment(params: {
  savedPath: string;
  fileName?: string;
  contentType?: string | null;
  parseMode?: 'auto' | 'metadata' | 'text';
}) {
  const savedPath = assertApprovalAttachmentSavedPath(params.savedPath);
  const fileName = params.fileName?.trim() || path.basename(savedPath);
  const stat = await fs.stat(savedPath);
  const contentType = params.contentType ?? inferContentTypeFromPath(savedPath);
  const parseMode = params.parseMode ?? 'auto';

  const result: Record<string, unknown> = {
    action: 'parse_attachment',
    file_name: fileName,
    saved_path: savedPath,
    size_bytes: stat.size,
    content_type: contentType,
    parse_mode: parseMode,
    parsed: false,
  };

  if (contentType?.startsWith('image/')) {
    try {
      const buffer = await fs.readFile(savedPath);
      const dimensions = imageSize(buffer);
      result.image = {
        width: dimensions.width ?? null,
        height: dimensions.height ?? null,
      };
    } catch {
      result.image = null;
    }

    result.note =
      'image attachment downloaded successfully; local parser currently returns metadata only and does not run OCR';
    return result;
  }

  if (parseMode !== 'metadata' && isTextLikeContentType(contentType)) {
    const text = await fs.readFile(savedPath, 'utf8');
    result.parsed = true;
    result.text = text;
    result.preview = text.length > 2000 ? `${text.slice(0, 2000)}...` : text;
    return result;
  }

  if (
    contentType === 'application/pdf' ||
    contentType === 'application/msword' ||
    contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    contentType === 'application/vnd.ms-excel' ||
    contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    contentType === 'application/vnd.ms-powerpoint' ||
    contentType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) {
    result.note =
      'attachment downloaded successfully; local parser does not yet extract正文 from pdf/office files in this repo';
    return result;
  }

  result.note = 'attachment downloaded successfully; no local parser is configured for this file type';
  return result;
}

export function registerFeishuApprovalTaskSearchTool(api: OpenClawPluginApi): void {
  if (!api.config) return;
  const cfg = api.config;

  const { toolClient, log } = createToolContext(api, 'feishu_approval_task_search');

  registerTool(
    api,
    {
      name: 'feishu_approval_task_search',
      label: 'Feishu Approval Task Search',
      description:
        '飞书审批任务查询工具。Actions: query（按当前用户和 topic 查询个人任务列表）, search（按官方 tasks/search 条件查询任务列表）, get_detail（基于 task_id + instance_id 读取任务详情；内部通过实例详情定位该任务）, download_attachment（下载审批详情 attachmentV2 字段中的附件 URL 到本地）, parse_attachment（按需下载并解析附件；文本类提取正文，图片返回元数据，PDF/Office 当前仅返回说明）。',
      parameters: FeishuApprovalTaskSearchSchema,
      async execute(_toolCallId: string, params: unknown) {
        const p = params as FeishuApprovalTaskSearchParams;
        let lastClient: ReturnType<typeof toolClient> | undefined;
        try {
          const client = (lastClient = toolClient());

          switch (p.action) {
            case 'query': {
              const query = buildApprovalTaskQueryRequest(p, client.senderOpenId);
              log.info(`query: topic=${p.topic ?? 'default'}, page_size=${query.page_size ?? 'default'}`);

              const res = await client.invokeByPath<{
                code?: number;
                msg?: string;
                data?: {
                  tasks?: Record<string, any>[];
                  has_more?: boolean;
                  page_token?: string;
                };
              }>('feishu_approval_task_search.query', '/open-apis/approval/v4/tasks/query', {
                method: 'GET',
                query,
              });

              if (res.code && res.code !== 0) {
                throw res;
              }

              const tasks = Array.isArray(res.data?.tasks)
                ? res.data.tasks.map((item) => normalizeApprovalTaskQueryItem(item))
                : [];

              return json({
                action: 'query',
                tasks,
                has_more: res.data?.has_more ?? false,
                page_token: res.data?.page_token ?? null,
                raw: res.data ?? null,
              });
            }

            case 'search': {
              const authPolicy = getApprovalAuthPolicy('task-search', 'search');
              const request = buildApprovalTaskSearchRequest(p);
              log.info(`search: page_size=${request.query.page_size ?? 'default'}`);

              const res = await client.invokeByPath<{
                code?: number;
                msg?: string;
                data?: {
                  tasks?: Record<string, any>[];
                  has_more?: boolean;
                  page_token?: string;
                  count?: number;
                };
              }>('feishu_approval_task_search.search', '/open-apis/approval/v4/tasks/search', {
                method: 'POST',
                query: request.query,
                body: request.body,
                as: authPolicy.currentExecutionMode,
              });

              if (res.code && res.code !== 0) {
                throw res;
              }

              const tasks = Array.isArray(res.data?.tasks)
                ? res.data.tasks.map((item) => normalizeApprovalTaskQueryItem(item))
                : [];

              return json({
                action: 'search',
                tasks,
                count: res.data?.count ?? tasks.length,
                has_more: res.data?.has_more ?? false,
                page_token: res.data?.page_token ?? null,
                raw: res.data ?? null,
              });
            }

            case 'get_detail': {
              const authPolicy = getApprovalAuthPolicy('task-search', 'get_detail');
              const query = buildApprovalInstanceGetQuery({
                locale: p.locale,
                user_id: p.user_id ?? client.senderOpenId,
                user_id_type: p.user_id_type ?? 'open_id',
              });

              log.info(`get_detail: instance_id=${p.instance_id}, task_id=${p.task_id}`);

              const res = await client.invokeByPath<{
                code?: number;
                msg?: string;
                data?: Record<string, any>;
              }>(
                'feishu_approval_task_search.get_detail',
                `/open-apis/approval/v4/instances/${encodeURIComponent(p.instance_id)}`,
                {
                  method: 'GET',
                  query,
                  as: authPolicy.currentExecutionMode,
                },
              );

              if (res.code && res.code !== 0) {
                throw res;
              }

              const instance = normalizeApprovalInstance(res.data);
              const task = instance?.tasks.find((item) => item.task_id === p.task_id) ?? null;

              return json({
                action: 'get_detail',
                task_id: p.task_id,
                instance_id: p.instance_id,
                found: task != null,
                task,
                instance,
              });
            }

            case 'download_attachment': {
              log.info(`download_attachment: host=${new URL(p.attachment_url).hostname}`);
              return json(await downloadApprovalAttachment(p));
            }

            case 'parse_attachment': {
              let savedPath = p.saved_path;
              let fileName = p.file_name;
              let contentType: string | null | undefined;

              if (!savedPath) {
                if (!p.attachment_url) {
                  throw new Error('parse_attachment requires either saved_path or attachment_url');
                }

                log.info(`parse_attachment: downloading from host=${new URL(p.attachment_url).hostname}`);
                const downloaded = await downloadApprovalAttachment({
                  action: 'download_attachment',
                  attachment_url: p.attachment_url,
                  output_path: p.output_path,
                  file_name: p.file_name,
                });
                savedPath = downloaded.saved_path;
                fileName = downloaded.file_name;
                contentType = downloaded.content_type;
              }

              return json(
                await parseLocalApprovalAttachment({
                  savedPath,
                  fileName,
                  contentType,
                  parseMode: p.parse_mode,
                }),
              );
            }
          }
        } catch (err) {
          const toolAction =
            p.action === 'query' || p.action === 'search' || p.action === 'get_detail'
              ? (`feishu_approval_task_search.${p.action}` as const)
              : null;

          const invokeErr = toolAction
            ? normalizeRawInvokeError({
                toolAction,
                err,
                userOpenId: lastClient?.senderOpenId,
                appId: lastClient?.account.appId,
              })
            : err;

          if (isInvokeError(invokeErr)) {
            return await handleInvokeErrorWithAutoAuth(invokeErr, cfg);
          }

          return json({
            error: shapeApprovalError(err),
          });
        }
      },
    },
    { name: 'feishu_approval_task_search' },
  );
}
