import Link from "next/link";
import { Bot, Clapperboard, Gamepad2, ShieldQuestion, UsersRound } from "lucide-react";

const capabilityCards = [
  {
    title: "智能收口组局",
    body: "从自然群聊识别意图，推进时间、地点、参加意愿和确认成局。",
    icon: UsersRound,
  },
  {
    title: "匿名倡议",
    body: "有人想提但不想背锅时，由虾局长用官方身份代发并继续推进。",
    icon: ShieldQuestion,
  },
  {
    title: "冲突桥梁",
    body: "争执升温时先总结双方诉求，再给出中性转述和降温选项。",
    icon: Bot,
  },
  {
    title: "腾讯游戏局",
    body: "王者荣耀、洛克王国等游戏组队也能收口、回顾和下次再约。",
    icon: Gamepad2,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-qq-bg px-4 py-6 md:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-48px)] max-w-6xl flex-col justify-center gap-6">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase text-blue-600">腾讯 PCG 命题赛道题目 3</p>
          <h1 className="mt-3 text-5xl font-black leading-tight text-slate-950 md:text-6xl">
            虾局长
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-650">
            QQ 群里的官方社交推进 Agent。评委只需要控制一个用户，其余群成员由导演脚本驱动，核心交互通过按钮、chips 和预置选项完成。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-qq-blue px-5 py-3 text-sm font-bold text-white shadow-card"
              href="/judge"
            >
              <UsersRound size={18} />
              进入 Judge Mode
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-card"
              href="/recording"
            >
              <Clapperboard size={18} />
              进入 Recording Mode
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-card"
              href="/studio"
            >
              <Bot size={18} />
              进入 Studio Mode
            </Link>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {capabilityCards.map((card) => {
            const Icon = card.icon;
            return (
              <article className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-card" key={card.title}>
                <Icon className="text-blue-600" size={22} />
                <h2 className="mt-3 text-base font-black text-slate-950">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.body}</p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
