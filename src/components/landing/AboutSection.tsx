import { Link } from "react-router-dom";

export default function AboutSection() {
  return (
    <section
      id="about"
      className="flex min-h-[70vh] flex-col items-center justify-center bg-gradient-to-r from-[#4f52c9] to-accent px-6 py-20 text-center text-white"
    >
      <h2 className="text-[40px] font-light leading-tight sm:text-[72px]">Your time, your terms</h2>
      <p className="mt-4 max-w-[860px] text-lg sm:text-[22px]">
        Houra lets freelancers, students, and professionals track every minute, calculate earnings, and build better
        habits — on your terms.
      </p>
      <Link to="/home" className="mt-8 rounded-lg bg-[#e5e5e5] px-7 py-3 text-lg text-black shadow transition hover:bg-white">
        🚀 Launch Houra
      </Link>
    </section>
  );
}
