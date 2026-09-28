#!/usr/bin/env node
// Builds src/prompts/library.json from a Qiaomu-QuickPrompt checkout:
//   node tools/import-quickprompt.mjs ../Qiaomu-QuickPrompt
// 乔木精选 is taken whole; Yao Open Prompts (CC BY 4.0) only for the ids below, the ones that fit note work.
// ai-boost (GPL-3.0) and the image prompts are left out on purpose.
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import vm from "node:vm";

const root = process.argv[2];
if (!root) { console.error("usage: node tools/import-quickprompt.mjs <Qiaomu-QuickPrompt checkout>"); process.exit(1); }

const YAO = [
  // 学习方法
  "yao-03-ai-learning-keyword-learning-assistant", "yao-03-ai-learning-learning-methods-cornell-note-method",
  "yao-03-ai-learning-learning-methods-feynman-learning-method", "yao-03-ai-learning-learning-methods-feynman-questioning-coach",
  "yao-03-ai-learning-learning-methods-keyword-learning-method", "yao-03-ai-learning-learning-methods-pomodoro-learning-coach",
  "yao-03-ai-learning-learning-methods-simon-learning-method", "yao-03-ai-learning-learning-methods-sq3r-reading-method",
  "yao-03-ai-learning-learning-methods-super-memory-method", "yao-03-ai-learning-memory-technique-coach",
  "yao-03-ai-learning-personalized-habit-formation-planner",
  // 写作内容
  "yao-06-ai-content-humanized-writing-humanized-writing-polish-v3", "yao-06-ai-content-humanized-writing-humanized-writing-v2",
  "yao-06-ai-content-interview-outline-planner", "yao-06-ai-content-knowledge-base-writing-rebuilder",
  "yao-06-ai-content-sanmao-style-memoir-generator", "yao-06-ai-content-title-optimizer", "yao-06-ai-content-topic-planner",
  "yao-06-ai-content-viral-remix-deconstruction-rewriter", "yao-06-ai-content-wechat-article-expert",
  "yao-06-ai-content-xiaohongshu-title-generator", "yao-06-ai-content-spoken-viral-script", "yao-06-ai-content-sharp-commentary-copy",
  "yao-08-ai-marketing-ai-friendly-content-creation",
  // 思考与方法
  "yao-09-ai-thinking-memory-palace-architect", "yao-09-ai-thinking-self-critique-master", "yao-09-ai-thinking-title-alchemist-thinking",
  "yao-01-ai-methods-article-reverse-engineering", "yao-01-ai-methods-interactive-rtf-meta-prompt-system",
  "yao-01-ai-methods-meta-prompt-rtf-generator", "yao-02-ai-work-company-research-methodology",
];

const YAO_CATEGORY = { AI学习: "学习方法", AI内容: "写作内容", AI营销: "写作内容", AI思考: "思考", AI方法: "提示词方法", AI工作: "研究调研" };

function load(file, name) {
  const context = {}; context.window = context; context.self = context; context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(readFileSync(join(root, file), "utf8"), context);
  return context[name];
}

const qiaomu = load("seed-qiaomu-prompts.js", "QuickPromptQiaomuSeedItems").map((item) => ({
  id: item.id, title: item.title.trim(), body: item.content.trim(), source: "qiaomu",
  category: item.category.replace(/^乔木 Prompt(?: · )?/, "") || "其他",
}));
const yaoAll = new Map(load("seed-prompts.js", "QuickPromptYaoSeedItems").map((item) => [item.id, item]));
const yao = YAO.map((id) => {
  const item = yaoAll.get(id);
  if (!item) throw new Error(`Yao prompt ${id} is missing from the checkout`);
  return { id: item.id, title: item.title.trim(), body: item.content.trim(), source: "yao", category: YAO_CATEGORY[item.category] ?? "其他", url: item.source?.url };
});

const commit = execFileSync("git", ["-C", root, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
const library = { from: `joeseesun/Qiaomu-QuickPrompt@${commit}`, items: [...qiaomu, ...yao] };
writeFileSync(new URL("../src/prompts/library.json", import.meta.url), `${JSON.stringify(library, null, 1)}\n`);
console.log(`wrote ${qiaomu.length} 乔木精选 + ${yao.length} Yao prompts from ${library.from}`);
