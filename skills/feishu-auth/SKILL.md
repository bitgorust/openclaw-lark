---
name: feishu-auth
description: |
  飞书授权与权限诊断 Skill。用于处理用户授权、批量授权、应用权限不足、租户态/用户态差异，以及权限相关故障排查。

  **当以下情况时使用此 Skill**:
  (1) 用户要授权飞书能力或重做授权
  (2) 工具返回 user_auth_required / app_scope_missing / tenant_only_capability / unsupported_auth_mode
  (3) 用户说“为什么这个接口不能用”“为什么提示 user access token not support”“帮我把权限一次性开好”
  (4) 需要决定是走 `feishu_oauth`、`feishu_oauth_batch_auth`，还是让用户执行 `/feishu doctor`
---

# 飞书授权与权限诊断

## 执行前必读

- 用户态和应用态不是同一回事：
  - 用户态问题：通常用 `feishu_oauth`
  - 应用权限问题：需要管理员在开放平台开通权限
  - tenant-only 能力：用户 OAuth 不能把它变成 user 模式
- 当前仓库的 canonical contract 已经区分：
  - `tenant-only`
  - `user-only`
  - `dual-mode`
- 当工具已经返回结构化错误时，不要忽略它再猜一个新路径

## 快速索引

| 场景 | 处理方式 |
|---|---|
| 用户缺少某个或某批 user scope | `feishu_oauth` |
| 用户明确要求“一次性把能授权的都授权” | `feishu_oauth_batch_auth` |
| 应用缺权限 / 管理员未开通权限 | 指引管理员开通开放平台权限，不要只重复用户授权 |
| tenant-only 能力报错 | 解释这是能力认证模式限制，用户授权无法修复 |
| 多次授权后仍失败 | 让用户执行 `/feishu doctor` |

## 判定规则

### 1. 看到 `tenant_only_capability`

- 直接说明：当前能力只能按应用身份执行
- 不要继续要求用户重新授权
- 如果用户目标可以换成 dual-mode 或 user-only 的近似能力，再切换能力

### 2. 看到 `app_scope_missing`

- 这是管理员动作，不是终端用户动作
- 正确动作：
  - 告知用户/管理员去开放平台开通缺失 scope
  - 等应用权限开通后，再继续用户授权链路

### 3. 看到 `user_auth_required` 或 `user_scope_insufficient`

- 这是用户授权问题
- 如果只是当前任务需要的 scope，用普通 `feishu_oauth`
- 如果用户明确说“以后别再问了”“一次性把能开的都开掉”，再用 `feishu_oauth_batch_auth`

### 4. 看到 `user access token not support`

- 优先怀疑这是 capability contract 不支持 user mode
- 不要把它机械地解释成“你没授权”
- 先看当前能力是不是 tenant-only

## 推荐工作流

1. 先判断错误属于：
   - 用户授权
   - 应用权限
   - tenant-only / 模式不兼容
2. 用户授权时再决定：
   - 精准授权：`feishu_oauth`
   - 批量授权：`feishu_oauth_batch_auth`
3. 连续失败、状态不明、怀疑配置漂移时：
   - 让用户执行 `/feishu doctor`
   - 或 CLI 下执行 `openclaw feishu-diagnose`

## 不要这样做

- 不要在 `tenant-only` 能力上反复要求用户 OAuth
- 不要把应用权限问题描述成“用户没同意”
- 不要在没有明确要求时主动推荐批量授权
