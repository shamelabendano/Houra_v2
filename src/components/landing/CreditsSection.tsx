import HourglassLogo from "../HourglassLogo";
import { SUPPORT_URL } from "./support";

const columns = [
  { title: "About us", body: "Houra is a small, independent time tracker built for people who want to see where their hours actually go." },
  { title: "Links", body: "Features, About us and the app itself are all one click away from the menu at the top of this page." },
  { title: "Story time", body: "It started as a personal tool for tracking freelance work, and grew into something worth sharing." },
  { title: "Get in touch", body: "Questions, ideas or bugs? Reach out through the Choco-kape link and say hi." },
];

export default function CreditsSection() {
  return (
    <footer id="credits" className="bg-primary px-6 pb-20 pt-24 text-white">
      <div className="mx-auto flex max-w-[1130px] flex-col items-center gap-4 rounded-xl border-2 border-white/80 bg-[#ddebff] px-6 py-4 sm:flex-row sm:gap-6">
        <div className="flex items-center gap-3">
          <HourglassLogo size={28} />
          <span className="text-[40px] font-bold leading-none text-accent">Houra</span>
        </div>
        {SUPPORT_URL && (
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noreferrer"
            className="ml-auto rounded-xl bg-primary px-8 py-3 text-xl shadow-[0_4px_0_#2563eb]"
          >
            ☕ Buy me a Choco-kape
          </a>
        )}
      </div>
      <p className="my-16 text-center text-[40px] font-light">www.Houra.com</p>
      <div className="mx-auto grid max-w-[1100px] gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((c) => (
          <div key={c.title}>
            <h3 className="text-xl">{c.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>
    </footer>
  );
}
