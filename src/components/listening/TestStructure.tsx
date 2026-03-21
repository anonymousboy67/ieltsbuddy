const parts = [
  {
    part: 1,
    questions: 10,
    desc: "A conversation between two people set in an everyday social context.",
  },
  {
    part: 2,
    questions: 10,
    desc: "A monologue set in an everyday social context, e.g. a speech about local facilities.",
  },
  {
    part: 3,
    questions: 10,
    desc: "A conversation between up to four people set in an educational or training context.",
  },
  {
    part: 4,
    questions: 10,
    desc: "A monologue on an academic subject, e.g. a university lecture.",
  },
];

const staggerClass = [
  "animate-fade-up-4",
  "animate-fade-up-5",
  "animate-fade-up-6",
  "animate-fade-up-7",
];

export default function TestStructure() {
  return (
    <section className="mt-6">
      <h2 className="animate-fade-up animate-fade-up-3 font-heading text-lg font-semibold text-[#F8FAFC]">
        Test Structure
      </h2>
      <div className="mt-4 flex flex-col gap-3">
        {parts.map((p, i) => (
          <div
            key={p.part}
            className={`animate-fade-up ${staggerClass[i]} rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4`}
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-[#F8FAFC]">
                Part {p.part}
              </span>
              <span className="text-sm text-[#64748B]">
                {p.questions} Questions
              </span>
            </div>
            <p className="mt-2 text-[13px] text-[#94A3B8]">{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
