// @vitest-environment happy-dom
import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ReplyTimeline } from "../src/ui/reply-timeline";
import type { AgentMessage } from "../src/services/chat-transport";
afterEach(cleanup);
const text = (value: string) => <span>{value}</span>;
const approval = () => <button>允许一次</button>;
const initial: AgentMessage = { id: "a", role: "assistant", parts: [] };
const props = { renderText: text, renderApproval: approval, renderQuestion: () => <button>回答问题</button>, active: true, statusText: "正在连接…" };
it("replaces the initial indicator with one collapsed live row and preserves manual expansion on updates", () => {
  const { container, rerender } = render(<ReplyTimeline {...props} message={initial} />);
  expect(screen.getByRole("status").textContent).toBe("正在思考…");
  const message: AgentMessage = { ...initial, parts: [{ type: "data-activity", data: { id: "1", kind: "command", label: "obsidian search query=AI", status: "running" } }] };
  rerender(<ReplyTimeline {...props} message={message} />);
  expect(screen.getAllByRole("status")).toHaveLength(1);
  expect(screen.getByRole("status").textContent).toBe("正在搜索资料…");
  const details = container.querySelector(".qa-live-work") as HTMLDetailsElement;
  expect(details.open).toBe(false);
  fireEvent.click(details.querySelector("summary")!);
  expect(details.open).toBe(true);
  message.parts.push({ type: "data-activity", data: { id: "2", kind: "command", label: 'obsidian read path="a.md"', status: "running" } });
  rerender(<ReplyTimeline {...props} message={{ ...message }} />);
  expect(screen.getByRole("status").textContent).toBe("正在阅读内容…");
  expect(details.open).toBe(true);
});
it("keeps approvals and failures outside the collapsed log, including after stopping", () => {
  const message: AgentMessage = { ...initial, parts: [
    { type: "data-activity", data: { id: "1", label: "读取失败", status: "failed" } },
    { type: "data-approval", data: { id: "p", title: "允许写入？", status: "pending", options: [] } },
  ] };
  const { rerender, container } = render(<ReplyTimeline {...props} message={message} />);
  expect(screen.getByRole("button", { name: "允许一次" }).closest("details")).toBeNull();
  expect(screen.getByRole("alert").closest("details")).toBeNull();
  expect(container.querySelector(".qa-working-glyph")).toBeNull();
  rerender(<ReplyTimeline {...props} message={message} active={false} />);
  expect(screen.getByRole("button", { name: "允许一次" }).closest("details")).toBeNull();
  expect(screen.getByRole("alert").closest("details")).toBeNull();
});
it("keeps unanswered questions visible while working and after stopping", () => {
  const message = { ...initial, parts: [
    { type: "data-activity", data: { id: "1", label: "搜索", status: "completed" } },
    { type: "data-question", data: { id: "q", status: "pending", questions: [] } },
  ] } as AgentMessage;
  const { rerender } = render(<ReplyTimeline {...props} message={message} />);
  expect(screen.getByRole("button", { name: "回答问题" }).closest("details")).toBeNull();
  rerender(<ReplyTimeline {...props} message={message} active={false} />);
  expect(screen.getByRole("button", { name: "回答问题" }).closest("details")).toBeNull();
});
