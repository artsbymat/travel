"use client";

import {
  Map,
  MapDrawControl,
  MapDrawMarker,
  MapMarker,
  MapSearchControl,
  MapTileLayer,
  useLeaflet,
} from "@/components/ui/map";

import { MapPin, MapPinIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useMap } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import { useEffect, useState } from "react";
import { Textarea } from "../ui/textarea";
import { Spinner } from "../ui/spinner";

interface MapLocationSelectorProps {
  title: string;
  dropoffCoordinate?: LatLngExpression;
  setDropoffCoordinate?: (coord: LatLngExpression) => void;
}

export function MapDropoffSelector({
  title,
  dropoffCoordinate,
  setDropoffCoordinate,
}: MapLocationSelectorProps) {
  const PEKANBARU_COORDINATES: [number, number] = [
    0.505107440251982, 101.44386398079521,
  ] satisfies LatLngExpression;

  const { L } = useLeaflet();

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
        <MapPin className="h-5 w-5 text-chart-2" />
        {title}
      </h3>
      <Textarea placeholder="Masukkan alamat pengantaran" />

      {L ? (
        <Map center={PEKANBARU_COORDINATES} className="h-96 w-full">
          <MapTileLayer />
          <MapDrawControl
            onLayersChange={(layers) => {
              let lastMarker: any = null;

              layers.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                  lastMarker = layer;
                }
              });

              if (lastMarker) {
                layers.eachLayer((layer) => {
                  if (layer instanceof L.Marker && layer !== lastMarker) {
                    layers.removeLayer(layer);
                  }
                });

                const latlng = lastMarker.getLatLng();
                setDropoffCoordinate?.(latlng);
              }
            }}
          >
            {dropoffCoordinate && <MapDrawMarker />}
          </MapDrawControl>
          <MapSearchControlWrapper />
        </Map>
      ) : (
        <Spinner />
      )}
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
