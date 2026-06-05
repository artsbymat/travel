/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Search, Loader2, X, Navigation } from "lucide-react";

// Fix default marker icons for Leaflet in Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

interface LatLng {
  lat: number;
  lng: number;
}

interface LeafletMapPickerProps {
  value?: { lat: number; lng: number; address: string } | null;
  onChange: (data: { lat: number; lng: number; address: string }) => void;
  placeholder?: string;
  className?: string;
}

// Helper: reverse geocode via Nominatim
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "Accept-Language": "id" } }
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

// Helper: forward geocode via Nominatim
async function forwardGeocode(
  query: string
): Promise<{ lat: number; lng: number; display_name: string }[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=id`,
      { headers: { "Accept-Language": "id" } }
    );
    const data = await res.json();
    return data.map((item: any) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      display_name: item.display_name
    }));
  } catch {
    return [];
  }
}

function MapClickHandler({ onMapClick }: { onMapClick: (latlng: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    }
  });
  return null;
}

function FlyToPosition({ position }: { position: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 16, { duration: 0.8 });
    }
  }, [position, map]);
  return null;
}

export default function LeafletMapPicker({
  value,
  onChange,
  placeholder = "Cari lokasi atau klik di peta...",
  className = ""
}: LeafletMapPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [markerPos, setMarkerPos] = useState<LatLng | null>(
    value ? { lat: value.lat, lng: value.lng } : null
  );
  const [address, setAddress] = useState(value?.address || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { lat: number; lng: number; display_name: string }[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Default center: Indonesia center
  const defaultCenter: LatLng = { lat: 0.507, lng: 101.4478 };

  const handleMapClick = useCallback(
    async (latlng: LatLng) => {
      setMarkerPos(latlng);
      setGeocoding(true);
      const addr = await reverseGeocode(latlng.lat, latlng.lng);
      setAddress(addr);
      setGeocoding(false);
      onChange({ lat: latlng.lat, lng: latlng.lng, address: addr });
    },
    [onChange]
  );

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung deteksi lokasi (Geolocation).");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latlng = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setMarkerPos(latlng);
        setGeocoding(true);
        try {
          const addr = await reverseGeocode(latlng.lat, latlng.lng);
          setAddress(addr);
          onChange({ lat: latlng.lat, lng: latlng.lng, address: addr });
        } catch (err) {
          console.error(err);
        } finally {
          setGeocoding(false);
          setLocating(false);
        }
      },
      (error) => {
        console.error(error);
        alert("Gagal mendapatkan lokasi Anda. Pastikan izin lokasi telah diberikan.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (query.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await forwardGeocode(query);
      setSearchResults(results);
      setSearching(false);
    }, 500);
  };

  const handleSelectResult = (result: { lat: number; lng: number; display_name: string }) => {
    setMarkerPos({ lat: result.lat, lng: result.lng });
    setAddress(result.display_name);
    setSearchResults([]);
    setSearchQuery("");
    onChange({ lat: result.lat, lng: result.lng, address: result.display_name });
  };

  return (
    <div className={className}>
      {/* Display button / selected value */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-all hover:border-teal-400 hover:bg-teal-50/30 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
      >
        <MapPin className="h-5 w-5 shrink-0 text-teal-600" />
        <span
          className={`flex-1 truncate text-sm ${address ? "font-medium text-gray-800" : "text-gray-400"}`}
        >
          {address || placeholder}
        </span>
        {geocoding && <Loader2 className="h-4 w-4 animate-spin text-teal-600" />}
      </button>

      {/* Map Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Pilih Lokasi di Peta</h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Klik pada peta atau cari alamat di kotak pencarian.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative flex items-center gap-2 border-b bg-gray-50 px-5 py-3">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  placeholder="Cari alamat, jalan, atau lokasi..."
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-10 pl-10 text-sm text-gray-800 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                />
                {searching && (
                  <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-teal-600" />
                )}
              </div>

              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={locating}
                className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm transition-colors hover:border-teal-500 hover:text-teal-600 disabled:opacity-50"
              >
                {locating ? (
                  <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                ) : (
                  <Navigation className="h-4 w-4 text-teal-600" />
                )}
                <span>Lokasi Saya</span>
              </button>

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full right-5 left-5 z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectResult(result)}
                      className="flex w-full items-start gap-2.5 border-b border-gray-50 px-4 py-3 text-left text-sm text-gray-700 transition-colors last:border-b-0 hover:bg-teal-50"
                    >
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                      <span className="line-clamp-2">{result.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Map */}
            <div className="h-[380px] w-full">
              <MapContainer
                center={
                  markerPos
                    ? [markerPos.lat, markerPos.lng]
                    : [defaultCenter.lat, defaultCenter.lng]
                }
                zoom={markerPos ? 16 : 6}
                className="z-0 h-full w-full"
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onMapClick={handleMapClick} />
                <FlyToPosition position={markerPos} />
                {markerPos && <Marker position={[markerPos.lat, markerPos.lng]} />}
              </MapContainer>
            </div>

            {/* Footer: Selected Address */}
            <div className="flex items-center justify-between gap-4 border-t px-5 py-4">
              <div className="min-w-0 flex-1">
                {address ? (
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                    <div>
                      <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">
                        Lokasi Terpilih
                      </span>
                      <p className="mt-0.5 line-clamp-2 text-sm font-medium text-gray-800">
                        {address}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    Belum ada lokasi dipilih. Klik di peta atau cari.
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={!address}
                onClick={() => setIsOpen(false)}
                className="shrink-0 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Pilih
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
