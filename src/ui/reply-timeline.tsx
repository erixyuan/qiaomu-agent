import { useState, type ReactNode } from "react";
import { AlertCircle, ChevronRight, Circle, CircleCheck } from "lucide-react";
import type { AgentMessage } from "../services/chat-transport";
import type { ApprovalState, ChatActivity, ChatPlan, QuestionState } from "../types";

/** A reply in the order it happened: text runs, groups of steps, the plan and questions for the user. */
export type ReplySegment =
  | { kind: "text"; key: string; text: string }
  | { kind: "steps"; key: string; steps: ChatActivity[] }
  | { kind: "plan"; key: string; plan: ChatPlan }
  | { kind: "approval"; key: string; approval: ApprovalState }
  | { kind: "question"; key: string; question: QuestionState };

export function replySegments(message: AgentMessage): ReplySegment[] {
  const segments: ReplySegment[] = [];
  message.parts.forEach((part, index) => {
    const last = segments[segments.length - 1];
    if (part.type === "text") { if (part.text.trim()) segments.push({ kind: "text", key: `text-${index}`, text: part.text }); }
    else if (part.type === "data-activity") {
      if (part.data.label === "userMessage") return;
      if (last?.kind === "steps") last.steps.push(part.data);
      else segments.push({ kind: "steps", key: `steps-${part.data.id}`, steps: [part.data] });
    } else if (part.type === "data-plan") segments.push({ kind: "plan", key: "plan", plan: part.data });
    else if (part.type === "data-approval") segments.push({ kind: "approval", key: `approval-${part.data.id}`, approval: part.data });
    else if (part.type === "data-question") segments.push({ kind: "question", key: `question-${part.data.id}`, question: part.data });
  });
  return segments;
}

/** "12 秒", "1 分 23 秒", "1 小时 5 分". */
export function formatDuration(ms: number): string {
  const seconds = Math.max(1, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds} 秒`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} 分${seconds % 60 ? ` ${seconds % 60} 秒` : ""}`;
  return `${Math.floor(minutes / 60)} 小时${minutes % 60 ? ` ${minutes % 60} 分` : ""}`;
}

interface ReplyProps {
  message: AgentMessage;
  active: boolean;
  statusText: string;
  renderText: (text: string, key: string) => ReactNode;
  renderApproval: (approval: ApprovalState) => ReactNode;
  renderQuestion: (question: QuestionState) => ReactNode;
}

/**
 * While the agent works, everything shows in order, the way Codex does; once done, the work folds into
 * "已处理 …" and only the final answer stays in view.
 */
export function ReplyTimeline({ message, active, statusText, renderText, renderApproval, renderQuestion }: ReplyProps) {
  const segments = replySegments(message);
  const render = (segment: ReplySegment) => segment.kind === "text" ? <div key={segment.key} className="qa-reply-segment">{renderText(segment.text, segment.key)}</div>
    : segment.kind === "steps" ? <StepList key={segment.key} steps={segment.steps} running={active} />
      : segment.kind === "plan" ? <PlanCard key={segment.key} plan={segment.plan} running={active} />
        : segment.kind === "question" ? <div key={segment.key} className="qa-reply-segment">{renderQuestion(segment.question)}</div>
          : <div key={segment.key} className="qa-reply-segment">{renderApproval(segment.approval)}</div>;
  if (active) {
    const stepRunning = message.parts.some((p) => p.type === "data-activity" && p.data.status === "running");
    const streaming = segments[segments.length - 1]?.kind === "text" && !statusText;
    const asking = segments.some((segment) => segment.kind === "question" && segment.question.status === "pending");
    const label = statusText || (streaming || stepRunning ? "" : "正在思考…");
    // The open card already says what the agent is waiting for.
    if (asking) return <>{segments.map(render)}</>;
    return <>{segments.map(render)}
      <div className={`qa-working-tail${label ? "" : " is-quiet"}`} role="status">{label ? <span className="qa-shimmer">{label}</span> : <span className="qiaomu-agent__sr-only">正在回复</span>}</div>
    </>;
  }
  const last = segments[segments.length - 1];
  const final = last?.kind === "text" ? last : undefined;
  const work = final ? segments.slice(0, -1) : segments;
  if (!work.some((segment) => segment.kind === "steps" || segment.kind === "plan")) return <>{segments.map(render)}</>;
  const { createdAt, finishedAt } = message.metadata ?? {};
  const steps = work.reduce((sum, segment) => sum + (segment.kind === "steps" ? segment.steps.length : 0), 0);
  const summary = createdAt && finishedAt ? `已处理 ${formatDuration(finishedAt - createdAt)}` : `已处理 ${steps} 步`;
  return <>
    <details className="qa-worked qa-reply-segment">
      <summary><span>{summary}</span><ChevronRight className="qa-chevron" size={14} aria-hidden="true" /></summary>
      <div className="qa-worked-body">{work.map(render)}</div>
    </details>
    {final && render(final)}
  </>;
}

type Row = { kind: "one"; step: ChatActivity } | { kind: "explore"; steps: ChatActivity[] };

/** Consecutive read-only look-arounds fold into one "已探索" row, as in Codex. */
function rows(steps: ChatActivity[]): Row[] {
  const result: Row[] = [];
  for (const step of steps) {
    const last = result[result.length - 1];
    if (step.kind === "explore" && step.status !== "failed") {
      if (last?.kind === "explore") last.steps.push(step);
      else result.push({ kind: "explore", steps: [step] });
    } else result.push({ kind: "one", step });
  }
  return result;
}

function StepList({ steps, running }: { steps: ChatActivity[]; running: boolean }) {
  return <div className="qa-steps qa-reply-segment">{rows(steps).map((row) => row.kind === "one"
    ? <StepRow key={row.step.id} step={row.step} running={running} />
    : <ExploreRow key={row.steps[0]!.id} steps={row.steps} running={running} />)}</div>;
}

const VERBS: Record<NonNullable<ChatActivity["kind"]>, [string, string]> = {
  command: ["正在运行", "已运行"], explore: ["正在探索", "已探索"], edit: ["正在编辑", "已编辑"],
  search: ["正在搜索", "已搜索"], tool: ["正在调用", "已调用"], image: ["正在生成图片", "已生成图片"],
};

function StepRow({ step, running }: { step: ChatActivity; running: boolean }) {
  const live = running && step.status === "running";
  const verb = step.kind ? VERBS[step.kind][live ? 0 : 1] : "";
  const target = step.kind === "image" ? "" : step.label;
  const line = <>
    {verb && <span className={live ? "qa-shimmer" : "qa-step-verb"}>{verb}</span>}
    {target && (step.kind === "command"
      ? <code className="qa-step-target" title={target}>{target}</code>
      : <span className={`qa-step-target${live && !verb ? " qa-shimmer" : ""}`} title={target}>{target}</span>)}
    {step.kind === "edit" && (step.added || step.removed) ? <span className="qa-diffstat"><span className="is-added">+{step.added ?? 0}</span><span className="is-removed">−{step.removed ?? 0}</span></span> : null}
    {step.status === "failed" && <span className="qa-step-failed"><AlertCircle size={13} aria-hidden="true" /><span className="qiaomu-agent__sr-only">失败</span></span>}
    {step.status === "cancelled" && <span className="qa-step-note">已取消</span>}
  </>;
  if (!step.detail) return <div className={`qa-step is-${step.status}`}>{line}</div>;
  return <details className={`qa-step is-${step.status}`}>
    <summary>{line}<ChevronRight className="qa-chevron" size={13} aria-hidden="true" /></summary>
    <pre className="qa-step-detail">{step.detail}</pre>
  </details>;
}

function ExploreRow({ steps, running }: { steps: ChatActivity[]; running: boolean }) {
  const [open, setOpen] = useState(false);
  const live = running && steps.some((step) => step.status === "running");
  const actions = steps.flatMap((step) => step.actions ?? []);
  const reads = new Set(actions.filter((a) => a.type === "read").map((a) => a.target)).size;
  const searches = actions.filter((a) => a.type === "search").length;
  const lists = actions.filter((a) => a.type === "list").length;
  const counts = [reads && `${reads} 个文件`, searches && `${searches} 次搜索`, lists && `${lists} 个目录`].filter(Boolean).join("，");
  const current = live ? steps[steps.length - 1]!.label : counts;
  return <details className="qa-step qa-explore" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
    <summary>
      <span className={live ? "qa-shimmer" : "qa-step-verb"}>{live ? "正在探索" : "已探索"}</span>
      <span className="qa-step-target" title={current}>{current}</span>
      <ChevronRight className="qa-chevron" size={13} aria-hidden="true" />
    </summary>
    {open && <div className="qa-explore-list">{steps.map((step) => <StepRow key={step.id} step={{ ...step, kind: undefined }} running={running} />)}</div>}
  </details>;
}

function PlanCard({ plan, running }: { plan: ChatPlan; running: boolean }) {
  const done = plan.steps.filter((step) => step.status === "completed").length;
  return <section className="qa-plan qa-reply-segment" aria-label={`计划，已完成 ${done}/${plan.steps.length}`}>
    <div className="qa-plan-head"><span>计划</span><span className="qa-plan-count">{done}/{plan.steps.length}</span></div>
    {plan.explanation && <p className="qa-plan-note">{plan.explanation}</p>}
    <ol>{plan.steps.map((step, index) => <li key={index} className={`is-${step.status}`}>
      {step.status === "completed" ? <CircleCheck size={14} aria-hidden="true" /> : step.status === "inProgress" && running ? <span className="qa-working-dot" aria-hidden="true" /> : <Circle size={14} aria-hidden="true" />}
      <span className={step.status === "inProgress" && running ? "qa-shimmer" : undefined}>{step.step}</span>
      <span className="qiaomu-agent__sr-only">{step.status === "completed" ? "（已完成）" : step.status === "inProgress" ? "（进行中）" : ""}</span>
    </li>)}</ol>
  </section>;
}
