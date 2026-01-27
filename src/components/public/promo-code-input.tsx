"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface PromoCodeInputProps {
  onApply?: (discount: number) => void;
  onRemove?: () => void;
}

export function PromoCodeInput({ onApply, onRemove }: PromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState("");
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");

  const validPromoCodes: Record<string, number> = {
    SAVE10: 0.1,
    SAVE20: 0.2,
    WELCOME: 0.15,
  };

  const handleApplyPromo = () => {
    const discount = validPromoCodes[promoCode.toUpperCase()];
    if (discount) {
      setApplied(true);
      setError("");
      onApply?.(discount);
    } else {
      setError("Invalid promo code");
      setApplied(false);
    }
  };

  const handleRemove = () => {
    setPromoCode("");
    setApplied(false);
    setError("");
    onRemove?.();
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground">Kode Promo</h3>

      {!applied ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Masukkan kode promo"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value);
                setError("");
              }}
              className="flex-1"
            />
            <Button
              onClick={handleApplyPromo}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Gunakan
            </Button>
          </div>
          {error && (
            <p className="text-sm text-destructive flex items-center gap-2">
              <X className="h-4 w-4" />
              {error}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Try: SAVE10, SAVE20, or WELCOME
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg bg-accent/10 p-3">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-accent" />
            <div>
              <p className="font-semibold text-foreground text-sm">
                {promoCode.toUpperCase()}
              </p>
              <p className="text-xs text-muted-foreground">
                Discount applied successfully
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-muted-foreground hover:text-foreground"
          >
            Remove
          </Button>
        </div>
      )}
    </Card>
  );
}
