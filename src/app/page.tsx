import Link from "next/link";
import Image from "next/image";
import { Bot, FlaskConical, Gamepad2, ShieldQuestion, UsersRound } from "lucide-react";

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
    body: "王者荣耀五排也能收口补位、提醒上线、回顾高光和下次再约。",
    icon: Gamepad2,
  },
];

const showcaseImages = [
  {
    src: "/prototypes/01_group_chat_planning_friday_bbq_event.png",
    label: "群聊起势",
  },
  {
    src: "/prototypes/02_group_chat_with_voting_poll_interface.png",
    label: "投票推进",
  },
  {
    src: "/generated/qq-bbq-memory.png",
    label: "烤肉回忆",
  },
  {
    src: "/prototypes/04_group_chat_memory_card_summary.png",
    label: "回忆沉淀",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-qq-bg px-4 py-6 md:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-48px)] max-w-6xl flex-col justify-center gap-7">
        <div className="grid items-center gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase text-blue-600">腾讯 PCG 命题赛道题目 3</p>
          <h1 className="mt-3 text-5xl font-black leading-tight text-slate-950 md:text-6xl">
            虾局长
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-650">
            QQ 群里的官方社交推进 Agent。体验者只需要控制一个用户，其余群成员由导演脚本驱动，核心交互通过按钮、chips 和预置选项完成。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-qq-blue px-5 py-3 text-sm font-bold text-white shadow-card"
              href="/judge"
            >
              <UsersRound size={18} />
              进入无 LLM 评审模式
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-card"
              href="/studio?key=local-studio"
            >
              <FlaskConical size={18} />
              进入真实 LLM 工作台
            </Link>
          </div>
        </div>
          <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/90 p-3 shadow-soft">
            <div className="relative h-[420px] overflow-hidden rounded-[22px] bg-slate-950">
              <div className="animate-showcase-loop flex w-max gap-3 p-3">
                {[...showcaseImages, ...showcaseImages].map((image, index) => (
                  <figure
                    className="relative h-[396px] w-[250px] shrink-0 overflow-hidden rounded-[22px] bg-white shadow-card"
                    key={`${image.src}-${index}`}
                  >
                    <Image alt={image.label} className="object-cover" fill sizes="250px" src={image.src} />
                    <figcaption className="absolute bottom-3 left-3 rounded-full bg-slate-950/75 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                      {image.label}
                    </figcaption>
                  </figure>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 to-transparent" />
            </div>
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
