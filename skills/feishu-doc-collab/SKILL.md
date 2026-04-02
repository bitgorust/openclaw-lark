---
name: feishu-doc-collab
description: |
  飞书云文档协作工具。用于查看评论、添加评论、解决或恢复评论，以及下载文档中的图片、文件和画板资源。

  **当以下情况时使用此 Skill**:
  (1) 用户要查看或处理云文档评论
  (2) 用户要对文档内容“加评论”、“回复协作意见”、“解决评论”
  (3) 用户要下载文档中的图片、附件或画板缩略图
  (4) 需要结合文档正文、评论和媒体资源一起理解文档
---

# 飞书云文档协作

## 执行前必读

- 主要工具：
  - `feishu_fetch_doc`
  - `feishu_doc_comments`
  - `feishu_doc_media`
  - 必要时配合 `feishu_wiki_space_node`
- `feishu_doc_comments` 支持：`list`, `create`, `patch`
- `feishu_doc_media` 支持：`insert`, `download`
- 评论工具支持 wiki token；如果传的是 wiki 节点，会自动解析真实文档对象
- 媒体下载依赖资源 token，不是直接用文档 token

## 快速索引

| 用户意图 | 工具 | action | 必填参数 | 常用可选 |
|---------|------|--------|---------|---------|
| 获取文档正文 | `feishu_fetch_doc` | 默认 | `doc_id` | - |
| 查看评论列表 | `feishu_doc_comments` | `list` | `file_token`, `file_type` | `is_whole`, `is_solved`, `page_size` |
| 添加全文评论 | `feishu_doc_comments` | `create` | `file_token`, `file_type`, `elements` | `user_id_type` |
| 解决或恢复评论 | `feishu_doc_comments` | `patch` | `file_token`, `file_type`, `comment_id`, `is_solved_value` | - |
| 下载图片/文件/画板 | `feishu_doc_media` | `download` | `resource_token`, `resource_type`, `output_path` | - |

## 推荐工作流

### 1. 先拿正文，再处理协作信息

如果用户说“帮我看看这个文档里的评论/图片/附件”，推荐顺序：

1. `feishu_fetch_doc`
2. `feishu_doc_comments.list`
3. 必要时 `feishu_doc_media.download`

原因：
- 正文能提供评论上下文
- Markdown 返回里能暴露媒体 token
- 评论列表会补齐完整回复链路

### 2. 评论前先确认是“全文评论”还是“文本修改”

如果用户要“修改文档内容”，优先走 `feishu-update-doc`。

如果用户要“留个意见”“加备注”“标注一下”，才走 `feishu_doc_comments.create`。

不要把正文编辑误做成评论，也不要把评论误做成正文修改。

### 3. 处理 wiki 文档时先接受 wiki token

对于评论工具：
- `file_token` 可以直接传 wiki token
- `file_type` 传 `wiki`

工具会自动解析真实文档对象，不需要手工先转 `obj_token`。

但如果你需要获取正文内容，仍然要按 `feishu_fetch_doc` 的规则，必要时先用 `feishu_wiki_space_node.get` 判断实际对象类型。

### 4. 媒体下载先从正文里取 token

文档正文中的媒体通常以这些形式出现：

- 图片：`<image token="..."/>`
- 文件：`<file token="..."/>`
- 画板：`<whiteboard token="..."/>`

处理顺序：

1. 先 `feishu_fetch_doc`
2. 从正文里提取 `token`
3. 调 `feishu_doc_media.download`

## 关键约束

### 1. `comment_id` 只能来自评论列表

解决或恢复评论时，不要猜 `comment_id`。

推荐顺序：
1. 先 `list`
2. 找到目标评论
3. 再 `patch`

### 2. 评论内容是结构化 `elements`

`create` 不是传纯字符串，而是传元素数组，常见有：
- `text`
- `mention`
- `link`

最简单的纯文本评论示例：

```json
{
  "action": "create",
  "file_token": "doxcnxxxxxxxxxx",
  "file_type": "docx",
  "elements": [
    { "type": "text", "text": "建议补充这里的背景说明。" }
  ]
}
```

### 3. `patch` 是解决/恢复评论，不是编辑评论内容

`feishu_doc_comments.patch` 只能切换评论解决状态：
- `true` = 解决
- `false` = 恢复

它不是“修改评论正文”的接口。

### 4. `resource_type` 要和资源类型对应

下载文档资源时：
- 文档图片/文件等素材：`resource_type = "media"`
- 画板缩略图：`resource_type = "whiteboard"`

不要把两类 token 混用。

## 常见场景示例

### 获取文档评论

```json
{
  "action": "list",
  "file_token": "doxcnxxxxxxxxxx",
  "file_type": "docx",
  "is_solved": false
}
```

### 对 wiki 文档添加评论

```json
{
  "action": "create",
  "file_token": "wikcnxxxxxxxxxx",
  "file_type": "wiki",
  "elements": [
    { "type": "text", "text": "这里建议补充审批背景。" }
  ]
}
```

### 解决一个评论

```json
{
  "action": "patch",
  "file_token": "doxcnxxxxxxxxxx",
  "file_type": "docx",
  "comment_id": "6999xxxxxxxx",
  "is_solved_value": true
}
```

### 下载文档中的图片

```json
{
  "action": "download",
  "resource_token": "boxcnxxxxxxxxxx",
  "resource_type": "media",
  "output_path": "/tmp/doc-image.png"
}
```

### 下载画板缩略图

```json
{
  "action": "download",
  "resource_token": "wbcnxxxxxxxxxx",
  "resource_type": "whiteboard",
  "output_path": "/tmp/whiteboard-preview.png"
}
```

## 常见错误与处理

| 问题 | 原因 | 处理方式 |
|------|------|---------|
| 找不到评论 | 文档 token 或类型不对 | doc/wiki 场景下先确认 `file_token` 和 `file_type` |
| 无法解决评论 | `comment_id` 不正确 | 先重新 `list`，不要猜 comment_id |
| 下载失败 | 用错了资源 token 或 `resource_type` | 从正文重新提取 token，并区分 `media` / `whiteboard` |
| 看不到图片内容 | 只拿了 Markdown 文本 | 从 `<image/>` / `<file/>` / `<whiteboard/>` 标签里取 token，再下载 |
| 误把评论当正文修改 | 选错工具 | 评论用 `feishu_doc_comments`，正文修改用 `feishu-update-doc` |

## 操作原则

- 要理解协作上下文时，优先“正文 + 评论”一起看
- 要处理评论状态时，先列评论再 patch
- 要拿媒体文件时，先从正文提取资源 token
- 正文修改和评论协作要明确分开，不混用工具
