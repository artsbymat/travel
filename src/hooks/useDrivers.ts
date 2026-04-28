/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Driver, DriverCreatePayload, DriverUpdatePayload } from "@/types/driver-api";

export function useDrivers(vendorId?: string) {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDrivers = useCallback(async () => {
        setLoading(true);
        try {
            const url = vendorId 
                ? `/api/admin/drivers?vendorId=${vendorId}` 
                : "/api/admin/drivers";
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch drivers");
            const data = await res.json();
            setDrivers(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [vendorId]);

    useEffect(() => {
        fetchDrivers();
    }, [fetchDrivers]);

    const createDriver = async (payload: DriverCreatePayload) => {
        try {
            const res = await fetch("/api/admin/drivers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) fetchDrivers();
            return res;
        } catch (err: any) {
            return { ok: false, json: () => Promise.resolve({ error: err.message }) };
        }
    };

    const updateDriver = async (id: string, payload: DriverUpdatePayload) => {
        try {
            const res = await fetch(`/api/admin/drivers/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) fetchDrivers();
            return res;
        } catch (err: any) {
            return { ok: false, json: () => Promise.resolve({ error: err.message }) };
        }
    };

    const deleteDriver = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/drivers/${id}`, {
                method: "DELETE",
            });
            if (res.ok) fetchDrivers();
            return res;
        } catch (err: any) {
            return { ok: false, json: () => Promise.resolve({ error: err.message }) };
        }
    };

    return { 
        drivers, 
        loading, 
        error, 
        createDriver, 
        updateDriver, 
        deleteDriver, 
        refresh: fetchDrivers 
    };
}
