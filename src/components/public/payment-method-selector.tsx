"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Building2, Wallet } from "lucide-react";

interface PaymentMethodSelectorProps {
  onSelect?: (method: string) => void;
}

const paymentMethods = [
  {
    id: "bank-transfer",
    name: "Bank Transfer",
    description: "Direct transfer to our bank account",
    icon: Building2,
    details: "Instant confirmation once verified",
  },
  {
    id: "ewallet",
    name: "E-Wallet",
    description: "Pay with GCash, PayMaya, or OVO",
    icon: Wallet,
    details: "Fastest payment method",
  },
  {
    id: "virtual-account",
    name: "Virtual Account",
    description: "Pay via virtual account number",
    icon: CreditCard,
    details: "Available 24/7, any time",
  },
];

export function PaymentMethodSelector({
  onSelect,
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState("bank-transfer");

  const handleMethodChange = (value: string) => {
    setSelectedMethod(value);
    onSelect?.(value);
  };

  return (
    <Card className="p-6">
      <h3 className="mb-6 text-lg font-semibold text-foreground">
        Metode Pembayaran
      </h3>
      <RadioGroup value={selectedMethod} onValueChange={handleMethodChange}>
        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <label
                key={method.id}
                className={`flex gap-4 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  selectedMethod === method.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem
                  value={method.id}
                  className="mt-1 flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-5 w-5 text-primary" />
                    <p className="font-semibold text-foreground">
                      {method.name}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {method.description}
                  </p>
                  <p className="text-xs text-accent font-medium">
                    {method.details}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </RadioGroup>
    </Card>
  );
}
