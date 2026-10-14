# 逐接口联调清单

由 npm run contract:inventory 从固定公开契约生成；共 97 项。

所有项目初始真实联调状态为**待验证**，模拟支持不等于真实验证。JsonObject 和未声明 schema 的返回不是完整 DTO；二进制还需核对 MIME/资源语义。请求为 JsonObject 时也需确认所有字段、限制与默认值。capabilities 以实际 connection 为准。SDK 便捷方法不是完整操作集合，其余使用 client.request()。

不得仅根据该目录猜出复杂管理界面的数据模型。优先向后端维护者索取：profile/model/agent/workflow catalog 与配置保存 DTO；运行实例/调用/团队记录 DTO；模块 v3 binding 及设置回执；候选选择 revision 与历史；图像请求、恢复与资源；资料库/历史检索任务。所有补充按操作 ID 记录在 DELIVERY-RECORD.md，配合合成测试后端确认。

| 操作 ID | 方法/路径 | 请求 schema | 响应 schema/格式 | 配置认证 | 当前模拟支持 | 交接待办 |
| --- | --- | --- | --- | --- | --- | --- |
| connection | GET /api/v1/connection | — | Connection | 否 | play, launcher | 核心 schema；领域可选字段仍需确认 |
| frontend | GET /api/v1/frontend | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.card | GET /api/v1/card | — | JsonObject | 否 | play | 补充字段、例子及失败语义 |
| get.state | GET /api/v1/state | — | State | 否 | play | 核心 schema；领域可选字段仍需确认 |
| get.narrative-attempts | GET /api/v1/narrative-attempts | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.narrative-attempts.regenerate | POST /api/v1/narrative-attempts/regenerate | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.narrative-attempts.attemptId.history | GET /api/v1/narrative-attempts/:attemptId/history | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.narrative-attempts.attemptId.adopt | POST /api/v1/narrative-attempts/:attemptId/adopt | AdoptRequest | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| put.narrative-attempts.attemptId | PUT /api/v1/narrative-attempts/:attemptId | RevisionRequest | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.transcript | GET /api/v1/transcript | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.sessions | GET /api/v1/sessions | — | json | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.opening | POST /api/v1/opening | JsonObject | JsonObject | 否 | play | 补充字段、例子及失败语义 |
| post.input | POST /api/v1/input | InputRequest | JsonObject | 否 | play | 补充字段、例子及失败语义 |
| post.resume | POST /api/v1/resume | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.messages.sequence.history | GET /api/v1/messages/:sequence/history | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| put.messages.sequence | PUT /api/v1/messages/:sequence | RevisionRequest | JsonObject | 否 | play | 补充字段、例子及失败语义 |
| delete.messages.sequence | DELETE /api/v1/messages/:sequence | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| delete.sessions.sessionId | DELETE /api/v1/sessions/:sessionId | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.cards | GET /api/v1/cards | — | json | 否 | launcher | 补充字段、例子及失败语义 |
| get.cards.cardId.cover | GET /api/v1/cards/:cardId/cover | — | binary | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.settings | GET /api/v1/settings | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.user-avatar | GET /api/v1/user-avatar | — | binary | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.user-avatar | POST /api/v1/user-avatar | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.user-settings | POST /api/v1/user-settings | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| delete.user-profile | DELETE /api/v1/user-profile | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.card-switch | POST /api/v1/card-switch | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.system-settings | POST /api/v1/system-settings | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.module-display-settings | POST /api/v1/module-display-settings | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.config.context | GET /api/v1/config/context | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.config.catalog | GET /api/v1/config/catalog | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.config.reference-library | GET /api/v1/config/reference-library | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.config.reference-library.directories | POST /api/v1/config/reference-library/directories | JsonObject | JsonObject | 是 | 未模拟 | 补充字段、例子及失败语义 |
| get.config.narrative-history.config | GET /api/v1/config/narrative-history/config | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.config.narrative-history.status | GET /api/v1/config/narrative-history/status | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| put.config.narrative-history.config | PUT /api/v1/config/narrative-history/config | JsonObject | JsonObject | 是 | 未模拟 | 补充字段、例子及失败语义 |
| post.config.narrative-history.test | POST /api/v1/config/narrative-history/test | JsonObject | JsonObject | 是 | 未模拟 | 补充字段、例子及失败语义 |
| get.config.reference-library.semantic.config | GET /api/v1/config/reference-library/semantic/config | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.config.reference-library.semantic.status | GET /api/v1/config/reference-library/semantic/status | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| put.config.reference-library.semantic.config | PUT /api/v1/config/reference-library/semantic/config | JsonObject | JsonObject | 是 | 未模拟 | 补充字段、例子及失败语义 |
| post.config.reference-library.semantic.test | POST /api/v1/config/reference-library/semantic/test | JsonObject | JsonObject | 是 | 未模拟 | 补充字段、例子及失败语义 |
| post.config.reference-library.semantic.query | POST /api/v1/config/reference-library/semantic/query | JsonObject | JsonObject | 是 | 未模拟 | 补充字段、例子及失败语义 |
| post.config.reference-library.semantic.jobs | POST /api/v1/config/reference-library/semantic/jobs | JsonObject | JsonObject | 是 | 未模拟 | 补充字段、例子及失败语义 |
| post.config.reference-library.semantic.jobs.jobId.cancel | POST /api/v1/config/reference-library/semantic/jobs/:jobId/cancel | JsonObject | JsonObject | 是 | 未模拟 | 补充字段、例子及失败语义 |
| post.config.reference-library.semantic.jobs.jobId.resume | POST /api/v1/config/reference-library/semantic/jobs/:jobId/resume | JsonObject | JsonObject | 是 | 未模拟 | 补充字段、例子及失败语义 |
| put.config.reference-library | PUT /api/v1/config/reference-library | JsonObject | JsonObject | 是 | 未模拟 | 补充字段、例子及失败语义 |
| get.config.profiles | GET /api/v1/config/profiles | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.config.profiles | POST /api/v1/config/profiles | JsonObject | JsonObject | 是 | 未模拟 | 补充字段、例子及失败语义 |
| post.config.import | POST /api/v1/config/import | JsonObject | JsonObject | 是 | 未模拟 | 补充字段、例子及失败语义 |
| get.config.profiles.profileId.export | GET /api/v1/config/profiles/:profileId/export | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.config.profiles.profileId.rename | POST /api/v1/config/profiles/:profileId/rename | JsonObject | JsonObject | 是 | 未模拟 | 补充字段、例子及失败语义 |
| post.config.profiles.profileId.duplicate | POST /api/v1/config/profiles/:profileId/duplicate | JsonObject | JsonObject | 是 | 未模拟 | 补充字段、例子及失败语义 |
| post.config.profiles.profileId.activate | POST /api/v1/config/profiles/:profileId/activate | JsonObject | JsonObject | 是 | 未模拟 | 补充字段、例子及失败语义 |
| put.config.profiles.profileId.secrets.models.modelId | PUT /api/v1/config/profiles/:profileId/secrets/models/:modelId | JsonObject | JsonObject | 是 | 未模拟 | 补充字段、例子及失败语义 |
| get.config.profiles.profileId | GET /api/v1/config/profiles/:profileId | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| put.config.profiles.profileId | PUT /api/v1/config/profiles/:profileId | JsonObject | JsonObject | 是 | 未模拟 | 补充字段、例子及失败语义 |
| delete.config.profiles.profileId | DELETE /api/v1/config/profiles/:profileId | — | JsonObject | 是 | 未模拟 | 补充字段、例子及失败语义 |
| get.image-generation | GET /api/v1/image-generation | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| put.image-generation.preferences | PUT /api/v1/image-generation/preferences | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.image-generation.run | POST /api/v1/image-generation/run | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.image-generation.requests.requestId.recover | POST /api/v1/image-generation/requests/:requestId/recover | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.image-generation.connections | GET /api/v1/image-generation/connections | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.image-generation.connections | POST /api/v1/image-generation/connections | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| delete.image-generation.connections.connectionId | DELETE /api/v1/image-generation/connections/:connectionId | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.image-generation.connections.connectionId.test | POST /api/v1/image-generation/connections/:connectionId/test | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| put.image-generation.profiles.profileId.override | PUT /api/v1/image-generation/profiles/:profileId/override | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.image-generation.profiles.profileId.open | POST /api/v1/image-generation/profiles/:profileId/open | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.image-generation.renders.renderId.images.index | GET /api/v1/image-generation/renders/:renderId/images/:index | — | binary | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.image-generation.renders.renderId.regenerate | POST /api/v1/image-generation/renders/:renderId/regenerate | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.modules | GET /api/v1/modules | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.data-impact | GET /api/v1/data-impact | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.modules.moduleId.open | POST /api/v1/modules/:moduleId/open | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.modules.moduleId.bindings.bindingId.records | GET /api/v1/modules/:moduleId/bindings/:bindingId/records | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.modules.moduleId.bindings.bindingId.records.recordId.history | GET /api/v1/modules/:moduleId/bindings/:bindingId/records/:recordId/history | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.modules.moduleId.bindings.bindingId.stories.recordId | GET /api/v1/modules/:moduleId/bindings/:bindingId/stories/:recordId | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.modules.moduleId.bindings.bindingId.stories.recordId.open-source | POST /api/v1/modules/:moduleId/bindings/:bindingId/stories/:recordId/open-source | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.modules.moduleId.bindings.bindingId.settings | GET /api/v1/modules/:moduleId/bindings/:bindingId/settings | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| put.modules.moduleId.bindings.bindingId.settings | PUT /api/v1/modules/:moduleId/bindings/:bindingId/settings | SettingsRequest | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.modules.moduleId.bindings.bindingId.integrity | GET /api/v1/modules/:moduleId/bindings/:bindingId/integrity | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.modules.moduleId.bindings.bindingId.workflows.workflowId.run | POST /api/v1/modules/:moduleId/bindings/:bindingId/workflows/:workflowId/run | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.models | GET /api/v1/models | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.models.discover | POST /api/v1/models/discover | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.models.test | POST /api/v1/models/test | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.agents | GET /api/v1/agents | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.workflows | GET /api/v1/workflows | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.workflow-runs | GET /api/v1/workflow-runs | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.workflow-runs.runId.reexecute | POST /api/v1/workflow-runs/:runId/reexecute | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.workflow-runs.runId.nodes.nodeId.process-record | GET /api/v1/workflow-runs/:runId/nodes/:nodeId/process-record | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.workflow-runs.runId.nodes.nodeId.process-record.open | POST /api/v1/workflow-runs/:runId/nodes/:nodeId/process-record/open | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.workflow-runs.runId.nodes.nodeId.team-transcript.open | POST /api/v1/workflow-runs/:runId/nodes/:nodeId/team-transcript/open | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.workflow-policy | GET /api/v1/workflow-policy | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.workflows.workflowId.activate | POST /api/v1/workflows/:workflowId/activate | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.workflow-runs.runId.nodes.nodeId.retry | POST /api/v1/workflow-runs/:runId/nodes/:nodeId/retry | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.workflow-runs.runId.nodes.nodeId.recover | POST /api/v1/workflow-runs/:runId/nodes/:nodeId/recover | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.workflow-runs.runId.cancel | POST /api/v1/workflow-runs/:runId/cancel | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.workflow-runs.runId.skip | POST /api/v1/workflow-runs/:runId/skip | JsonObject | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| get.module-operation | GET /api/v1/modules/:moduleId/bindings/:bindingId/operations/:operationId | — | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
| post.launch | POST /api/v1/launch | LaunchRequest | JsonObject | 否 | 未模拟 | 补充字段、例子及失败语义 |
