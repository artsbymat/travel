import { Contact } from "@/components/public/Contact";
import { FAQ } from "@/components/public/FAQ";
import { Partners } from "@/components/public/Partners";
import { SearchHero } from "@/components/public/SearchHero";
import { WhyChooseUs } from "@/components/public/WhyChooseUs";
import TestimonialsComponent from "@/components/public/Testimonial";

export default function Home() {
  return (
    <main>
      <div className="max-w-7xl mx-auto">
        <SearchHero />
      </div>
      <WhyChooseUs />
      <Partners />
      <FAQ />
      <TestimonialsComponent />
      <Contact />
    </main>
  );
}
