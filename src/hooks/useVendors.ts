/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Vendor, VendorCreatePayload, VendorUpdatePayload } from "@/types/vendor-api";

export function useVendors() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchVendors = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/vendors");
            if (!res.ok) throw new Error("Failed to fetch vendors");
            const data = await res.json();
            setVendors(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVendors();
    }, [fetchVendors]);

    const createVendor = async (payload: VendorCreatePayload) => {
        try {
            const res = await fetch("/api/admin/vendors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) fetchVendors();
            return res;
        } catch (err: any) {
            return { ok: false, json: () => Promise.resolve({ error: err.message }) };
        }
    };

    const updateVendor = async (id: string, payload: VendorUpdatePayload) => {
        try {
            const res = await fetch(`/api/admin/vendors/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) fetchVendors();
            return res;
        } catch (err: any) {
            return { ok: false, json: () => Promise.resolve({ error: err.message }) };
        }
    };

    const deleteVendor = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/vendors/${id}`, {
                method: "DELETE",
            });
            if (res.ok) fetchVendors();
            return res;
        } catch (err: any) {
            return { ok: false, json: () => Promise.resolve({ error: err.message }) };
        }
    };

    return { vendors, loading, error, createVendor, updateVendor, deleteVendor, refresh: fetchVendors };
}
