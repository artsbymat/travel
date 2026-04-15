import { Input } from "../ui/input";

export default function InputNumber({
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const numeric = raw.replace(/\D/g, "");
    const parsed = parseInt(numeric, 10);

    if (!isNaN(parsed)) {
      onChange(parsed);
    } else {
      onChange(0);
    }
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      id={id}
      className={className}
      value={value}
      onChange={handleChange}
      {...props}
    />
  );
}
