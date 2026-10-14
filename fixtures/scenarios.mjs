// All text is newly authored synthetic material. `design` is NOT an API DTO.
const message = (sequence, role, content) => ({ sequence, role, content, revision: 1, turn: Math.ceil(sequence / 2) });
const story = [message(0, 'assistant', '你来到一座尚未命名的小镇。广场上的钟停在正午。'), message(1, 'user', '查看钟楼入口。'), message(2, 'assistant', '入口半开着，门内传来轻轻的翻页声。你可以敲门，也可以先观察四周。')];
const state = overrides => ({ cardId: 'synthetic-card', sessionId: 'synthetic-chat', openingId: 'arrival', playerName: '旅人', messages: structuredClone(story), busy: false, currentTurn: 1, displayExecutionId: null, ...overrides });
export const card = {
  id: 'synthetic-card', name: '合成测试：无名小镇', defaultOpening: 'arrival',
  openings: [{ id: 'arrival', title: '抵达小镇', content: story[0].content }],
};
export const scenarios = [
  { id: 'empty', features: ['F01', 'F02'], title: '未开始', state: state({ messages: [], sessionId: null, openingId: null, currentTurn: 0 }), design: { task: '浏览卡和开场，不创建会话。', cards: [{ id: card.id, name: card.name, launchable: true, cover: false }, { id: 'unavailable-card', name: '未打包的合成卡', launchable: false, cover: false }] } },
  { id: 'ready', features: ['F03'], title: '等待下一步行动', state: state({}), design: { task: '阅读正文并表达行动。' } },
  { id: 'busy', features: ['F03', 'F10'], title: '生成进行中', state: state({ busy: true }), design: { task: '解释等待状态，防止重复输入；不虚构百分比进度。' } },
  { id: 'blocked', features: ['F10'], title: '工作流阻断', state: state({ busy: false, blockingWorkflows: [{ id: 'synthetic-workflow', reason: '等待用户处理测试配置' }] }), design: { task: '显示可理解原因，按服务授权提供恢复入口。', note: 'blockingWorkflows 元素为合成示意，真实领域字段待确认。' } },
  { id: 'failed', features: ['F03', 'F10'], title: '回合失败', state: state({ lastTurnFailure: { message: '合成服务暂时不可用' } }), design: { task: '保留输入和正文，区分失败与仍在运行。', note: '失败详情字段需真实服务确认。' } },
  { id: 'long-story', features: ['F03', 'F06'], title: '长文与阅读偏好', state: state({ messages: [message(0, 'assistant', Array.from({ length: 80 }, (_, i) => `第 ${i + 1} 段：街道延伸向远处，旅人记录下沿途的声音与细节。`).join('\n\n'))] }), design: { task: '长文本阅读、字号、窄屏和键盘操作。', preferences: { fontSize: 18, reducedMotion: true } } },
  { id: 'conflict', features: ['F04'], title: '编辑冲突', state: state({ messages: story.map(m => ({ ...m, revision: 2 })) }), design: { task: '以 expectedRevision=1 编辑 sequence=2 会冲突；保留草稿。', draft: '门后有人正在阅读一封信。', draftRevision: 1 } },
  { id: 'candidates', features: ['F05'], title: '候选比较', state: state({}), design: { task: '两客户端独立预览，采用才修改权威。此处不是 narrative-attempts API。', choices: [{ label: '候选甲', text: '屋内是一位修钟匠。' }, { label: '候选乙', text: '屋内的桌上放着一本旧日记。' }] } },
  { id: 'modules', features: ['F07', 'F12'], title: '模块与资源', state: state({}), design: { task: '记录分页、布尔设置、可选 renderer 不支持、图像失效；使用真实 binding 定义后再接入。', cases: ['空列表', '长列表', '受限字段', '设置冲突', '图片加载失败', '可选区域不可显示'] } },
  { id: 'configuration', features: ['F08', 'F09'], title: '配置与团队', state: state({}), design: { task: '创建测试 profile，选择模型和 Agent，配置团队协作与工作流，保留无效输入并指出原因。', cases: ['没有模型', '发现失败', '密钥未设置', '运行实例仍使用旧配置快照', '导出排除密钥'] } },
  { id: 'diagnostics', features: ['F10', 'F11'], title: '运行与调用诊断', state: state({}), design: { task: '当前运行、历史调用、工具记录和团队记录分层呈现；费用记录不完整时明确说明。', cases: ['仍在运行', '允许恢复', '已终止不可原地重试', '调用详情很长', '用量记录缺失'] } },
  { id: 'libraries', features: ['F13'], title: '资料库与历史检索', state: state({}), design: { task: '明确动作构建索引，显示状态和失败；刷新不产生任务。', cases: ['目录未设置', '服务不可达', '构建中', '取消后可恢复', '空检索结果'] } },
  { id: 'extension', features: ['F14'], title: '扩展宿主恢复', state: state({}), design: { task: '用全新合成插件测试加载失败、重挂载、管理往返、沉浸与卸载。', cases: ['入口不存在', 'mount 抛错', '上下文切换', '窗口改变', '恢复官方界面'] } },
];
export function getScenario(id) {
  const value = scenarios.find(item => item.id === id);
  if (!value) throw new Error(`Unknown synthetic scenario: ${id}`);
  return structuredClone(value);
}
