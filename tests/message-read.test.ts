import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockInvoke = vi.fn();
const mockInvokeByPath = vi.fn();
const mockFormatMessageList = vi.fn();

vi.mock('../src/core/lark-logger', () => ({
  larkLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

vi.mock('../src/tools/oapi/im/format-messages', () => ({
  formatMessageList: (...args: unknown[]) => mockFormatMessageList(...args),
}));

vi.mock('../src/tools/oapi/helpers', async () => {
  const actual = await vi.importActual<typeof import('../src/tools/oapi/helpers')>('../src/tools/oapi/helpers');

  return {
    ...actual,
    createToolContext: () => ({
      getClient: vi.fn(),
      toolClient: () => ({
        account: { appId: 'cli_test', accountId: 'default' },
        senderOpenId: 'ou_sender',
        invoke: mockInvoke,
        invokeByPath: mockInvokeByPath,
      }),
      log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      },
    }),
    getFirstAccount: () => ({ accountId: 'default' }),
  };
});

import { registerMessageReadTools } from '../src/tools/oapi/im/message-read';

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

describe('message read tools', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFormatMessageList.mockResolvedValue([
      {
        message_id: 'om_1',
        msg_type: 'text',
        content: 'hello',
        sender: { id: 'ou_sender', sender_type: 'user' },
        create_time: '2026-04-16T08:00:00+08:00',
        deleted: false,
        updated: false,
      },
    ]);
  });

  it('resolves open_id to p2p chat_id before listing messages', async () => {
    const { api, registeredTools } = createMockApi();
    registerMessageReadTools(api as any);

    mockInvokeByPath.mockResolvedValueOnce({
      code: 0,
      data: {
        p2p_chats: [{ chat_id: 'oc_p2p_1' }],
      },
    });
    mockInvoke.mockResolvedValueOnce({
      code: 0,
      data: {
        items: [
          {
            message_id: 'om_1',
            msg_type: 'text',
            body: { content: '{"text":"hello"}' },
            sender: { id: 'ou_sender', sender_type: 'user' },
            create_time: '1776297600000',
          },
        ],
        has_more: false,
      },
    });

    const result = await registeredTools.feishu_im_user_get_messages.execute('call-1', {
      open_id: 'ou_target',
    });

    expect(mockInvokeByPath).toHaveBeenCalledWith(
      'feishu_im_user_get_messages.default',
      '/open-apis/im/v1/chat_p2p/batch_query',
      {
        method: 'POST',
        body: { chatter_ids: ['ou_target'] },
        query: { user_id_type: 'open_id' },
        as: 'user',
      },
    );

    expect(mockInvoke).toHaveBeenCalledWith(
      'feishu_im_user_get_messages.default',
      expect.any(Function),
      undefined,
    );

    expect(parseToolResult(result)).toMatchObject({
      messages: [
        {
          message_id: 'om_1',
          content: 'hello',
        },
      ],
      has_more: false,
    });
  });

  it('uses batched chat lookup when enriching search results', async () => {
    const { api, registeredTools } = createMockApi();
    registerMessageReadTools(api as any);

    mockInvoke.mockResolvedValueOnce({
      code: 0,
      data: {
        items: ['om_1'],
        has_more: false,
      },
    });
    mockInvokeByPath
      .mockResolvedValueOnce({
        code: 0,
        data: {
          items: [
            {
              message_id: 'om_1',
              chat_id: 'oc_group_1',
              msg_type: 'text',
              body: { content: '{"text":"hello"}' },
              sender: { id: 'ou_sender', sender_type: 'user' },
              create_time: '1776297600000',
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        code: 0,
        data: {
          items: [{ chat_id: 'oc_group_1', name: '研发群', chat_mode: 'group' }],
        },
      });

    const result = await registeredTools.feishu_im_user_search_messages.execute('call-2', {
      query: 'hello',
    });

    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(mockInvokeByPath).toHaveBeenNthCalledWith(
      1,
      'feishu_im_user_search_messages.default',
      '/open-apis/im/v1/messages/mget?message_ids=om_1',
      {
        method: 'GET',
        query: { user_id_type: 'open_id', card_msg_content_type: 'raw_card_content' },
        as: 'user',
      },
    );
    expect(mockInvokeByPath).toHaveBeenNthCalledWith(
      2,
      'feishu_im_user_search_messages.default',
      '/open-apis/im/v1/chats/batch_query',
      {
        method: 'POST',
        body: { chat_ids: ['oc_group_1'] },
        query: { user_id_type: 'open_id' },
        as: 'user',
      },
    );

    expect(parseToolResult(result)).toMatchObject({
      messages: [
        {
          message_id: 'om_1',
          chat_id: 'oc_group_1',
          chat_type: 'group',
          chat_name: '研发群',
        },
      ],
      has_more: false,
    });
  });
});
