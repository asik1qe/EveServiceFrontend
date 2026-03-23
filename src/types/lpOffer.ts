export type LpRequiredItemDto = {
    name: string;
    icon: string;
    quantity: number;
    price_isk: number;
};

export type LpOfferDto = {
    name_get_item: string;
    icon_get_item: string;
    quantity: number;
    lp_cost: number;
    isk_cost: number;
    required_items: LpRequiredItemDto[];
    market_price: number | null;
    profit: number | null;
};