"use client";

import * as React from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarDays, ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function DatePicker({ date, setDate }: { date?: Date; setDate: (date: Date) => void }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            size="lg"
            data-empty={!date}
            className="data-[empty=true]:text-muted-foreground text-foreground h-12 w-[212px] cursor-pointer justify-between bg-[#F1F1F1] text-left font-normal hover:bg-[#E1E1E1]"
          >
            <CalendarDays />
            {date ? format(date, "EEEE, dd MMMM yyyy", { locale: id }) : <span>Pilih Tanggal</span>}
            <ChevronDownIcon data-icon="inline-end" />
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            setDate(selectedDate as Date);
            setOpen(false);
          }}
          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
        />
      </PopoverContent>
    </Popover>
  );
}
