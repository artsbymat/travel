import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export function FormRoute({
  formData,
  setFormData,
  date,
  isDateOpen,
  setIsDateOpen,
  setDate,
}: {
  formData: {
    from: string;
    to: string;
    date: string;
    passengers: number;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      from: string;
      to: string;
      date: string;
      passengers: number;
    }>
  >;
  date: Date | undefined;
  isDateOpen: boolean;
  setIsDateOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
}) {
  return (
    <form className="mb-8">
      <div className="grid gap-3 rounded-2xl bg-secondary border backdrop-blur p-4 shadow-lg md:grid-cols-5 md:gap-2 md:p-6">
        {/* From Input */}
        <div className="flex flex-col gap-2 md:col-span-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase">
            Dari
          </label>
          <div className="relative">
            <MapPin className="size-5 absolute top-2 left-1" />
            <Input
              type="text"
              placeholder="Kota asal"
              value={formData.from}
              onChange={(e) =>
                setFormData({ ...formData, from: e.target.value })
              }
              className="pl-8"
              required
            />
          </div>
        </div>

        {/* To Input */}
        <div className="flex flex-col gap-2 md:col-span-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase">
            Ke
          </label>
          <div className="relative">
            <MapPin className="size-5 absolute top-2 left-1" />
            <Input
              type="text"
              placeholder="Kota tujuan"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              className="pl-8"
              required
            />
          </div>
        </div>

        {/* Date Input */}
        <div className="flex flex-col gap-2 md:col-span-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase">
            Tanggal
          </label>
          <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full text-muted-foreground justify-start bg-transparent"
              >
                <CalendarIcon className="size-5 text-foreground" />
                {date ? date.toLocaleDateString() : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <Calendar
                mode="single"
                selected={date}
                captionLayout="dropdown"
                disabled={{ before: new Date() }}
                onSelect={(date) => {
                  setDate(date);
                  setFormData({
                    ...formData,
                    date: date ? date.toISOString().split("T")[0] : "",
                  });
                  setIsDateOpen(false);
                }}
                required
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Passengers Input */}
        <div className="flex flex-col gap-2 md:col-span-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase">
            Penumpang
          </label>
          <div className="relative">
            <Users className="size-5 absolute top-2 left-1" />
            <Input
              type="number"
              min="1"
              max="15"
              value={formData.passengers}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  passengers: Number.parseInt(e.target.value),
                })
              }
              className="pl-8"
            />
          </div>
        </div>

        {/* Search Button */}
        <div className="flex items-end md:col-span-1">
          <Button
            type="submit"
            variant="secondary"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg h-11 md:h-auto"
          >
            <span className="hidden md:inline">Search</span>
            <ArrowRight className="h-5 w-5 md:hidden" />
          </Button>
        </div>
      </div>
    </form>
  );
}
