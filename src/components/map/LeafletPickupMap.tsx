"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface PickupPoint {
  lat: number;
  lng: number;
  customerName: string;
  seatNo: string;
  address?: string;
  phone?: string;
}

interface LeafletPickupMapProps {
  points: PickupPoint[];
  className?: string;
}

function FitBounds({ points }: { points: PickupPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [points, map]);
  return null;
}

export default function LeafletPickupMap({ points, className = "" }: LeafletPickupMapProps) {
  if (points.length === 0) return null;

  const center = points.length > 0 ? [points[0].lat, points[0].lng] : [0.5070, 101.4478];

  return (
    <div className={`rounded-2xl overflow-hidden border shadow-sm ${className}`}>
      <MapContainer
        center={center as [number, number]}
        zoom={13}
        className="h-full w-full z-0"
        scrollWheelZoom
        style={{ minHeight: 320 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {points.map((point, idx) => (
          <Marker key={idx} position={[point.lat, point.lng]}>
            <Popup>
              <div className="text-xs min-w-[160px]">
                <div className="font-bold text-gray-900 text-sm">{point.customerName}</div>
                <div className="text-gray-500 mt-0.5">Kursi {point.seatNo}</div>
                {point.address && (
                  <div className="mt-1.5 text-gray-600 leading-relaxed">{point.address}</div>
                )}
                {point.phone && (
                  <div className="mt-1 text-teal-700 font-medium">{point.phone}</div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
