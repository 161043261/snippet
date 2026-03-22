# @snippet/mcp 项目技术栈详解

本项目是一个基于 Node.js 构建的全栈应用，其核心目标是提供一个基于 **Model Context Protocol (MCP)** 的提示词 (Prompt) 管理与分发服务。

本文档详细介绍了本项目 `src/` (核心源码) 和 `scripts/` (工具脚本) 目录中所涉及的所有技术栈。

---

## 1. 后端架构层 (`src/` 目录)

后端采用高性能的 Web 框架和强类型语言构建，提供了 HTTP REST API 以及 MCP 协议的流式接口。

### 核心框架与服务

- **[Fastify (v5)](https://fastify.dev/)**: 项目的核心 Web 框架。相比于传统的 Express，Fastify 专注于极致的性能和极低的开销。
  - `@fastify/mongodb`: Fastify 官方的 MongoDB 插件，用于在应用生命周期内共享数据库连接池。
  - `@fastify/static`: 用于代理和提供 `src/client` 构建输出的前端静态资源文件。
  - `@fastify/cors` & `@fastify/basic-auth`: 用于处理跨域资源共享以及 HTTP Basic 基础认证。
- **[MongoDB](https://www.mongodb.com/)**: 作为数据持久化层，主要负责存储 Prompts (提示词) 的元数据（名称、描述、内容等）。
- **[Model Context Protocol (MCP)](https://modelcontextprotocol.io/)**:
  - 使用了官方的 `@modelcontextprotocol/sdk`。
  - 在 `src/mcp.ts` 中，通过 `StreamableHTTPServerTransport` 实现了基于流式 HTTP 的 MCP 服务端 (`McpServer`)。
  - 实现了 MCP 协议中的 `prompts` 能力，处理 `ListPromptsRequest` (获取提示词列表) 和 `GetPromptRequest` (获取特定提示词内容) 指令。

### 工具库

- **[Zod](https://zod.dev/)**: TypeScript 优先的模式声明和验证库。在路由 (`src/routes`) 层用于对客户端请求的数据载荷 (Payload) 进行严谨的类型和边界校验。
- **[dotenv](https://github.com/motdotla/dotenv)**: 用于将环境变量（如 `MONGO_URL`）从 `.env` 文件加载到 `process.env` 中。

---

## 2. 前端架构层 (`src/client/` 目录)

前端采用轻量级的 Web Components 方案，是一个独立的 SPA（单页应用），构建后由 Fastify 提供静态托管。

### UI 框架与样式

- **[Lit (v3)](https://lit.dev/)**: Google 推出的轻量级 Web Components 框架。
  - 通过 `@customElement` 和 `@state` 装饰器，使用面向对象的方式编写原生的 Web 组件（如 `prompt-form.ts` 和 `index.ts`）。
  - 采用原生的 Shadow DOM (项目中为适配 Tailwind 选择禁用) 和高效的 HTML 模板渲染 (`html` 标签模板)。
- **[Tailwind CSS (v4)](https://tailwindcss.com/)**: 实用类优先 (Utility-first) 的 CSS 框架。
  - 结合 `@tailwindcss/postcss` 和 `autoprefixer`，实现快速的响应式 UI 开发，无需编写传统的 CSS 样式文件。

### 前端构建工具链

- **[Rollup](https://rollupjs.org/)**: 前端模块打包器。
  - `@rollup/plugin-typescript`: 在打包过程中编译前端 TypeScript 代码。
  - `rollup-plugin-postcss`: 处理 Tailwind CSS 和样式文件的注入。
  - `@rollup/plugin-node-resolve` / `@rollup/plugin-commonjs`: 用于解析和打包 `node_modules` 中的第三方依赖（如 Lit）。

---

## 3. 工程化与脚本 (`scripts/` 及根目录工具)

项目采用了一系列现代化的 Node.js 工具链来保障开发体验、构建流程和性能测试。

### 性能基准测试 (`scripts/benchmark.ts`)

- **[Autocannon](https://github.com/mcollina/autocannon)**: 采用 Node.js 编写的超快速 HTTP/1.1 基准测试工具。
  - 脚本模拟了并发请求 (`connections: 10`, `duration: 10s`) 来压测 Fastify 提供的 `/prompts` 接口，自动输出吞吐量 (Throughput)、延迟 (Latency) 和 QPS 等性能指标，用于性能调优参考。

### 开发与运行环境

- **[TypeScript](https://www.typescriptlang.org/)**: 整个项目（包括前后端和脚本）均采用 TypeScript 编写，提供静态类型推导。
- **[TSX (TypeScript Execute)](https://github.com/privatenumber/tsx)**: 一个增强版的 Node.js 运行环境。在开发环境 (`pnpm dev:server`) 和运行脚本 (`pnpm benchmark`) 时，直接执行 `.ts` 文件，无需执行耗时的 `tsc` 编译。
- **[Concurrently](https://github.com/open-cli-tools/concurrently)**: 并发命令执行工具。用于在 `dev` 和 `build` 阶段，通过同一个终端进程同时启动前端 Rollup 监听/打包和后端 Fastify 服务的启动/编译。

---

## 4. 核心技术栈详细教程

为了帮助开发者更好地理解和维护本项目，以下是针对本项目中三大核心技术（Fastify、Lit、Autocannon）的快速入门与实战教程。

### 4.1 Fastify 快速教程

Fastify 是一个高度专注于以最少开销和强大的插件架构提供最佳开发体验的 Web 框架。

**1. 基础实例化与启动**
在 Fastify 中，一切皆为插件。我们通常先实例化一个 fastify 对象：

```typescript
import Fastify from "fastify";
const fastify = Fastify({ logger: true });

fastify.listen({ port: 3000 }, (err) => {
  if (err) throw err;
});
```

**2. 路由与请求处理**
Fastify 提供了简洁的路由定义方式，支持完整的 TypeScript 类型推导。

```typescript
fastify.get("/ping", async (request, reply) => {
  return { pong: "it worked!" };
});
```

**3. 插件系统 (Plugin System)**
在本项目 (`src/app.ts`) 中，大量使用了 `fastify.register`。Fastify 保证了插件加载的异步顺序，非常适合挂载数据库、静态服务等：

```typescript
// 注册 MongoDB 插件
await fastify.register(fastifyMongodb, { url: "mongodb://..." });
// 注册自定义路由模块
await fastify.register(promptRoutes, { prefix: "/prompts" });
```

### 4.2 Lit Web Components 教程

Lit 是一个轻量级库，用于构建快速、响应式的 Web Components。它基于标准的 Custom Elements。

**1. 定义组件与禁用 Shadow DOM**
使用装饰器 `@customElement` 快速注册自定义标签。为了让 Tailwind CSS 在组件内生效，本项目（如 `src/client/src/prompt-form.ts`）通常会重写 `createRenderRoot` 来禁用 Shadow DOM。

```typescript
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("my-element")
export class MyElement extends LitElement {
  createRenderRoot() {
    return this; // 禁用 Shadow DOM，允许外部 CSS (如 Tailwind) 穿透
  }

  render() {
    return html`<div>Hello Lit</div>`;
  }
}
```

**2. 响应式状态管理**
使用 `@state()` 装饰器定义组件的内部状态，状态的改变会自动触发 `render()` 重新渲染，且只更新必要的部分。

```typescript
import { state } from "lit/decorators.js";

// ...
@state()
private count = 0;

render() {
  return html`
    <button @click=${() => this.count++}>
      Clicked ${this.count} times
    </button>
  `;
}
```

**3. 模板语法与事件绑定**
Lit 使用原生的 `html` 模板标签。事件绑定使用 `@` 前缀（如 `@submit`），属性绑定使用 `.` 前缀（如 `.value`）。这在我们的 `prompt-form` 中得到了广泛应用。

### 4.3 Autocannon 性能压测教程

Autocannon 是一款采用 Node.js 编写的高性能 HTTP 压测工具，比 Apache Bench (ab) 更快且支持丰富的配置。

**1. 命令行用法 (CLI)**
通常可以直接通过命令行对接口进行压测：

```bash
npx autocannon -c 100 -d 10 http://localhost:3000/
```

_(表示 100 个并发连接，持续 10 秒)_

**2. 编程式用法 (Programmatic API)**
在本项目 (`scripts/benchmark.ts`) 中，为了在压测前自动启动 Fastify 服务并配置特定的 Headers (如 Basic Auth)，使用了编程式调用：

```typescript
import autocannon from "autocannon";

const instance = autocannon(
  {
    url: "http://localhost:3000/prompts",
    connections: 10, // 并发连接数
    pipelining: 1, // HTTP Pipelining 深度
    duration: 10, // 持续时间(秒)
    headers: {
      // 自定义请求头
      authorization: "Basic ...",
    },
  },
  (err, result) => {
    if (!err) {
      console.log("QPS:", result.requests.average);
      console.log("延迟(ms):", result.latency.average);
    }
  },
);

// 在控制台渲染实时进度条
autocannon.track(instance, { renderProgressBar: true });
```

编程式调用不仅能获得详细的 JSON 格式结果对象 (`result`)，还能无缝集成到 CI/CD 流程中进行自动化的性能基准测试。

---

## 总结

该项目展示了一个现代化的 Node.js 全栈微型应用最佳实践：

- 服务端通过 **Fastify + MCP SDK** 提供了极具前瞻性的 AI Agent 交互接口。
- 客户端通过 **Lit + Tailwind CSS** 构建了零外部依赖包袱的轻量级 Web Components 界面。
- 整体工程基于 **TypeScript + TSX + Rollup** 实现了高效的前后端一体化开发流。
