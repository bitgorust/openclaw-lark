#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const feishuSdk = require('@larksuiteoapi/node-sdk');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TOOLS_ROOT = path.join(ROOT, 'src', 'tools');
const COMMANDS_INDEX = path.join(ROOT, 'src', 'commands', 'index.ts');
const API_LIST_JSON = path.join(ROOT, 'docs', 'references', 'feishu-server-api-list.json');
const OUT_JSON = path.join(ROOT, 'docs', 'references', 'feishu-supported-operations.json');
const OUT_MD = path.join(ROOT, 'docs', 'references', 'feishu-supported-operations.md');
const DOCS_BASE_URL = 'https://open.feishu.cn';
const MCP_REMOTE_DOC_URL =
  'https://open.feishu.cn/document/mcp_open_tools/developers-call-remote-mcp-server';

const DEFAULT_OPERATION_NAME_OVERRIDES = {
  feishu_ask_user_question: 'ask',
  feishu_chat_members: 'list_members',
  feishu_create_doc: 'create-doc',
  feishu_fetch_doc: 'fetch-doc',
  feishu_get_user: 'get',
  feishu_im_user_fetch_resource: 'download_resource',
  feishu_im_user_get_messages: 'list_messages',
  feishu_im_user_get_thread_messages: 'list_thread_messages',
  feishu_im_user_search_messages: 'search_messages',
  feishu_im_bot_image: 'download_resource',
  feishu_oauth_batch_auth: 'authorize_all',
  feishu_search_user: 'search',
  feishu_update_doc: 'update-doc',
};

const sdkClient = new feishuSdk.Client({ appId: 'x', appSecret: 'y' });
const sdkEndpointCache = new Map();

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function walkFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

function getNodeText(sourceFile, node) {
  return sourceFile.text.slice(node.getStart(sourceFile), node.getEnd());
}

function isIdentifierNamed(node, name) {
  return ts.isIdentifier(node) && node.text === name;
}

function getPropertyNameText(nameNode) {
  if (!nameNode) return null;
  if (ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode) || ts.isNumericLiteral(nameNode)) {
    return nameNode.text;
  }
  return null;
}

function getObjectProperty(objectNode, propName) {
  for (const prop of objectNode.properties) {
    const name = getPropertyNameText(prop.name);
    if (name !== propName) continue;
    if (ts.isPropertyAssignment(prop)) return prop.initializer;
    if (ts.isMethodDeclaration(prop)) return prop;
  }
  return null;
}

function buildStringConstMap(sourceFile) {
  const values = new Map();
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      const value = getLiteralLikeText(node.initializer);
      if (typeof value === 'string') values.set(node.name.text, value);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return values;
}

function getStringLiteralValue(node, constMap = new Map()) {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isIdentifier(node)) return constMap.get(node.text) ?? null;
  return null;
}

function getLiteralLikeText(node) {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (node.kind === ts.SyntaxKind.TrueKeyword) return 'true';
  if (node.kind === ts.SyntaxKind.FalseKeyword) return 'false';
  if (ts.isNumericLiteral(node)) return node.text;
  return null;
}

function derivePlaceholderName(exprText) {
  const cleaned = exprText.trim();
  const encoded = cleaned.match(/encodeURIComponent\((.+)\)$/);
  const inner = encoded ? encoded[1] : cleaned;
  const leaf = inner.split('.').at(-1)?.replace(/\W+/g, '_') ?? 'param';
  return leaf || 'param';
}

function templateExpressionToPath(node, sourceFile) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (!ts.isTemplateExpression(node)) return null;
  let text = node.head.text;
  for (const span of node.templateSpans) {
    text += `:${derivePlaceholderName(getNodeText(sourceFile, span.expression))}`;
    text += span.literal.text;
  }
  return text;
}

function collectRegisterCalls(sourceFile) {
  const calls = [];
  function visit(node) {
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      const callee =
        ts.isIdentifier(expr) ? expr.text : ts.isPropertyAccessExpression(expr) && ts.isIdentifier(expr.name) ? expr.name.text : null;
      if (callee === 'registerTool' || callee === 'registerMcpTool') {
        calls.push(node);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return calls;
}

function buildFunctionTextMap(sourceFile) {
  const map = new Map();
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text) {
      map.set(node.name.text, getNodeText(sourceFile, node));
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return map;
}

function findSwitchOnAction(fnNode) {
  let found = null;
  function visit(node) {
    if (found) return;
    if (ts.isSwitchStatement(node)) {
      const exprText = node.expression.getText();
      if (exprText.endsWith('.action') || exprText === 'action') {
        found = node;
        return;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(fnNode);
  return found;
}

function normalizeBackendSignature(backend) {
  if (backend.startsWith('MCP:')) return backend;
  const match = backend.match(/^([A-Z]+:\/open-apis\/[^\s]+)/);
  return match ? match[1] : backend;
}

function normalizeEndpointPattern(signature) {
  return signature
    .replace(/\$\{[^}]+\}/g, ':_')
    .replace(/:[A-Za-z0-9_]+/g, ':_');
}

function loadServerApiIndex() {
  const payload = JSON.parse(fs.readFileSync(API_LIST_JSON, 'utf8'));
  const apis = payload?.data?.apis ?? [];
  const direct = new Map();
  const normalized = new Map();
  for (const api of apis.filter((item) => item?.url && item?.fullPath)) {
    direct.set(api.url, api);
    const key = normalizeEndpointPattern(api.url);
    if (!normalized.has(key)) normalized.set(key, api);
  }
  return { direct, normalized };
}

function buildLinksForBackend(backend, apiIndex) {
  const normalized = normalizeBackendSignature(backend);
  if (normalized.startsWith('MCP:')) {
    return [{ kind: 'mcp', label: normalized, url: MCP_REMOTE_DOC_URL }];
  }
  const api = apiIndex.direct.get(normalized) ?? apiIndex.normalized.get(normalizeEndpointPattern(normalized));
  if (!api) return [];
  return [
    {
      kind: 'oapi',
      label: normalized,
      name: api.name,
      url: `${DOCS_BASE_URL}${api.fullPath}`,
    },
  ];
}

function classifyBackendKind(backends) {
  if (!backends || backends.length === 0) return 'plugin';
  const kinds = new Set(
    backends.map((backend) => {
      if (backend.startsWith('MCP:')) return 'mcp';
      if (/^[A-Z]+:\/open-apis\//.test(backend)) return 'oapi';
      return 'plugin';
    }),
  );
  return kinds.size === 1 ? [...kinds][0] : 'mixed';
}

function getToolCategory(relPath, toolName, legacyTool) {
  if (legacyTool?.category) return legacyTool.category;
  if (relPath.includes('/mcp/doc/')) return 'mcp-doc';
  if (toolName.startsWith('feishu_doc_')) return 'doc';
  if (toolName === 'feishu_create_doc' || toolName === 'feishu_fetch_doc' || toolName === 'feishu_update_doc') return 'mcp-doc';
  if (toolName.startsWith('feishu_oauth')) return 'auth';
  if (toolName === 'feishu_ask_user_question') return 'interaction';
  const match = relPath.match(/^src\/tools\/(?:oapi|tat)\/([^/]+)/);
  return match?.[1] ?? 'plugin';
}

function getTransport(relPath, legacyTool) {
  if (legacyTool?.transport) return legacyTool.transport;
  if (relPath.includes('/mcp/')) return 'mcp';
  if (relPath.includes('/oapi/') || relPath.includes('/tat/')) return 'oapi';
  return 'plugin';
}

function inferAuthFromText(text) {
  const hasUser = /\bas:\s*'user'/.test(text);
  const hasTenant = /\bas:\s*'tenant'/.test(text);
  const mentionsUserToken = /\buser_access_token\b/.test(text);
  const mentionsTenantToken = /\btenant_access_token\b/.test(text);
  if ((hasUser || mentionsUserToken) && (hasTenant || mentionsTenantToken)) return 'dual';
  if (hasUser && hasTenant) return 'dual';
  if (hasUser || mentionsUserToken) return 'user';
  if (hasTenant || mentionsTenantToken) return 'tenant';
  return null;
}

function collectActionKeysFromText(text) {
  const matches = [...text.matchAll(/'((?:feishu|lark)_[a-z0-9_]+\.[a-z0-9_-]+)'/g)];
  return Array.from(new Set(matches.map((match) => match[1])));
}

function collectSchemaActionLiterals(text) {
  const matches = [...text.matchAll(/action:\s*Type\.Literal\('([^']+)'\)/g)];
  return Array.from(new Set(matches.map((match) => match[1])));
}

function extractSummary(toolName, opName, toolDescription, legacyOperation) {
  const firstSentence = toolDescription?.split(/[。.]/)[0]?.trim();
  if (firstSentence) return `${firstSentence}.`;
  return `Action \`${opName}\` exposed by \`${toolName}\`.`;
}

function parseSdkEndpointFromFunction(fn) {
  const source = String(fn);
  const methodMatch = source.match(/method:\s*"([A-Z]+)"/);
  const pathMatch = source.match(/fillApiPath\(`\$\{this\.domain\}(\/open-apis\/[^`]+)`/);
  if (!methodMatch || !pathMatch) return null;
  return `${methodMatch[1]}:${pathMatch[1]}`;
}

function resolveSdkEndpoint(chain) {
  if (sdkEndpointCache.has(chain)) return sdkEndpointCache.get(chain);
  let current = sdkClient;
  for (const part of chain.split('.')) {
    current = current?.[part];
    if (!current) break;
  }
  const endpoint = typeof current === 'function' ? parseSdkEndpointFromFunction(current) : null;
  sdkEndpointCache.set(chain, endpoint);
  return endpoint;
}

function extractBackendQualifiers(callText) {
  const qualifiers = [];
  const containerIdTypeMatch = callText.match(/container_id_type:\s*'([^']+)'/);
  if (containerIdTypeMatch) qualifiers.push(`container_id_type=${containerIdTypeMatch[1]}`);
  return qualifiers;
}

function extractBackendsFromText(text) {
  const seen = new Set();
  const backends = [];

  const add = (label) => {
    if (!label || seen.has(label)) return;
    seen.add(label);
    backends.push(label);
  };

  for (const match of text.matchAll(/\b(?:sdk|client)\.([A-Za-z0-9_.]+)\(([\s\S]*?)\)\s*[);,]/g)) {
    const chain = match[1];
    if (chain === 'request' || chain === 'invoke' || chain === 'invokeByPath') continue;
    const endpoint = resolveSdkEndpoint(chain);
    if (!endpoint) continue;
    const qualifiers = extractBackendQualifiers(match[0]);
    add(qualifiers.length > 0 ? `${endpoint} (${qualifiers.join(', ')})` : endpoint);
  }

  for (const match of text.matchAll(/\b(?:client|toolClient)\.invoke\(\s*[\s\S]*?,\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][A-Za-z0-9_$]*)\s*=>\s*sdk\.([A-Za-z0-9_.]+)\(([\s\S]*?)\)\s*(?:,|\))/g)) {
    const chain = match[1];
    const endpoint = resolveSdkEndpoint(chain);
    if (!endpoint) continue;
    const qualifiers = extractBackendQualifiers(match[0]);
    add(qualifiers.length > 0 ? `${endpoint} (${qualifiers.join(', ')})` : endpoint);
  }

  for (const match of text.matchAll(/sdk\.request\(\s*\{([\s\S]*?)\}\s*,/g)) {
    const objText = match[1];
    const method = objText.match(/method:\s*'([A-Z]+)'/)?.[1];
    const url = objText.match(/url:\s*'([^']+)'/)?.[1];
    if (method && url?.startsWith('/open-apis/')) add(`${method}:${url}`);
  }

  for (const match of text.matchAll(/invokeByPath(?:<[\s\S]*?>)?\(\s*'[^']+'\s*,\s*(`[^`]+`|'[^']+')\s*,\s*\{([\s\S]*?)\}\s*\)/g)) {
    const method = match[2].match(/method:\s*'([A-Z]+)'/)?.[1];
    if (!method) continue;
    const pathText = match[1];
    let normalizedPath = null;
    if (pathText.startsWith("'")) {
      normalizedPath = pathText.slice(1, -1);
    }
    if (pathText.startsWith('`')) {
      normalizedPath = pathText
        .slice(1, -1)
        .replace(/\$\{([^}]+)\}/g, (_all, expr) => `:${derivePlaceholderName(expr)}`);
    }
    if (!normalizedPath?.startsWith('/open-apis/')) continue;
    normalizedPath = normalizedPath.replace(/\?:[A-Za-z0-9_]+$/, '').replace(/\?.*$/, '');
    add(`${method}:${normalizedPath}`);
  }

  return backends;
}

function collectCalledHelperNames(text, functionTextMap) {
  const names = new Set();
  for (const match of text.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)) {
    const name = match[1];
    if (functionTextMap.has(name)) names.add(name);
  }
  return [...names];
}

function extractActionPathMapFromHelperText(helperText) {
  const map = new Map();
  for (const match of helperText.matchAll(/case\s+'([^']+)':\s*return\s+`?(\/open-apis\/[^`';]+)`?;/g)) {
    map.set(match[1], match[2]);
  }
  for (const match of helperText.matchAll(/case\s+'([^']+)':\s*return\s+'(\/open-apis\/[^']+)';/g)) {
    map.set(match[1], match[2]);
  }
  return map;
}

function extractSchemaFallbackBackends(toolName, action, sourceText, executeText, functionTextMap) {
  if (toolName === 'feishu_minutes') {
    const helperText = functionTextMap.get('buildMinutesPath') ?? '';
    const pathMap = extractActionPathMapFromHelperText(helperText);
    const actionPath = pathMap.get(action);
    return actionPath ? [`GET:${actionPath}`] : [];
  }

  if (toolName === 'feishu_approval_task') {
    if (action === 'rollback') {
      return ['POST:/open-apis/approval/v4/instances/specified_rollback'];
    }
    if (action === 'add_sign') {
      return ['POST:/open-apis/approval/v4/instances/add_sign'];
    }
    return [`POST:/open-apis/approval/v4/tasks/${action}`];
  }

  const perActionTextMatch =
    sourceText.match(new RegExp(`'${action}'[\\s\\S]{0,400}?/open-apis/[^'\\\`\\s]+`, 'm')) ??
    executeText.match(new RegExp(`'${action}'[\\s\\S]{0,400}?/open-apis/[^'\\\`\\s]+`, 'm'));
  if (perActionTextMatch) {
    return extractBackendsFromText(perActionTextMatch[0]);
  }
  return [];
}

function extractOperationsFromRegisterTool(sourceFile, toolName, toolDescription, executeNode, legacyTool, functionTextMap) {
  const switchNode = findSwitchOnAction(executeNode);
  const sourceText = getNodeText(sourceFile, executeNode);
  const fileText = sourceFile.text;
  const operations = [];

  const buildOperation = (opName, nodeOrText) => {
    const text = typeof nodeOrText === 'string' ? nodeOrText : getNodeText(sourceFile, nodeOrText);
    const auth =
      inferAuthFromText(text) ??
      inferAuthFromText(fileText) ??
      legacyTool?.auth ??
      'user';
    let backends = extractBackendsFromText(text);
    for (const helperName of collectCalledHelperNames(text, functionTextMap)) {
      backends = [...backends, ...extractBackendsFromText(functionTextMap.get(helperName) ?? '')];
    }
    if (text.includes('resolveP2PChatId(')) {
      backends = [...backends, ...extractBackendsFromText(functionTextMap.get('resolveP2PChatId') ?? '')];
    }
    if (text.includes('fetchChatContexts(')) {
      backends = [...backends, ...extractBackendsFromText(functionTextMap.get('fetchChatContexts') ?? '')];
    }
    if (backends.length === 0) {
      backends = extractBackendsFromText(fileText);
    }
    backends = Array.from(new Set(backends));
    operations.push({
      name: opName,
      summary: extractSummary(toolName, opName, toolDescription, null),
      backend: backends,
      auth,
    });
  };

  if (switchNode) {
    for (const clause of switchNode.caseBlock.clauses) {
      if (!ts.isCaseClause(clause)) continue;
      const actionName = getStringLiteralValue(clause.expression);
      if (!actionName) continue;
      buildOperation(actionName, clause);
    }
    return operations;
  }

  const actionIfs = [];
  function visitIf(node) {
    if (ts.isIfStatement(node)) {
      const exprText = node.expression.getText(sourceFile);
      const directMatch =
        exprText.match(/\.action\s*===\s*'([^']+)'/) ??
        exprText.match(/'([^']+)'\s*===\s*[^)\s]+\.action/);
      if (directMatch?.[1]) {
        actionIfs.push({ action: directMatch[1], node: node.thenStatement });
      }
    }
    ts.forEachChild(node, visitIf);
  }
  visitIf(executeNode);
  if (actionIfs.length > 0) {
    for (const item of actionIfs) buildOperation(item.action, item.node);
    return operations;
  }

  const schemaActions = collectSchemaActionLiterals(sourceFile.text);
  if (schemaActions.length > 1) {
    for (const action of schemaActions) {
      operations.push(
        {
          name: action,
          summary: extractSummary(toolName, action, toolDescription, null),
          backend: extractSchemaFallbackBackends(toolName, action, sourceFile.text, sourceText, functionTextMap),
          auth:
            inferAuthFromText(sourceFile.text) ??
            legacyTool?.auth ??
            'user',
        },
      );
    }
    return operations;
  }

  const actionKeys = collectActionKeysFromText(sourceText)
    .filter((key) => key.startsWith(`${toolName}.`))
    .map((key) => key.slice(toolName.length + 1));
  const opName =
    actionKeys.find((name) => name !== 'default') ??
    DEFAULT_OPERATION_NAME_OVERRIDES[toolName] ??
    'default';
  buildOperation(opName, executeNode);
  return operations;
}

function extractMcpOperation(configNode, sourceFile, toolName, legacyTool, constMap) {
  const toolActionKey = getStringLiteralValue(getObjectProperty(configNode, 'toolActionKey'), constMap);
  const mcpToolName = getStringLiteralValue(getObjectProperty(configNode, 'mcpToolName'), constMap);
  const description = getStringLiteralValue(getObjectProperty(configNode, 'description'), constMap) ?? '';
  const actionSuffix = toolActionKey?.startsWith(`${toolName}.`) ? toolActionKey.slice(toolName.length + 1) : null;
  const opName =
    (actionSuffix && actionSuffix !== 'default' ? actionSuffix : null) ??
    DEFAULT_OPERATION_NAME_OVERRIDES[toolName] ??
    actionSuffix ??
    'default';
  return [
    {
      name: opName,
      summary: extractSummary(toolName, opName, description, null),
      backend: mcpToolName ? [`MCP:${mcpToolName}`] : [],
      auth: inferAuthFromText(sourceFile.text) ?? legacyTool?.auth ?? 'user',
    },
  ];
}

function extractToolRecord(filePath, sourceFile, constMap, functionTextMap, callNode, legacyTools) {
  const relPath = path.relative(ROOT, filePath).split(path.sep).join('/');
  const args = callNode.arguments;
  const expr = callNode.expression;
  const callee =
    ts.isIdentifier(expr) ? expr.text : ts.isPropertyAccessExpression(expr) && ts.isIdentifier(expr.name) ? expr.name.text : null;

  if (callee === 'registerMcpTool') {
    const configNode = args[1];
    if (!configNode || !ts.isObjectLiteralExpression(configNode)) return null;
    const toolName = getStringLiteralValue(getObjectProperty(configNode, 'name'), constMap);
    if (!toolName?.startsWith('feishu_')) return null;
    const legacyTool = legacyTools.get(toolName);
    return {
      tool: toolName,
      category: getToolCategory(relPath, toolName, legacyTool),
      transport: getTransport(relPath, legacyTool),
      source: relPath,
      operations: extractMcpOperation(configNode, sourceFile, toolName, legacyTool, constMap),
    };
  }

  const toolNode = args[1] ?? args[0];
  if (!toolNode || !ts.isObjectLiteralExpression(toolNode)) return null;
  const toolName = getStringLiteralValue(getObjectProperty(toolNode, 'name'), constMap);
  if (!toolName?.startsWith('feishu_')) return null;

  const description = getStringLiteralValue(getObjectProperty(toolNode, 'description'), constMap) ?? '';
  const executeNode = getObjectProperty(toolNode, 'execute');
  if (
    !executeNode ||
    (!ts.isFunctionExpression(executeNode) && !ts.isArrowFunction(executeNode) && !ts.isMethodDeclaration(executeNode))
  ) {
    return null;
  }

  const legacyTool = legacyTools.get(toolName);
  return {
    tool: toolName,
    category: getToolCategory(relPath, toolName, legacyTool),
    transport: getTransport(relPath, legacyTool),
    source: relPath,
    operations: extractOperationsFromRegisterTool(
      sourceFile,
      toolName,
      description,
      executeNode,
      legacyTool,
      functionTextMap,
    ),
  };
}

function buildTools() {
  const legacyTools = new Map();

  const tools = [];
  for (const filePath of walkFiles(TOOLS_ROOT)) {
    const basename = path.basename(filePath);
    if (basename === 'index.ts' || basename === 'helpers.ts' || basename === 'sdk-types.ts' || basename === 'auth-policy.ts') {
      continue;
    }
    const sourceText = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const constMap = buildStringConstMap(sourceFile);
    const functionTextMap = buildFunctionTextMap(sourceFile);
    for (const callNode of collectRegisterCalls(sourceFile)) {
      const record = extractToolRecord(filePath, sourceFile, constMap, functionTextMap, callNode, legacyTools);
      if (!record) continue;
      if (record.operations.length === 1 && record.operations[0].name === 'default' && DEFAULT_OPERATION_NAME_OVERRIDES[record.tool]) {
        const opName = DEFAULT_OPERATION_NAME_OVERRIDES[record.tool];
        record.operations[0].name = opName;
      }
      const authModes = Array.from(new Set(record.operations.map((op) => op.auth))).sort();
      record.auth = authModes.length === 1 ? authModes[0] : authModes[0] ?? 'user';
      record.operationAuthModes = authModes;
      record.hasMixedOperationAuth = authModes.length > 1;
      tools.push(record);
    }
  }

  if (!tools.some((tool) => tool.tool === 'feishu_ask_user_question')) {
    const filePath = path.join(TOOLS_ROOT, 'ask-user-question.ts');
    const sourceText = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const constMap = buildStringConstMap(sourceFile);
    const functionTextMap = buildFunctionTextMap(sourceFile);
    for (const callNode of collectRegisterCalls(sourceFile)) {
      const record = extractToolRecord(filePath, sourceFile, constMap, functionTextMap, callNode, legacyTools);
      if (record?.tool !== 'feishu_ask_user_question') continue;
      if (record.operations.length === 1 && record.operations[0].name === 'default' && DEFAULT_OPERATION_NAME_OVERRIDES[record.tool]) {
        const opName = DEFAULT_OPERATION_NAME_OVERRIDES[record.tool];
        record.operations[0].name = opName;
      }
      const authModes = Array.from(new Set(record.operations.map((op) => op.auth))).sort();
      record.auth = authModes.length === 1 ? authModes[0] : authModes[0] ?? 'user';
      record.operationAuthModes = authModes;
      record.hasMixedOperationAuth = authModes.length > 1;
      tools.push(record);
      break;
    }
  }

  tools.sort((left, right) => left.tool.localeCompare(right.tool));
  return { tools };
}

function extractCommands() {
  const sourceText = fs.readFileSync(COMMANDS_INDEX, 'utf8');
  const sourceFile = ts.createSourceFile(COMMANDS_INDEX, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const constMap = buildStringConstMap(sourceFile);
  const commands = [];
  const seen = new Set();

  const add = (command, summary) => {
    if (!command || seen.has(command)) return;
    seen.add(command);
    commands.push({
      command,
      source: path.relative(ROOT, COMMANDS_INDEX).split(path.sep).join('/'),
      summary: summary || `Command \`${command}\` exposed by the plugin.`,
    });
  };

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.name) &&
      node.expression.name.text === 'registerCommand'
    ) {
      const [configNode] = node.arguments;
      if (configNode && ts.isObjectLiteralExpression(configNode)) {
        const name = getStringLiteralValue(getObjectProperty(configNode, 'name'), constMap);
        const description = getStringLiteralValue(getObjectProperty(configNode, 'description'), constMap);
        if (name) add(`/${name}`, description);
        if (name === 'feishu') {
          const handlerNode = getObjectProperty(configNode, 'handler');
          const handlerText = handlerNode ? getNodeText(sourceFile, handlerNode) : '';
          const subcommands = new Set([...handlerText.matchAll(/subcommand === '([^']+)'/g)].map((match) => match[1]));
          if (subcommands.has('auth')) add('/feishu auth', 'Batch authorize user permissions via the unified command.');
          if (subcommands.has('onboarding')) add('/feishu onboarding', 'Alias of `/feishu auth`.');
          if (subcommands.has('doctor')) add('/feishu doctor', 'Run Feishu diagnostics via the unified command.');
          if (subcommands.has('start')) add('/feishu start', 'Validate plugin configuration via the unified command.');
          if (/\/feishu help\b/.test(sourceText)) add('/feishu help', 'Show help for the unified Feishu command.');
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  commands.sort((left, right) => left.command.localeCompare(right.command));
  return commands;
}

function buildPayload() {
  const apiIndex = loadServerApiIndex();
  const { tools } = buildTools();
  let officialOperationCount = 0;
  let nonOfficialOperationCount = 0;

  for (const tool of tools) {
    for (const operation of tool.operations) {
      const links = [];
      for (const backend of operation.backend) {
        links.push(...buildLinksForBackend(backend, apiIndex));
      }
      if (links.length > 0) operation.officialLinks = links;
      operation.backendKind = classifyBackendKind(operation.backend);
      operation.officialCoverage = links.length > 0 ? 'official' : 'non-official';
      if (operation.officialCoverage === 'official') officialOperationCount += 1;
      else nonOfficialOperationCount += 1;
    }
    const authModes = Array.from(new Set(tool.operations.map((op) => op.auth))).sort();
    tool.auth = authModes.length === 1 ? authModes[0] : authModes[0] ?? 'user';
    tool.operationAuthModes = authModes;
    tool.hasMixedOperationAuth = authModes.length > 1;
  }

  const operationCount = tools.reduce((sum, tool) => sum + tool.operations.length, 0);
  const commands = extractCommands();

  return {
    generatedAt: new Date().toISOString(),
    scope: {
      included: 'Registered Feishu-facing tools and chat commands exposed by the plugin entrypoint.',
      excluded: 'Internal helper functions and lower-level channel/outbound APIs not directly registered as tools or commands.',
    },
    semantics: {
      auth: 'Code-derived declared execution mode observed from repository source; not the final official auth contract.',
      officialCoverage: 'Whether the declared backend can be linked to an official Feishu API/MCP reference.',
    },
    references: {
      serverApiList: 'docs/references/feishu-server-api-list.json',
      mcpRemoteDoc: 'docs/references/feishu-mcp-remote-server.md',
      mcpRemoteDocUrl: MCP_REMOTE_DOC_URL,
    },
    totals: {
      toolCount: tools.length,
      operationCount,
      commandCount: commands.length,
      officialOperationCount,
      nonOfficialOperationCount,
    },
    tools,
    commands,
  };
}

function renderMarkdown(payload) {
  const lines = [];
  lines.push('# Feishu Supported Operations');
  lines.push('');
  lines.push('This file enumerates the Feishu-facing tool and command surface currently exposed by this repository.');
  lines.push('');
  lines.push('Auth values in this file are code-derived declared modes, not the final official auth contract.');
  lines.push('Use canonical/runtime metadata for official auth and scope decisions.');
  lines.push('');
  lines.push('## Scope');
  lines.push('');
  lines.push(`- Included: ${payload.scope.included}`);
  lines.push(`- Excluded: ${payload.scope.excluded}`);
  lines.push(`- Auth semantics: ${payload.semantics.auth}`);
  lines.push(`- Coverage semantics: ${payload.semantics.officialCoverage}`);
  lines.push('');
  lines.push('## Totals');
  lines.push('');
  lines.push(`- Tools: ${payload.totals.toolCount}`);
  lines.push(`- Operations: ${payload.totals.operationCount}`);
  lines.push(`- Official operations: ${payload.totals.officialOperationCount}`);
  lines.push(`- Non-official operations: ${payload.totals.nonOfficialOperationCount}`);
  lines.push(`- Chat commands: ${payload.totals.commandCount}`);
  lines.push('');
  lines.push('## Tools');
  lines.push('');
  lines.push('| Tool | Category | Transport | Auth | Operations | Source |');
  lines.push('|---|---|---|---|---:|---|');
  for (const tool of payload.tools) {
    const toolAuthLabel = tool.hasMixedOperationAuth ? `${tool.auth} (mixed by operation)` : tool.auth;
    lines.push(
      `| \`${tool.tool}\` | ${tool.category} | ${tool.transport} | ${toolAuthLabel} | ${tool.operations.length} | \`${tool.source}\` |`,
    );
  }
  lines.push('');
  for (const tool of payload.tools) {
    lines.push(`### \`${tool.tool}\``);
    lines.push('');
    lines.push(`- Category: \`${tool.category}\``);
    lines.push(`- Transport: \`${tool.transport}\``);
    lines.push(`- Auth: \`${tool.auth}\``);
    if (tool.hasMixedOperationAuth) {
      lines.push(`- Operation auth modes: ${tool.operationAuthModes.map((auth) => `\`${auth}\``).join(', ')}`);
    }
    lines.push(`- Source: \`${tool.source}\``);
    lines.push('');
    lines.push('| Operation | Auth | Backend Kind | Coverage | Summary | Backend | Official Docs |');
    lines.push('|---|---|---|---|---|---|---|');
    for (const op of tool.operations) {
      const backend = op.backend.length > 0 ? op.backend.join('<br>') : '-';
      const links =
        op.officialLinks?.map((link) => `[${link.name ?? link.label}](${link.url})`).join('<br>') ?? '-';
      lines.push(
        `| \`${op.name}\` | \`${op.auth}\` | \`${op.backendKind}\` | \`${op.officialCoverage}\` | ${op.summary} | \`${backend}\` | ${links || '-'} |`,
      );
    }
    lines.push('');
  }
  lines.push('## Chat Commands');
  lines.push('');
  lines.push('| Command | Summary | Source |');
  lines.push('|---|---|---|');
  for (const command of payload.commands) {
    lines.push(`| \`${command.command}\` | ${command.summary} | \`${command.source}\` |`);
  }
  lines.push('');
  lines.push('## References');
  lines.push('');
  lines.push(`- \`${payload.references.serverApiList}\``);
  lines.push(`- \`${payload.references.mcpRemoteDoc}\``);
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function normalizePayloadForComparison(payload) {
  if (!payload) return null;
  const clone = structuredClone(payload);
  delete clone.generatedAt;
  return clone;
}

function main() {
  const payload = buildPayload();
  const jsonText = `${JSON.stringify(payload, null, 2)}\n`;
  const mdText = renderMarkdown(payload);
  const check = process.argv.includes('--check');

  if (check) {
    const currentJson = readJsonIfExists(OUT_JSON);
    const currentMd = fs.existsSync(OUT_MD) ? fs.readFileSync(OUT_MD, 'utf8') : null;
    const changed = [];
    if (JSON.stringify(normalizePayloadForComparison(currentJson)) !== JSON.stringify(normalizePayloadForComparison(payload))) {
      changed.push(path.relative(ROOT, OUT_JSON));
    }
    if (currentMd !== mdText) {
      changed.push(path.relative(ROOT, OUT_MD));
    }
    if (changed.length > 0) {
      console.error('feishu supported-operations artifacts are out of date:');
      for (const item of changed) console.error(`- ${item}`);
      process.exitCode = 1;
      return;
    }
    console.log('feishu supported-operations artifacts are up to date');
    return;
  }

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, jsonText);
  fs.writeFileSync(OUT_MD, mdText);
  console.log(`wrote ${path.relative(ROOT, OUT_JSON)}`);
  console.log(`wrote ${path.relative(ROOT, OUT_MD)}`);
}

main();
