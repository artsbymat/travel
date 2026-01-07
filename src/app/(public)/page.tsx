import { SearchHero } from "@/components/public/SearchHero";
import { WhyChooseUs } from "@/components/public/WhyChooseUs";

export default function Home() {
  return (
    <main>
      <div className="max-w-7xl mx-auto">
        <SearchHero />
      </div>
      <WhyChooseUs />
    </main>
  );
}
