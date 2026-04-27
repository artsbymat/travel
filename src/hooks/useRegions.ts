"use client";

import { useState, useEffect, useCallback } from "react";

export interface Province {
    id: string;
    name: string;
    code?: string;
}

export interface City {
    id: string;
    name: string;
    code?: string;
    provinceId: string;
}

export function useRegions() {
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    const fetchProvinces = useCallback(async () => {
        setLoadingProvinces(true);
        try {
            const res = await fetch("/api/provinces");
            if (!res.ok) throw new Error("Failed to fetch provinces");
            const data = await res.json();
            setProvinces(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingProvinces(false);
        }
    }, []);

    const fetchCities = useCallback(async (provinceId: string) => {
        if (!provinceId) {
            setCities([]);
            return;
        }
        setLoadingCities(true);
        try {
            const res = await fetch(`/api/cities?provinceId=${provinceId}`);
            if (!res.ok) throw new Error("Failed to fetch cities");
            const data = await res.json();
            setCities(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingCities(false);
        }
    }, []);

    useEffect(() => {
        fetchProvinces();
    }, [fetchProvinces]);

    return {
        provinces,
        cities,
        loadingProvinces,
        loadingCities,
        fetchCities,
    };
}
