import { Input } from "../ui/input";
import { useState, useEffect } from "react";

export default function InputPrice({
  className,
  value,
  onChange,
  id,
  ...props
}: {
  className?: string;
  value: number;
  onChange: (value: number) => void;
  id: string;
}) {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    if (value === 0) {
      setDisplayValue("");
    } else {
      setDisplayValue(new Intl.NumberFormat("id-ID").format(value));
    }
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value.replace(/[^0-9]/g, "");
    if (rawValue.length > 16) {
      console.error("Angka sangat besar:", rawValue);
      return;
    }
    const numericValue = Number(rawValue || 0);
    onChange(numericValue);
    setDisplayValue(rawValue ? new Intl.NumberFormat("id-ID").format(numericValue) : "");
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      id={id}
      className={className}
      value={displayValue}
      onChange={handleChange}
      {...props}
    />
  );
}
