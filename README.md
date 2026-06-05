<div align="center">
  <img width="120" height="120" alt="JSON Spotlight Editor Icon" src="icons/icon.svg" />
</div>

# JSON Spotlight Editor

将嵌套 JSON 数据转换为可编辑的电子表格视图，支持虚拟滚动、筛选、批量编辑、变更对比与 Excel 导出。

## 功能特性

- **嵌套 JSON 扁平化** — 自动将层级 JSON 结构展平为表格行，继承的父级属性以高亮标识
- **单元格实时编辑** — 双击即可修改值，支持智能类型推断（`"true"` → `true`，`"123"` → 123）
- **虚拟滚动** — 手动虚拟化渲染，仅绘制可视区域行，万行数据流畅无卡顿
- **撤销 / 重做** — 完整的操作历史栈，支持 Ctrl+Z / Ctrl+Shift+Z 快捷键
- **列筛选** — 每列独立的多值筛选器，交叉筛选即时生效
- **批量编辑** — 选定多行后对某列一键赋值，未选行时作用于全部筛选结果
- **变更对比** — 基于 Monaco Diff Editor 的 JSON 实时对比视图，支持逐条导航差异
- **列管理** — 显示 / 隐藏任意列，拖拽调整列宽，类型选择器开关
- **智能合并导出 Excel** — 导出为 `.xlsx`，可选合并相同值单元格，父级共享属性自动分组
- **JSON 导出** — 将编辑后的数据还原为原始嵌套结构导出
- **拖放导入** — 将 JSON 文件拖入窗口即可加载，也可粘贴文本导入
- **深色模式** — 一键切换，偏好自动持久化到 localStorage
- **桌面应用** — 基于 Neutralino.js 打包为独立 exe，无需浏览器即可运行

## 快速开始

**前置条件：** Node.js 18+、pnpm

```bash
# 安装依赖
pnpm install

# 启动开发服务器 (http://localhost:5173)
pnpm dev

# 构建生产版本
pnpm build
```

## 桌面应用

```bash
# 以桌面窗口运行
pnpm neu:run

# 构建桌面应用 (生成 exe)
pnpm neu:build
```

## 核心架构

### 数据流

1. **导入** — `flattenJSON()` 将嵌套 JSON 转为 `FlatRow[]`，每个单元格记录其在原始 JSON 中的完整路径
2. **展示** — 虚拟滚动仅渲染可视区域行（`ROW_HEIGHT=40`，`OVERSCAN=5`）
3. **编辑** — 修改单元格时，通过 `_propPathIds` 定位所有共享同一路径的行并同步更新
4. **导出** — `unflattenJSON()` 利用存储的属性路径将 `FlatRow[]` 还原为原始嵌套结构

### 关键文件

| 文件 | 说明 |
|------|------|
| `App.tsx` | 主组件，包含状态管理、虚拟滚动、历史栈、筛选与 UI 交互 |
| `utils/jsonHelper.ts` | 核心逻辑：`flattenJSON` / `unflattenJSON` / `smartParseValue` |
| `utils/excelHelper.ts` | Excel 导出：ExcelJS 构建 xlsx，可选合并单元格 |
| `components/JsonDiff.tsx` | Monaco Diff Editor 变更对比视图 |
| `components/EditableCell.tsx` | 可编辑单元格，含类型选择器 |
| `components/ExportModal.tsx` | 导出对话框（JSON / Excel / 合并选项） |
| `components/BulkEditModal.tsx` | 批量编辑对话框 |
| `types.ts` | `FlatRow`、`ColumnMeta`、`FilterState` 类型定义 |

### 路径追踪系统

每个单元格通过 `_propPaths` 和 `_propPathIds` 记录其在原始 JSON 中的精确路径。这使得：

- 从任意子行编辑父级属性
- 共享同路径的行自动同步更新
- 导出时精确还原嵌套层级结构

## 技术栈

- **React 18** + TypeScript
- **Tailwind CSS 4** — 深色模式通过 `<html>` 上的 `dark` class 切换
- **ExcelJS** — xlsx 生成与合并单元格
- **Monaco Editor** — JSON 变更对比
- **Lucide Icons** — 图标库
- **Neutralino.js** — 桌面应用打包
- **Vite 5** — 构建工具

## 许可证

本项目为私人项目，未对外开放许可证。