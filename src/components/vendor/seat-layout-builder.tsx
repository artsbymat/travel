"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Minus, RotateCcw, Armchair, CircleUserRound, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SeatItem = {
    no: string;
    row: number;
    col: number;
};

export type SeatLayout = {
    rows: number;
    columns: number;
    rowColumns?: number[]; // per-row column count, e.g. [2, 3, 4]
    seats: SeatItem[];
    driverSeat?: { row: number; col: number } | null;
};

interface SeatLayoutBuilderProps {
    value: SeatLayout | null;
    onChange: (layout: SeatLayout) => void;
}

const COL_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function generateSeatNo(row: number, col: number): string {
    return `${row}${COL_LABELS[col - 1] || col}`;
}

/**
 * All positions default to SEAT.
 * Click a seat to mark it as EMPTY (aisle/no seat).
 * Use driver mode to mark the driver position.
 * Vendor defines vehicle structure only — not passengers.
 */
export function SeatLayoutBuilder({ value, onChange }: SeatLayoutBuilderProps) {
    const [rowColumns, setRowColumns] = useState<number[]>(
        value?.rowColumns || Array(value?.rows || 3).fill(value?.columns || 3)
    );
    // emptyPositions = positions that are NOT seats (aisles, no-seat areas)
    const [emptyPositions, setEmptyPositions] = useState<Set<string>>(new Set());
    const [driverSeat, setDriverSeat] = useState<string | null>(null);
    const [driverMode, setDriverMode] = useState(false);

    const totalRows = rowColumns.length;
    const maxCols = Math.max(...rowColumns, 1);

    // Initialize from value
    useEffect(() => {
        if (value) {
            const seatKeys = new Set(value.seats.map((s) => `${s.row}-${s.col}`));
            const rc = value.rowColumns || Array(value.rows).fill(value.columns);

            // Calculate empty positions = all positions minus seats minus driver
            const empty = new Set<string>();
            for (let r = 1; r <= rc.length; r++) {
                for (let c = 1; c <= rc[r - 1]; c++) {
                    const key = `${r}-${c}`;
                    const isDriver = value.driverSeat && value.driverSeat.row === r && value.driverSeat.col === c;
                    if (!seatKeys.has(key) && !isDriver) {
                        empty.add(key);
                    }
                }
            }
            setEmptyPositions(empty);
            setRowColumns(rc);
        }
        if (value?.driverSeat) {
            setDriverSeat(`${value.driverSeat.row}-${value.driverSeat.col}`);
        }
    }, []); // Only on mount

    const buildLayout = useCallback(
        (currentRowCols: number[], currentEmpty: Set<string>, currentDriver: string | null): SeatLayout => {
            const seats: SeatItem[] = [];
            const numRows = currentRowCols.length;
            const maxColumns = Math.max(...currentRowCols, 1);

            for (let r = 1; r <= numRows; r++) {
                const cols = currentRowCols[r - 1];
                for (let c = 1; c <= cols; c++) {
                    const key = `${r}-${c}`;
                    // A seat = not empty AND not driver
                    if (!currentEmpty.has(key) && key !== currentDriver) {
                        seats.push({ no: generateSeatNo(r, c), row: r, col: c });
                    }
                }
            }

            let driverSeatData: { row: number; col: number } | null = null;
            if (currentDriver) {
                const [dr, dc] = currentDriver.split("-").map(Number);
                if (dr <= numRows && dc <= currentRowCols[dr - 1]) {
                    driverSeatData = { row: dr, col: dc };
                }
            }

            return {
                rows: numRows,
                columns: maxColumns,
                rowColumns: currentRowCols,
                seats,
                driverSeat: driverSeatData,
            };
        },
        []
    );

    const emitChange = useCallback(
        (newRowCols: number[], newEmpty: Set<string>, newDriver: string | null) => {
            // Filter out positions outside grid
            const filtered = new Set<string>();
            newEmpty.forEach((key) => {
                const [r, c] = key.split("-").map(Number);
                if (r <= newRowCols.length && c <= newRowCols[r - 1]) {
                    filtered.add(key);
                }
            });
            let validDriver = newDriver;
            if (validDriver) {
                const [dr, dc] = validDriver.split("-").map(Number);
                if (dr > newRowCols.length || dc > newRowCols[dr - 1]) validDriver = null;
            }
            onChange(buildLayout(newRowCols, filtered, validDriver));
        },
        [buildLayout, onChange]
    );

    const handleCellClick = (row: number, col: number) => {
        const key = `${row}-${col}`;

        if (driverMode) {
            // Toggle driver seat
            if (driverSeat === key) {
                setDriverSeat(null);
                emitChange(rowColumns, emptyPositions, null);
            } else {
                // Remove old driver from empty (if it was empty)
                const newEmpty = new Set(emptyPositions);
                newEmpty.delete(key); // Driver position should not be empty
                setEmptyPositions(newEmpty);
                setDriverSeat(key);
                emitChange(rowColumns, newEmpty, key);
            }
        } else {
            // Can't toggle driver position in normal mode
            if (key === driverSeat) return;
            // Toggle empty/seat
            const newEmpty = new Set(emptyPositions);
            if (newEmpty.has(key)) {
                newEmpty.delete(key); // Make it a seat again
            } else {
                newEmpty.add(key); // Mark as empty/aisle
            }
            setEmptyPositions(newEmpty);
            emitChange(rowColumns, newEmpty, driverSeat);
        }
    };

    const addRow = () => {
        if (totalRows >= 15) return;
        const lastCols = rowColumns[rowColumns.length - 1] || 3;
        const newRowCols = [...rowColumns, lastCols];
        setRowColumns(newRowCols);
        emitChange(newRowCols, emptyPositions, driverSeat);
    };

    const removeRow = () => {
        if (totalRows <= 1) return;
        const newRowCols = rowColumns.slice(0, -1);
        setRowColumns(newRowCols);
        emitChange(newRowCols, emptyPositions, driverSeat);
    };

    const setRowColCount = (rowIndex: number, newCols: number) => {
        if (newCols < 1 || newCols > 6) return;
        const newRowCols = [...rowColumns];
        newRowCols[rowIndex] = newCols;
        setRowColumns(newRowCols);
        emitChange(newRowCols, emptyPositions, driverSeat);
    };

    const resetAll = () => {
        setEmptyPositions(new Set<string>());
        setDriverSeat(null);
        setDriverMode(false);
        emitChange(rowColumns, new Set<string>(), null);
    };

    // Count active passenger seats
    const seatCount = (() => {
        let count = 0;
        for (let r = 1; r <= totalRows; r++) {
            for (let c = 1; c <= rowColumns[r - 1]; c++) {
                const key = `${r}-${c}`;
                if (!emptyPositions.has(key) && key !== driverSeat) {
                    count++;
                }
            }
        }
        return count;
    })();

    return (
        <div className="flex flex-col gap-4">
            {/* Row Controls */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-600">Baris</span>
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                        <button type="button" onClick={removeRow} disabled={totalRows <= 1}
                            className="px-2.5 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors disabled:opacity-30">
                            <Minus size={14} />
                        </button>
                        <span className="px-3 py-2 text-sm font-bold text-slate-800 min-w-[2.5rem] text-center border-x border-slate-200 bg-slate-50/50">
                            {totalRows}
                        </span>
                        <button type="button" onClick={addRow} disabled={totalRows >= 15}
                            className="px-2.5 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors disabled:opacity-30">
                            <Plus size={14} />
                        </button>
                    </div>
                </div>
                <div className="flex gap-1.5 ml-auto">
                    <Button type="button" variant="ghost" size="xs" onClick={resetAll} className="rounded-lg text-xs text-slate-500">
                        <RotateCcw size={12} className="mr-1" /> Reset
                    </Button>
                </div>
            </div>

            {/* Driver Mode Toggle */}
            <button
                type="button"
                onClick={() => setDriverMode(!driverMode)}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                    driverMode
                        ? "bg-amber-50 text-amber-700 border-amber-300 shadow-sm"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                }`}
            >
                <CircleUserRound size={14} />
                {driverMode ? "Mode Supir Aktif — klik posisi supir" : "Tandai Posisi Supir"}
            </button>

            {/* Info */}
            <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                {driverMode ? (
                    <span className="text-amber-600">🚗 Klik posisi di grid untuk menandai kursi supir. Hanya 1 posisi.</span>
                ) : (
                    <span>💡 Semua posisi adalah <strong>kursi</strong> secara default. Klik posisi untuk jadikan <strong>kosong/gang</strong>.</span>
                )}
            </div>

            {/* Seat Grid */}
            <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 pb-5 overflow-x-auto">
                {/* Vehicle Front Indicator */}
                <div className="flex items-center justify-center gap-2 mb-4 pb-3 border-b border-dashed border-slate-300">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 whitespace-nowrap">
                        Depan Kendaraan
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                </div>

                {/* Per-Row Grid */}
                <div className="flex flex-col gap-2 items-center">
                    {rowColumns.map((cols, rowIdx) => {
                        const rowNum = rowIdx + 1;
                        return (
                            <div key={rowNum} className="flex items-center gap-2 w-full justify-center">
                                {/* Row label + col adjuster */}
                                <div className="flex flex-col items-center gap-0.5 w-8 shrink-0">
                                    <span className="text-[10px] font-bold text-slate-400">{rowNum}</span>
                                    <div className="flex items-center gap-0">
                                        <button type="button" onClick={() => setRowColCount(rowIdx, cols - 1)} disabled={cols <= 1}
                                            className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-slate-600 disabled:opacity-20 rounded transition-colors">
                                            <Minus size={8} />
                                        </button>
                                        <span className="text-[9px] font-bold text-slate-500 min-w-[0.75rem] text-center">{cols}</span>
                                        <button type="button" onClick={() => setRowColCount(rowIdx, cols + 1)} disabled={cols >= 6}
                                            className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-slate-600 disabled:opacity-20 rounded transition-colors">
                                            <Plus size={8} />
                                        </button>
                                    </div>
                                </div>

                                {/* Seat cells for this row */}
                                <div className="flex gap-1.5 justify-center"
                                    style={{ width: `${maxCols * 3}rem` }}>
                                    {Array.from({ length: cols }, (_, c) => {
                                        const colNum = c + 1;
                                        const cellKey = `${rowNum}-${colNum}`;
                                        const isEmpty = emptyPositions.has(cellKey);
                                        const isDriver = driverSeat === cellKey;
                                        const seatNo = generateSeatNo(rowNum, colNum);

                                        let cellStyle: string;
                                        let icon: React.ReactNode;
                                        let label: string;
                                        let labelColor: string;

                                        if (isDriver) {
                                            cellStyle = "bg-amber-50 border-amber-400 text-amber-700 shadow-sm hover:bg-amber-100 ring-2 ring-amber-200/50";
                                            icon = <CircleUserRound size={13} className="shrink-0 text-amber-600" />;
                                            label = "🚗";
                                            labelColor = "text-amber-500";
                                        } else if (isEmpty) {
                                            cellStyle = "bg-slate-100 border-slate-200 text-slate-300 hover:border-slate-300 hover:bg-slate-150 border-dashed";
                                            icon = <Ban size={13} className="shrink-0 text-slate-300" />;
                                            label = "";
                                            labelColor = "text-slate-300";
                                        } else {
                                            // Active seat (default)
                                            cellStyle = "bg-primary/10 border-primary/40 text-primary shadow-sm hover:bg-primary/20 hover:border-primary/60";
                                            icon = <Armchair size={13} className="shrink-0 text-primary" />;
                                            label = seatNo;
                                            labelColor = "text-primary/70";
                                        }

                                        return (
                                            <button
                                                key={cellKey}
                                                type="button"
                                                onClick={() => handleCellClick(rowNum, colNum)}
                                                className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-all duration-150 border-2 shrink-0 ${cellStyle}`}
                                                title={
                                                    isDriver ? "Kursi Supir — klik untuk hapus"
                                                    : isEmpty ? "Kosong/Gang — klik untuk jadikan kursi"
                                                    : driverMode ? "Klik untuk tandai sebagai supir"
                                                    : "Kursi aktif — klik untuk jadikan kosong"
                                                }
                                            >
                                                {icon}
                                                {label && (
                                                    <span className={`text-[7px] font-bold leading-none ${labelColor}`}>
                                                        {label}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Column labels */}
                {maxCols > 0 && (
                    <div className="flex gap-1.5 justify-center mt-2" style={{ marginLeft: "2.5rem", width: `${maxCols * 3}rem` }}>
                        {Array.from({ length: maxCols }, (_, c) => (
                            <div key={c} className="w-10 h-4 flex items-center justify-center text-[9px] font-bold text-slate-400 uppercase shrink-0">
                                {COL_LABELS[c]}
                            </div>
                        ))}
                    </div>
                )}

                {/* Vehicle Back Indicator */}
                <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-dashed border-slate-300">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 whitespace-nowrap">
                        Belakang Kendaraan
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                </div>
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded bg-primary/20 border border-primary/40" />
                        Kursi
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded bg-amber-100 border border-amber-400" />
                        Supir
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded bg-slate-100 border border-slate-200 border-dashed" />
                        Kosong
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {driverSeat && (
                        <div className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[11px] font-bold">
                            1 Supir
                        </div>
                    )}
                    <div className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-[11px] font-bold">
                        {seatCount} Kursi
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Mini seat preview for table display
 */
export function SeatLayoutPreview({ layout }: { layout: SeatLayout | null }) {
    if (!layout || !layout.seats || layout.seats.length === 0) {
        return <span className="text-xs text-slate-400">—</span>;
    }

    const activeKeys = new Set(layout.seats.map((s) => `${s.row}-${s.col}`));
    const driverKey = layout.driverSeat ? `${layout.driverSeat.row}-${layout.driverSeat.col}` : null;
    const perRow = layout.rowColumns || Array(layout.rows).fill(layout.columns);

    return (
        <div className="flex flex-col gap-0.5 items-center">
            {Array.from({ length: layout.rows }, (_, r) => {
                const cols = perRow[r] || layout.columns;
                return (
                    <div key={r} className="flex gap-0.5 justify-center">
                        {Array.from({ length: cols }, (_, c) => {
                            const key = `${r + 1}-${c + 1}`;
                            const isDriver = key === driverKey;
                            const isActive = activeKeys.has(key);
                            return (
                                <div
                                    key={c}
                                    className={`w-2.5 h-2.5 rounded-sm ${
                                        isDriver ? "bg-amber-400"
                                        : isActive ? "bg-primary/60"
                                        : "bg-slate-200/60"
                                    }`}
                                />
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}
