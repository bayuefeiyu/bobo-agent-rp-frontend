import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { operations } from '../packages/rp-web-contract/operations.mjs';
import { mockCapabilities } from './mock-service.mjs';

export function renderInventory() {
  const rows = operations.map(operation => {
    const core = operation.responseSchema && operation.responseSchema !== 'JsonObject';
    const mock = Object.entries(mockCapabilities).filter(([, ids]) => ids.includes(operation.id)).map(([mode]) => mode).join(', ') || '未模拟';
    return `| ${operation.id} | ${operation.method} ${operation.path} | ${operation.requestSchema || '—'} | ${operation.responseSchema || operation.response} | ${operation.configAuth ? '是' : '否'} | ${mock} | ${core ? '核心 schema；领域可选字段仍需确认' : '补充字段、例子及失败语义'} |`;
  });
  return `# 逐接口联调清单\n\n由 npm run contract:inventory 从固定公开契约生成；共 ${operations.length} 项。\n\n所有项目初始真实联调状态为**待验证**，模拟支持不等于真实验证。JsonObject 和未声明 schema 的返回不是完整 DTO；二进制还需核对 MIME/资源语义。请求为 JsonObject 时也需确认所有字段、限制与默认值。capabilities 以实际 connection 为准。SDK 便捷方法不是完整操作集合，其余使用 client.request()。\n\n不得仅根据该目录猜出复杂管理界面的数据模型。优先向后端维护者索取：profile/model/agent/workflow catalog 与配置保存 DTO；运行实例/调用/团队记录 DTO；模块 v3 binding 及设置回执；候选选择 revision 与历史；图像请求、恢复与资源；资料库/历史检索任务。所有补充按操作 ID 记录在 DELIVERY-RECORD.md，配合合成测试后端确认。\n\n| 操作 ID | 方法/路径 | 请求 schema | 响应 schema/格式 | 配置认证 | 当前模拟支持 | 交接待办 |\n| --- | --- | --- | --- | --- | --- | --- |\n${rows.join('\n')}\n`;
}
export async function inventory({ check = false } = {}) {
  const path = fileURLToPath(new URL('../docs/API-COVERAGE.md', import.meta.url));
  const expected = renderInventory();
  if (check) { if (await readFile(path, 'utf8') !== expected) throw new Error('API inventory is stale.'); }
  else await writeFile(path, expected);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await inventory({ check: process.argv.includes('--check') });
