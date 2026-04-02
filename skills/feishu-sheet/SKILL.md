---
name: feishu-sheet
description: |
  飞书电子表格（Sheets）工具。用于查看表结构、读取单元格范围、覆盖写入、追加行、查找内容、创建电子表格和导出文件。

  **当以下情况时使用此 Skill**:
  (1) 用户要读取或修改飞书电子表格
  (2) 用户提到“电子表格”、“sheet”、“sheets”、“表格”、“单元格”、“工作表”
  (3) 需要往现有表格追加行或覆盖写入范围
  (4) 需要先定位工作表或范围，再执行读写导出
---

# 飞书电子表格管理

## 执行前必读

- 工具是 `feishu_sheet`
- 支持的 action：`info`, `read`, `write`, `append`, `find`, `create`, `export`
- 除 `create` 外，优先传 `url` 或 `spreadsheet_token`
- 支持飞书 Sheets URL 和 wiki URL，工具会自动解析 token
- `write` 是覆盖写入，高风险；默认写到目标工作表的 `A1` 起始区域
- `append` 更安全，优先用于“新增行”场景
- `export` 为 `csv` 时必须提供 `sheet_id`
- `read` 最多返回 200 行；超出会截断并提示缩小范围

## 快速索引

| 用户意图 | 工具 | action | 必填参数 | 常用可选 |
|---------|------|--------|---------|---------|
| 看表格和工作表信息 | `feishu_sheet` | `info` | `url` 或 `spreadsheet_token` | - |
| 读一个范围 | `feishu_sheet` | `read` | `url` 或 `spreadsheet_token` | `range`, `sheet_id` |
| 覆盖写入单元格 | `feishu_sheet` | `write` | `url` 或 `spreadsheet_token`, `values` | `range`, `sheet_id` |
| 在表尾追加行 | `feishu_sheet` | `append` | `url` 或 `spreadsheet_token`, `values` | `range`, `sheet_id` |
| 查找内容 | `feishu_sheet` | `find` | `url` 或 `spreadsheet_token`, `sheet_id`, `find` | `range`, `search_by_regex` |
| 创建新表格 | `feishu_sheet` | `create` | `title` | `folder_token`, `headers`, `data` |
| 导出表格 | `feishu_sheet` | `export` | `url` 或 `spreadsheet_token`, `file_extension` | `output_path`, `sheet_id` |

## 推荐工作流

### 1. 改表前先 `info`

如果用户给的是一个表格链接，推荐先执行：

```json
{
  "action": "info",
  "url": "https://xxx.feishu.cn/sheets/..."
}
```

先确认：
- `spreadsheet_token`
- 工作表列表 `sheets`
- 目标 `sheet_id`

这样后续 `read`、`find`、`export csv` 会更稳。

### 2. 写入优先区分“覆盖”还是“追加”

- 用户要“新增一行/追加数据”时，优先用 `append`
- 用户要“把某个区域改成指定值”时，才用 `write`

不要把“新增记录”误做成 `write`，否则容易覆盖已有内容。

### 3. 先读再写

如果用户没有明确给出精确范围，推荐顺序：

1. `info`
2. `read` 一个较小范围确认表头和布局
3. 再决定 `write` 还是 `append`

### 4. 导出前先确认格式

- 导出整个电子表格：`file_extension = "xlsx"`
- 只导出一个工作表：`file_extension = "csv"`，并且必须给 `sheet_id`

如果用户要本地文件，传 `output_path`；否则工具只返回导出文件信息。

## 关键约束

### 1. `range` 和 `sheet_id` 的优先级

优先级是：

1. 显式 `range`
2. `sheet_id`
3. URL 中携带的 `sheet`
4. 自动回退到第一个工作表

所以：
- 已知精确区域时，直接传 `range`
- 只知道工作表时，传 `sheet_id`

### 2. `write` 的默认行为很危险

如果只给 `sheet_id` 而不给 `range`，`write` 会从目标工作表左上角开始覆盖。

因此：
- 未明确范围时，先 `read`
- 对大表不要直接裸 `write`

### 3. `read` 会截断大结果

工具最多返回 200 行。

如果读全表被截断，应缩小 `range`，例如：
- 只读表头：`sheetId!A1:Z5`
- 分段读取：`sheetId!A1:Z200`、`sheetId!A201:Z400`

### 4. 行列数限制

- `write` 最多 5000 行
- `write` 单行最多 100 列
- `append` 最多 5000 行

大批量写入时要主动分批，不要一次传超大二维数组。

### 5. wiki 链接可以直接用

如果用户给的是 wiki 页面里的电子表格链接，不需要先手工转 token，工具会自动解析为真实的 `spreadsheet_token`。

## 常见场景示例

### 查看表格和工作表列表

```json
{
  "action": "info",
  "url": "https://xxx.feishu.cn/sheets/shtcnxxxxxxxxxx"
}
```

### 读取一个工作表前 20 行

```json
{
  "action": "read",
  "spreadsheet_token": "shtcnxxxxxxxxxx",
  "range": "f4c9ab!A1:F20"
}
```

### 向表尾追加两行

```json
{
  "action": "append",
  "spreadsheet_token": "shtcnxxxxxxxxxx",
  "sheet_id": "f4c9ab",
  "values": [
    ["张三", "工程", "进行中"],
    ["李四", "销售", "待确认"]
  ]
}
```

### 覆盖写入一个明确区域

```json
{
  "action": "write",
  "spreadsheet_token": "shtcnxxxxxxxxxx",
  "range": "f4c9ab!B2:D3",
  "values": [
    ["张三", "工程", "完成"],
    ["李四", "销售", "进行中"]
  ]
}
```

### 在一个工作表中查找关键词

```json
{
  "action": "find",
  "spreadsheet_token": "shtcnxxxxxxxxxx",
  "sheet_id": "f4c9ab",
  "find": "张三",
  "match_case": true,
  "match_entire_cell": false
}
```

### 创建带表头和初始数据的新表格

```json
{
  "action": "create",
  "title": "项目跟踪",
  "headers": ["负责人", "项目", "状态"],
  "data": [
    ["张三", "Sheet Skill", "进行中"],
    ["李四", "测试补充", "待开始"]
  ]
}
```

### 导出为本地 xlsx 文件

```json
{
  "action": "export",
  "spreadsheet_token": "shtcnxxxxxxxxxx",
  "file_extension": "xlsx",
  "output_path": "/tmp/project-tracker.xlsx"
}
```

## 常见错误与处理

| 问题 | 原因 | 处理方式 |
|------|------|---------|
| 数据被覆盖了 | 把追加场景误用了 `write` | 优先改用 `append`，并在写前先 `read` |
| 读结果不全 | 超过 200 行被截断 | 缩小 `range` 分段读取 |
| CSV 导出失败 | 没传 `sheet_id` | 先 `info` 获取目标 `sheet_id` |
| 找不到目标工作表 | 只给了表格 URL，没有明确工作表 | 先 `info`，再用返回的 `sheet_id` |
| 写入报超限 | 行数或列数过大 | 拆成多次写入 |

## 操作原则

- 没有明确范围时，不直接 `write`
- 要新增数据时，优先 `append`
- 用户给链接但没说明工作表时，先 `info`
- 大表读取时主动缩小范围，避免返回被截断
- 仅在用户明确需要本地文件时，给 `export.output_path`
