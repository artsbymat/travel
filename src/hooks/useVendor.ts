/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Vendor } from "@/types/vendor-api";

export function useVendor(id?: string) {
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchVendor = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/vendors/${id}`);
            if (!res.ok) throw new Error("Failed to fetch vendor");
            const data = await res.json();
            setVendor(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchVendor();
    }, [fetchVendor]);

    return { vendor, loading, error, refresh: fetchVendor };
}
