import type { CorporationDto } from "../types/corporation";

export async function getCorporations(): Promise<CorporationDto[]> {
    const res = await fetch("/api/corporations");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as CorporationDto[];
}