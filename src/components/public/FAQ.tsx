"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export function FAQ() {
  const [expandedId, setExpandedId] = useState<string | null>("1");

  const faqs: FAQItem[] = [
    {
      id: "1",
      question: "How do I book a trip?",
      answer:
        "Simply enter your departure and destination cities, select your preferred date, and browse available trips. Click on a trip to view details, select your seats, and proceed to payment. Your booking confirmation will be sent to your email.",
    },
    {
      id: "2",
      question: "What is your cancellation policy?",
      answer:
        "You can cancel your booking up to 24 hours before departure for a full refund. Cancellations made within 24 hours of departure are subject to a 20% cancellation fee. Some special fares may have different cancellation policies.",
    },
    {
      id: "3",
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards (Visa, Mastercard), debit cards, bank transfers, and popular e-wallets including GCash, GrabPay, and other digital payment methods. Payment is secure and encrypted.",
    },
    {
      id: "4",
      question: "Are there any discounts available?",
      answer:
        "Yes! We offer various discounts including student discounts, senior citizen discounts, group bookings, and seasonal promotions. You can also use promo codes during checkout to apply special discounts to your booking.",
    },
    {
      id: "5",
      question: "How far in advance should I book my trip?",
      answer:
        "You can book up to 90 days in advance. We recommend booking at least 2-3 days before your travel date to get the best prices and widest selection of available trips.",
    },
    {
      id: "6",
      question: "What should I bring for my trip?",
      answer:
        "Bring a valid ID or passport, comfortable clothes, personal hygiene items, and any medications you need. We recommend not bringing valuables on board. Luggage allowance depends on the vehicle type and operator.",
    },
  ];

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section className="bg-muted/50 px-4 py-16 md:py-20">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Find answers to common questions about booking and traveling with us
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq) => {
            const isExpanded = expandedId === faq.id;

            return (
              <Card
                key={faq.id}
                className="border border-border bg-card shadow-sm transition-all p-0"
              >
                <button
                  onClick={() => toggleExpanded(faq.id)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-muted/50"
                >
                  <h3 className="text-base font-semibold text-foreground md:text-lg">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Answer */}
                {isExpanded && (
                  <div className="border-t border-border px-6 py-4">
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
