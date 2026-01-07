"use client";

import { useState } from "react";
import { FormRoute } from "./form-route";

export function SearchHero() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [formData, setFormData] = useState({
    from: "",
    to: "",
    date: date ? date.toISOString().split("T")[0] : "",
    passengers: 1,
  });

  return (
    <div className="w-full py-12 md:py-20">
      <div className="container px-4 mx-auto">
        <div className="mb-12 text-center md:mb-16">
          <h1 className="mb-4 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl text-balance">
            Pesan Tiket Perjalanan Anda dengan Mudah
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl text-balance">
            Aman, Cepat, dan Terpercaya untuk Semua Kebutuhan Perjalanan Anda
          </p>
        </div>

        <FormRoute
          formData={formData}
          setFormData={setFormData}
          date={date}
          isDateOpen={isDateOpen}
          setIsDateOpen={setIsDateOpen}
          setDate={setDate}
        />
      </div>
    </div>
  );
}
