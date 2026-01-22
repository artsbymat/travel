"use client";

import {
  Map,
  MapDrawControl,
  MapDrawDelete,
  MapDrawMarker,
  MapLocateControl,
  MapMarker,
  MapSearchControl,
  MapTileLayer,
} from "@/components/ui/map";

import { MapPin, MapPinIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useMap } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import { useEffect, useState } from "react";

interface MapLocationSelectorProps {
  title: string;
}

export function MapLocationSelector({ title }: MapLocationSelectorProps) {
  const PEKANBARU_COORDINATES: [number, number] = [
    0.505107440251982, 101.44386398079521,
  ] satisfies LatLngExpression;

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
        <MapPin className="h-5 w-5 text-chart-2" />
        {title}
      </h3>
      <Map center={PEKANBARU_COORDINATES} className="h-96 w-full">
        <MapTileLayer />
        <MapDrawControl>
          <MapDrawMarker />
          <MapDrawDelete />
        </MapDrawControl>
        <MapLocateControl />
        <MapSearchControlWrapper />
      </Map>
    </Card>
  );
}

function MapSearchControlWrapper() {
  const map = useMap();
  const [selectedPosition, setSelectedPosition] =
    useState<LatLngExpression | null>(null);
  useEffect(() => {
    if (!selectedPosition) return;
    map.panTo(selectedPosition);
  }, [selectedPosition]);
  return (
    <>
      <MapSearchControl
        onPlaceSelect={(feature) =>
          setSelectedPosition(
            feature.geometry.coordinates.toReversed() as LatLngExpression,
          )
        }
      />
      {selectedPosition && (
        <MapMarker position={selectedPosition} icon={<MapPinIcon />} />
      )}
    </>
  );
}
