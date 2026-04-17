/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * OAPI Tools Index
 *
 * This module registers all tools that directly use Feishu Open API (OAPI).
 * These tools are placed here to distinguish them from MCP-based tools.
 */

import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import { registerFeishuImTools as registerFeishuImBotTools } from '../tat/im/index';
import {
  registerFeishuCalendarCalendarTool,
  registerFeishuCalendarEventAttendeeTool,
  registerFeishuCalendarEventTool,
  registerFeishuCalendarFreebusyTool,
} from './calendar/index';
import { registerFeishuAttendanceGroupTool, registerFeishuAttendanceShiftTool } from './attendance/index';
import {
  registerFeishuTaskCommentTool,
  registerFeishuTaskSectionTool,
  registerFeishuTaskSubtaskTool,
  registerFeishuTaskTaskTool,
  registerFeishuTaskTasklistTool,
} from './task/index';
import {
  registerFeishuApprovalCcTool,
  registerFeishuApprovalCommentTool,
  registerFeishuApprovalInstanceTool,
  registerFeishuApprovalTaskSearchTool,
  registerFeishuApprovalTaskTool,
} from './approval/index';
import {
  registerFeishuBitableAppTableFieldTool,
  registerFeishuBitableAppTableRecordTool,
  registerFeishuBitableAppTableTool,
  registerFeishuBitableAppTableViewTool,
  registerFeishuBitableAppTool,
} from './bitable/index';
import { registerGetUserTool, registerSearchUserTool } from './common/index';
import { registerFeishuMailMessageTool } from './mail/index';
import {
  registerFeishuMeetingReserveTool,
  registerFeishuMeetingTool,
  registerFeishuMinutesTool,
} from './meeting/index';
import { registerFeishuSearchTools } from './search/index';
import { registerFeishuDriveTools } from './drive/index';
import { registerFeishuWikiTools } from './wiki/index';

import { registerFeishuSheetsTools } from './sheets/index';
// import { registerFeishuOkrTools } from "./okr/index";
import { registerFeishuChatTools } from './chat/index';
import { registerFeishuImTools as registerFeishuImUserTools } from './im/index';

export function registerOapiTools(api: OpenClawPluginApi): void {
  // Common tools
  registerGetUserTool(api);
  registerSearchUserTool(api);

  // Chat tools
  registerFeishuChatTools(api);

  // IM tools (user identity)
  registerFeishuImUserTools(api);

  // Calendar tools
  registerFeishuCalendarCalendarTool(api);
  registerFeishuCalendarEventTool(api);
  registerFeishuCalendarEventAttendeeTool(api);
  registerFeishuCalendarFreebusyTool(api);

  // Attendance tools
  registerFeishuAttendanceShiftTool(api);
  registerFeishuAttendanceGroupTool(api);

  // Task tools
  registerFeishuTaskTaskTool(api);
  registerFeishuTaskTasklistTool(api);
  registerFeishuTaskSectionTool(api);
  registerFeishuTaskCommentTool(api);
  registerFeishuTaskSubtaskTool(api);
  registerFeishuApprovalInstanceTool(api);
  registerFeishuApprovalTaskTool(api);
  registerFeishuApprovalTaskSearchTool(api);
  registerFeishuApprovalCcTool(api);
  registerFeishuApprovalCommentTool(api);

  // Meeting and minutes tools
  registerFeishuMeetingReserveTool(api);
  registerFeishuMeetingTool(api);
  registerFeishuMinutesTool(api);

  // Mail tools
  registerFeishuMailMessageTool(api);

  // Bitable tools
  registerFeishuBitableAppTool(api);
  registerFeishuBitableAppTableTool(api);
  registerFeishuBitableAppTableRecordTool(api);
  registerFeishuBitableAppTableFieldTool(api);
  registerFeishuBitableAppTableViewTool(api);

  // Search tools
  registerFeishuSearchTools(api);

  // Drive tools
  registerFeishuDriveTools(api);

  // Wiki tools
  registerFeishuWikiTools(api);

  // Sheets tools
  registerFeishuSheetsTools(api);

  // IM tools (bot identity)
  registerFeishuImBotTools(api);

  api.logger.debug?.(
    'Registered all OAPI tools (calendar, attendance, task, approval, meeting-reserve, meeting, minutes, mail, bitable, search, drive, wiki, sheets, im)',
  );
}
