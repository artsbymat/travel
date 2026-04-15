"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList
} from "@/components/ui/combobox";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { InputGroupAddon } from "../ui/input-group";
import { MapPin, MapPinHouse } from "lucide-react";

export type City = {
  code: string;
  name: string;
  province: string;
};

type Props = {
  cities: City[];
  id: string;
  value?: City | null;
  onChange: (value: City | null) => void;
  placeholder?: string;
};

export function ComboboxCitySearch({
  cities,
  id,
  value,
  onChange,
  placeholder = "Pilih kota"
}: Props) {
  return (
    <Combobox
      items={cities}
      value={value}
      onValueChange={onChange}
      itemToStringValue={(city) => city?.code ?? ""}
      itemToStringLabel={(city) => city?.name ?? ""}
      id={id}
    >
      <ComboboxInput placeholder={placeholder} className="h-12 w-full">
        <InputGroupAddon>{id === "origin" ? <MapPinHouse /> : <MapPin />}</InputGroupAddon>
      </ComboboxInput>

      <ComboboxContent className="w-full">
        <ComboboxEmpty>Kota tidak ditemukan.</ComboboxEmpty>

        <ComboboxList>
          {(city) => (
            <ComboboxItem key={city.code} value={city}>
              <Item size="xs" className="p-0">
                <ItemContent>
                  <ItemTitle>{city.name}</ItemTitle>
                  <ItemDescription>
                    {city.province} ({city.code})
                  </ItemDescription>
                </ItemContent>
              </Item>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
