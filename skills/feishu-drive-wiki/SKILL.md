---
name: feishu-drive-wiki
description: |
  飞书云空间与知识库导航工具。用于浏览文件夹、查看知识空间和节点、解析 wiki 节点对应的真实对象，并执行复制或移动操作。

  **当以下情况时使用此 Skill**:
  (1) 用户要找某个文件夹、知识空间、知识库节点
  (2) 用户提到“云空间”、“文件夹”、“知识库”、“wiki”、“space”、“node”
  (3) 需要把 wiki 节点解析成真实的 doc/sheet/bitable/file 对象
  (4) 需要复制或移动 wiki 节点或 drive 文件
---

# 飞书云空间与知识库导航

## 执行前必读

- 主要工具：
  - `feishu_drive_file`
  - `feishu_wiki_space`
  - `feishu_wiki_space_node`
- `feishu_drive_file` 支持：`list`, `get_meta`, `copy`, `move`, `delete`, `upload`, `download`
- `feishu_wiki_space` 支持：`list`, `get`, `create`
- `feishu_wiki_space_node` 支持：`list`, `get`, `create`, `move`, `copy`
- 处理 wiki 时，`node_token` 不等于真实文档 token
- 需要下游编辑文档/表格时，先用 `feishu_wiki_space_node.get` 把 wiki 节点解析成 `obj_token`

## 快速索引

| 用户意图 | 工具 | action | 必填参数 | 常用可选 |
|---------|------|--------|---------|---------|
| 浏览云空间文件夹 | `feishu_drive_file` | `list` | - 或 `folder_token` | `page_size`, `page_token` |
| 查文件元信息 | `feishu_drive_file` | `get_meta` | `request_docs` | - |
| 复制文件 | `feishu_drive_file` | `copy` | `file_token`, `name`, `type` | `folder_token` |
| 移动文件 | `feishu_drive_file` | `move` | `file_token`, `type`, `folder_token` | - |
| 列知识空间 | `feishu_wiki_space` | `list` | - | `page_size`, `page_token` |
| 查知识空间详情 | `feishu_wiki_space` | `get` | `space_id` | - |
| 列空间节点 | `feishu_wiki_space_node` | `list` | `space_id` | `parent_node_token`, `page_size` |
| 解析 wiki 节点 | `feishu_wiki_space_node` | `get` | `token` | `obj_type` |
| 复制 wiki 节点 | `feishu_wiki_space_node` | `copy` | `space_id`, `node_token` | `target_space_id`, `target_parent_token`, `title` |
| 移动 wiki 节点 | `feishu_wiki_space_node` | `move` | `space_id`, `node_token` | `target_parent_token` |

## 推荐工作流

### 1. 先判断是 Drive 还是 Wiki

- 用户说“文件夹、云空间、目录、上传、下载”时，优先走 `feishu_drive_file`
- 用户说“知识库、wiki、space、节点、文档树”时，优先走 `feishu_wiki_space` / `feishu_wiki_space_node`

不要混用：
- Drive 的 `file_token` 用于文件系统对象
- Wiki 的 `node_token` 用于知识库节点

### 2. 操作 wiki 节点前，先定位 `space_id`

常见顺序：

1. `feishu_wiki_space.list`
2. `feishu_wiki_space_node.list`
3. `feishu_wiki_space_node.get`

这样可以先找到正确的空间和节点，再决定是否复制、移动或交给下游文档工具。

### 3. 解析 wiki 节点时，优先把它当 `wiki` 节点看

默认做法：

```json
{
  "action": "get",
  "token": "wikcnxxxxxxxxxx"
}
```

这会返回节点信息，并可拿到：
- `node_token`
- `obj_token`
- `obj_type`

一旦得到 `obj_token` 和 `obj_type`，再选择：
- 文档类 -> doc skill / doc 工具
- sheet 类 -> `feishu-sheet`
- bitable 类 -> `feishu-bitable`

### 4. 复制或移动前先确认目标位置

对于 drive 文件：
- 目标目录用 `folder_token`

对于 wiki 节点：
- 目标空间用 `target_space_id`
- 目标父节点用 `target_parent_token`

如果目标位置不明确，先列目标空间或目标文件夹，不要盲操作。

## 关键约束

### 1. `node_token` 和 `obj_token` 不是一回事

这是最容易出错的地方：

- `node_token`：知识库节点 ID
- `obj_token`：真实对象 ID，例如 doc、sheet、bitable

因此：
- 做 wiki 层级导航、复制、移动时，用 `node_token`
- 做真实文档/表格操作时，用 `obj_token`

### 2. Drive 根目录和文件夹模式不同

`feishu_drive_file.list`：
- 不传 `folder_token` 时，列的是用户云空间根目录
- 传了 `folder_token` 时，列指定文件夹内容

如果用户说“列我的空间根目录”，不要虚构 folder token，直接不传即可。

### 3. `get_meta` 适合做对象类型确认

已知 token 但不确定对象类型时，优先用：

```json
{
  "action": "get_meta",
  "request_docs": [
    { "doc_token": "xxx", "doc_type": "sheet" }
  ]
}
```

它适合在进入下游工具前补一层元信息确认。

### 4. Wiki 节点复制和移动只在知识库层生效

`feishu_wiki_space_node.copy` / `move` 操作的是知识库节点结构，不是底层 drive 文件系统。

如果用户真正想移动云空间里的文件，应该改用 `feishu_drive_file.move`。

## 常见场景示例

### 列云空间根目录

```json
{
  "action": "list"
}
```

### 列某文件夹内容

```json
{
  "action": "list",
  "folder_token": "fldcnxxxxxxxxxx"
}
```

### 列知识空间

```json
{
  "action": "list",
  "page_size": 20
}
```

### 列某知识空间根节点

```json
{
  "action": "list",
  "space_id": "7345xxxxxxxx",
  "page_size": 50
}
```

### 解析 wiki 节点对应的真实对象

```json
{
  "action": "get",
  "token": "wikcnxxxxxxxxxx"
}
```

### 复制 wiki 节点到另一个位置

```json
{
  "action": "copy",
  "space_id": "7345xxxxxxxx",
  "node_token": "wikcnnode123",
  "target_parent_token": "wikcntarget456",
  "title": "复制后的名称"
}
```

### 移动 drive 文件到另一个文件夹

```json
{
  "action": "move",
  "file_token": "shtcnxxxxxxxxxx",
  "type": "sheet",
  "folder_token": "fldcnxxxxxxxxxx"
}
```

## 常见错误与处理

| 问题 | 原因 | 处理方式 |
|------|------|---------|
| 下游工具打不开 wiki 节点 | 直接把 `node_token` 当成真实对象 token | 先 `feishu_wiki_space_node.get` 拿 `obj_token` |
| 不知道该用 drive 还是 wiki | 把文件系统操作和知识库树操作混在一起 | 先判断用户是在操作“文件夹”还是“知识库节点” |
| 复制/移动目标不对 | 没先确认目标空间或目标父节点 | 先 `list` 目标目录或目标空间节点 |
| 根目录列表结果不完整 | 根目录模式和文件夹模式行为不同 | 明确是否需要进入具体 `folder_token` 再继续 |

## 操作原则

- 处理 wiki 时，先解析 `node_token -> obj_token`
- 处理移动/复制时，先确认源对象类型和目标位置
- 文件系统问题优先用 drive 工具，知识库树问题优先用 wiki 工具
- 需要继续编辑 doc/sheet/bitable 时，不要停在 wiki 节点层，继续下钻到真实对象
