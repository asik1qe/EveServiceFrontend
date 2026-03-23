import type { LpOfferDto } from "../types/lpOffer";

export async function getLpOffers(corporationId: number): Promise<LpOfferDto[]> {
    const res = await fetch(`/api/all_card_offers/${corporationId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as LpOfferDto[];
}