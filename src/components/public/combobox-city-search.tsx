"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
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
import { Spinner } from "@/components/ui/spinner";

export type City = {
  id?: string;
  code: string;
  name: string;
  province: string;
  provinceId?: string;
};

type Props = {
  cities?: City[];
  id: string;
  value?: City | null;
  onChange: (value: City | null) => void;
  placeholder?: string;
};

type CityApiResponse = {
  id: string;
  name: string;
  code?: string | null;
  provinceId: string;
  province?: {
    name?: string | null;
  } | null;
};

function useDebouncedValue(value: string, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay);

    return () => window.clearTimeout(timeoutId);
  }, [delay, value]);

  return debouncedValue;
}

function normalizeCity(city: CityApiResponse): City {
  return {
    id: city.id,
    code: city.code ?? city.id,
    name: city.name,
    province: city.province?.name ?? "",
    provinceId: city.provinceId
  };
}

export function ComboboxCitySearch({
  cities = [],
  id,
  value,
  onChange,
  placeholder = "Pilih kota"
}: Props) {
  const [inputValue, setInputValue] = useState("");
  const debouncedInputValue = useDebouncedValue(inputValue);
  const query = debouncedInputValue.trim();

  const citiesQuery = useQuery({
    queryKey: ["public", "cities", query],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ limit: query ? "20" : "10" });

      if (query) {
        params.set("q", query);
      }

      const response = await fetch(`/api/cities?${params.toString()}`, { signal });

      if (!response.ok) {
        throw new Error("Gagal memuat kota.");
      }

      const data = (await response.json()) as CityApiResponse[];
      return data.map(normalizeCity);
    },
    placeholderData: keepPreviousData
  });

  const items = citiesQuery.data ?? cities;
  const isLoading = citiesQuery.isPending || citiesQuery.isFetching;
  const error = citiesQuery.isError ? "Gagal memuat kota." : null;

  return (
    <Combobox
      items={items}
      filter={null}
      value={value}
      onValueChange={onChange}
      onInputValueChange={setInputValue}
      itemToStringValue={(city) => city?.code ?? ""}
      itemToStringLabel={(city) => city?.name ?? ""}
      isItemEqualToValue={(city, selectedCity) => city.code === selectedCity.code}
      id={id}
    >
      <ComboboxInput placeholder={placeholder} className="h-12 w-full">
        <InputGroupAddon>{id === "origin" ? <MapPinHouse /> : <MapPin />}</InputGroupAddon>
        {isLoading ? (
          <InputGroupAddon align="inline-end" className="mr-7">
            <Spinner className="text-muted-foreground" />
          </InputGroupAddon>
        ) : null}
      </ComboboxInput>

      <ComboboxContent className="w-full">
        <ComboboxEmpty>{isLoading ? "Memuat kota..." : error ?? "Kota tidak ditemukan."}</ComboboxEmpty>

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
