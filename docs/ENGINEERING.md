# 工程与联调

## 固定协议与独立开发

UPSTREAM.json 固定上游提交、版本和十个允许复制的公开文件哈希。本仓库没有原项目后台实现，也没有旧官方前端。packages/rp-web-client/presentation-host.mjs 仅处理生命周期和导航回调，不包含产品布局。升级协议由维护者提供新的允许文件和来源记录，不能让前端开发者去读旧 UI 猜业务。

当前使用原生 ES 模块和 Node 内置工具，无第三方安装需求。这只是可替换的工程起点，不代表技术选型结论。采用 React/Vue 等框架后仍需保持 SDK/业务适配/展示组件分离，并提交锁文件和构建说明。

## 三种后端环境

| 环境 | 启动与验证 |
| --- | --- |
| 模拟 play | npm run dev；公开 API 子集，内存数据，重启丢失 |
| 模拟 launcher | npm run dev:launcher；列出合成卡，launch 明确不支持，不启动进程 |
| 真实测试后端 | --backend=http://127.0.0.1:PORT；维护者提供合成卡运行时或启动器，能力以 connection 为准 |

`--service=play`（默认）或 `--service=launcher` 描述连接目标。在真实模式启动前会读取 connection 并检查目标模式；play 接受 play/development。`--port=0` 使用随机端口。只允许显式本机 HTTP origin，不允许路径、查询、认证信息或远程服务。代理不自动发现或连接其他端口。

一个开发服务器绑定一个后端 origin。开发期可启动两台开发服务器分别连接启动器与单卡服务，SDK 始终使用当前 origin，保持 /api/v1 根路由和同源约束。不伪造已经存在统一网关。

## 认证和资源

先 `createRpClient({baseUrl: location.origin})` 并 `connect()`；connection 声明版本、能力、readContext 和认证约定。实际命令能力不足时降级，不能因操作在目录出现就认定当前服务支持。

管理写入使用 connection.authentication.configHeader（当前 x-rp-config-token），token 从公开 config/context 获取；保留在内存，不写 URL、日志、快照或导出。令牌随后端/上下文变化重新获取。SDK 的 auth 回调适合注入请求头。

真实启动器目前只在 GET / 时设置 HttpOnly 会话 cookie。独立开发代理在**明确 launcher 模式启动时**读取该响应的 cookie，在服务端内存保留；响应正文被丢弃，不保存或转发旧 HTML。前端不读取 cookie。启动器重启后重新启动开发代理。此为本地联调桥接，不是生产认证方案。

launch 返回新的单卡 origin 与 warnings。不要直接导航返回 origin 的根页面，否则将进入旧 UI；由维护者据返回地址重新启动/配置 play 开发代理。自动连接新端口与整套正式部署的映射需在集成阶段确定。Pi 版本不一致只提示；实际启动失败仍报错。

代理允许公开 API 的 JSON 与声明的二进制资源，拒绝 HTML 响应和上游重定向。旧静态页面、/platform/、/vendor/ 或任意路径不能穿过代理。自定义游玩包的静态资源在本仓库内通过指定资产部署开发；真实包的资产集成由维护者负责，不能开放代理所有旧静态文件。

资源使用 SDK resourceUrl/loadResource，卸载释放对象 URL，不使用后端磁盘路径。任意 URL 资源不能当作公开 API。

## 上下文与写操作

readContext = serverInstanceId/cardId/chatId/executionId。SDK 实例拥有独立上下文；缓存用 cacheKey 分隔。恢复聊天、选择开场或其他命令返回新上下文时，SDK 更新上下文并取消旧请求。迟到结果不可写进新界面。候选 preview 只改变实例的读取投影；采用是领域写入。

watch 的首次或重置读取为 snapshot，后续变化为 change；它是轮询而非事件日志。不能把 snapshot 作为新故事事件触发写操作。保持幂等 UI，停止订阅并释放资源。

写操作失败需要区别：权限/校验错误、revision_conflict、session_changed、preview_read_only、operation_outcome_unknown。结果未知时保留原 ID 与草稿并查询领域权威状态。模块 settings 有 operation 回执路由；不能推断其他命令同样有回执。不自动更换 ID 重发。

## 可替换游玩区域契约

新官方应用需要实现宿主，而不必自身成为一个插件。公开宿主入口：

```js
export async function mount({ container, client, signal, context, assetUrl, host }) {
  // 在 container 中创建插件自有内容；client 是独立实例。
  return {
    unmount() {},
    onContext(context) {},
    onVisibility(visible) {},
    onResize(size) {},
    onConnection(connection) {},
  };
}
```

host.openManagement(panel) 接受 story/user/system/workflows/profiles/tokens；它们是公开语义键，新官方应用可映射到任意信息架构。host.returnToPlay() 返回游玩，host.immersive(boolean) 请求布局。官方管理和恢复控件位于插件之外；卸载、切换和加载失败需要清理/回退。首版同源受信任代码，不是不可信脚本沙箱。

frontend.json 固定字段 schemaVersion/id/version/kind/root/entry/apiVersion/hostVersion/requiredCapabilities/optionalCapabilities/assets/immersive。custom root 为 frontends/...；所有资源逐项登记，按 frontend.mjs 校验。此 manifest 用于创作者插件，**不把整个官方前端塞进 custom 包**。

模块 frontend-view schemaVersion 3：bindings 授予 records/stories/settings/prompts/workflows/integrity/images 能力，regions 只描述呈现。新官方 renderer 自由设计，不能扩大 binding 的权限。完整动态模块 DTO 需在接口补全中确认。

## 正式集成的交付边界

dist/ 是新前端静态产物。开发服务器、模拟器、fixtures、文档和凭据不进入生产目录。当前复制构建只输出 src 与 packages；接手者可改为框架构建，并在产物清单记录资产与入口。

后端维护者负责：启动器和运行时静态入口映射、新资产打包与锁文件哈希、管理认证、动态端口交接、资源挂载、自定义前端安装/恢复及失败回退。不要把源码直接覆盖现有卡的锁定资产。

集成必须用新基线合成卡跑完整验收，再考虑发布。这里没有实现正式部署适配器，也没有承诺远程多用户部署。若需要额外接口，通过 DELIVERY-RECORD 中的契约变更申请协调。
