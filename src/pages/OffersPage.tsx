// src/pages/OffersPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getLpOffers } from "../api/lpOffers";
import { getCorporations } from "../api/corporations";
import type { LpOfferDto } from "../types/lpOffer";
import type { CorporationDto } from "../types/corporation";

type SortKey = "name" | "lp" | "isk" | "market" | "profit";
type SortDir = "asc" | "desc";

function fmtInt(n: number): string {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

function fmtMoney(n: number | null | undefined): string {
    if (n === null || n === undefined) return "—";
    return fmtInt(n);
}

function cmpNullableNumber(a: number | null | undefined, b: number | null | undefined): number {
    const aNil = a === null || a === undefined;
    const bNil = b === null || b === undefined;
    if (aNil && bNil) return 0;
    if (aNil) return -1;
    if (bNil) return 1;
    return a - b;
}

function safeStr(v: unknown): string {
    return typeof v === "string" ? v : "";
}

function safeArray<T>(v: unknown): T[] {
    return Array.isArray(v) ? (v as T[]) : [];
}

const sortLabel: Record<SortKey, string> = {
    name: "Name",
    lp: "LP",
    isk: "ISK",
    market: "Market",
    profit: "Profit",
};

export default function OffersPage() {
    const { id } = useParams();
    const corporationId = Number(id);

    const [offers, setOffers] = useState<LpOfferDto[]>([]);
    const [corp, setCorp] = useState<CorporationDto | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // sort controls (no click-to-sort headers)
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    // search + filter
    const [query, setQuery] = useState("");
    const [onlyProfitable, setOnlyProfitable] = useState(false);

    // mobile deps expand
    const [expandedDeps, setExpandedDeps] = useState<Record<string, boolean>>({});

    // header tooltips (tap on mobile, hover on desktop)
    const [openTip, setOpenTip] = useState<string | null>(null);
    const headerTips: Record<string, string> = {
        name: "Item you receive from the LP store offer (name and quantity).",
        lp: "LP cost of the offer.",
        isk: "Additional ISK cost required by the offer.",
        market: "Estimated market price of the received item(s).",
        profit: "Estimated profit based on market price and required costs.",
        req: "Required items to complete the offer.",
    };

    useEffect(() => {
        if (!Number.isFinite(corporationId)) {
            setError("Invalid corporation id");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        (async () => {
            const [loadedOffers, corps] = await Promise.all([
                getLpOffers(corporationId),
                getCorporations(),
            ]);

            setOffers(loadedOffers);
            const found = corps.find((c) => c.corporation_id === corporationId) ?? null;
            setCorp(found);
        })()
            .catch((e: unknown) => {
                setError(e instanceof Error ? e.message : "Unknown error");
            })
            .finally(() => setLoading(false));
    }, [corporationId]);

    const filteredSortedOffers = useMemo(() => {
        const q = query.trim().toLowerCase();

        // 1) remove bad offers (name_get_item is null/empty) — do not render them
        let filtered = offers.filter((o) => safeStr((o as any).name_get_item).trim().length > 0);

        // 2) search
        if (q.length > 0) {
            filtered = filtered.filter((o) => safeStr((o as any).name_get_item).toLowerCase().includes(q));
        }

        // 3) profitable
        if (onlyProfitable) {
            filtered = filtered.filter((o) => ((o as any).profit ?? 0) > 0);
        }

        // 4) sort
        const dir = sortDir === "asc" ? 1 : -1;
        const copy = [...filtered];

        copy.sort((a, b) => {
            const aa = a as any;
            const bb = b as any;

            switch (sortKey) {
                case "name": {
                    const an = safeStr(aa.name_get_item);
                    const bn = safeStr(bb.name_get_item);
                    return dir * an.localeCompare(bn, undefined, { sensitivity: "base" });
                }
                case "lp":
                    return dir * ((aa.lp_cost ?? 0) - (bb.lp_cost ?? 0));
                case "isk":
                    return dir * ((aa.isk_cost ?? 0) - (bb.isk_cost ?? 0));
                case "market":
                    return dir * cmpNullableNumber(aa.market_price, bb.market_price);
                case "profit":
                    return dir * cmpNullableNumber(aa.profit, bb.profit);
                default:
                    return 0;
            }
        });

        return copy;
    }, [offers, query, onlyProfitable, sortKey, sortDir]);

    // select needs opaque background (dropdown too)
    const selectStyle: React.CSSProperties = {
        height: 44,
        borderRadius: 14,
        border: "none",
        background: "#070a14",
        color: "white",
        padding: "0 12px",
        outline: "none",
        fontWeight: 800,
        width: "100%",
    };

    const optionStyle: React.CSSProperties = {
        background: "#070a14",
        color: "white",
    };

    const sortRowStyle: React.CSSProperties = {
        display: "grid",
        gridTemplateColumns: "minmax(220px, 1fr) 44px",
        gap: 10,
        alignItems: "center",
        maxWidth: 520,
    };

    const dirBtnStyle: React.CSSProperties = {
        width: 44,
        height: 44,
        borderRadius: 14,
        border: "none",
        background: "rgba(0,0,0,0.18)",
        color: "white",
        cursor: "pointer",
        userSelect: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 900,
    };

    function toggleDir() {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }

    const dirIcon = sortDir === "asc" ? "↓" : "↑";

    return (
        <>
            <header className="appHeader">
                <div className="appHeaderInner">
                    <Link className="navBtn" to="/corporations">
                        LP Shop
                    </Link>
                </div>
            </header>

            <div className="appMain">
                <main className="pageBody">
                    {/* HERO */}
                    <section className="offersHero">
                        <div className="heroLeft">
                            {corp?.px256x256 ? (
                                <img className="heroCorpIcon" src={corp.px256x256} alt={corp.name} />
                            ) : (
                                <div className="heroCorpIcon" />
                            )}

                            <div>
                                <div className="heroTitle">{corp?.name ?? "Corporation"}</div>
                                <div className="heroMeta">
                                    {loading ? "Loading…" : error ? `Error: ${error}` : `Offers: ${offers.length}`}
                                </div>
                            </div>
                        </div>

                        <div className="heroRight">
                            {/* SEARCH */}
                            <div className="searchRow">
                                <input
                                    className="searchInput"
                                    placeholder="Search offers"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <button
                                    className="searchBtn"
                                    type="button"
                                    onClick={() => (document.activeElement as HTMLElement | null)?.blur?.()}
                                    aria-label="Search"
                                    title="Search"
                                >
                                    🔍
                                </button>
                            </div>

                            {/* SORT */}
                            <div style={{ fontWeight: 900, marginTop: 2 }}>Sort by</div>

                            <div style={sortRowStyle}>
                                <select
                                    style={selectStyle}
                                    value={sortKey}
                                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                                    aria-label="Sort field"
                                    title="Sort field"
                                >
                                    <option value="name" style={optionStyle}>{sortLabel.name}</option>
                                    <option value="lp" style={optionStyle}>{sortLabel.lp}</option>
                                    <option value="isk" style={optionStyle}>{sortLabel.isk}</option>
                                    <option value="market" style={optionStyle}>{sortLabel.market}</option>
                                    <option value="profit" style={optionStyle}>{sortLabel.profit}</option>
                                </select>

                                <button
                                    type="button"
                                    style={dirBtnStyle}
                                    onClick={toggleDir}
                                    aria-label="Toggle sort direction"
                                    title={sortDir === "asc" ? "Ascending" : "Descending"}
                                >
                                    {dirIcon}
                                </button>
                            </div>

                            {/* FILTER */}
                            <label className="checkRow">
                                <input
                                    type="checkbox"
                                    checked={onlyProfitable}
                                    onChange={(e) => setOnlyProfitable(e.target.checked)}
                                />
                                Show profitable offers
                            </label>
                        </div>
                    </section>

                    {/* DESKTOP TABLE */}
                    <section className="tableCard desktopOnly" onClick={() => setOpenTip(null)}>
                        <div className="tableWrap2">
                            <table className="offersTable" onClick={(e) => e.stopPropagation()}>
                                <thead>
                                <tr>
                                    <th className="thWithTip" align="left">
                      <span className="thLabel" onClick={() => setOpenTip((v) => (v === "name" ? null : "name"))}>
                        NAME
                      </span>
                                        <div className={`tipBubble ${openTip === "name" ? "open" : ""}`}>{headerTips.name}</div>
                                    </th>

                                    <th className="thWithTip" align="right">
                      <span className="thLabel" onClick={() => setOpenTip((v) => (v === "lp" ? null : "lp"))}>
                        LP
                      </span>
                                        <div className={`tipBubble ${openTip === "lp" ? "open" : ""}`}>{headerTips.lp}</div>
                                    </th>

                                    <th className="thWithTip" align="right">
                      <span className="thLabel" onClick={() => setOpenTip((v) => (v === "isk" ? null : "isk"))}>
                        ISK
                      </span>
                                        <div className={`tipBubble ${openTip === "isk" ? "open" : ""}`}>{headerTips.isk}</div>
                                    </th>

                                    <th className="thWithTip" align="right">
                      <span className="thLabel" onClick={() => setOpenTip((v) => (v === "market" ? null : "market"))}>
                        MARKET
                      </span>
                                        <div className={`tipBubble ${openTip === "market" ? "open" : ""}`}>{headerTips.market}</div>
                                    </th>

                                    <th className="thWithTip" align="right">
                      <span className="thLabel" onClick={() => setOpenTip((v) => (v === "profit" ? null : "profit"))}>
                        PROFIT
                      </span>
                                        <div className={`tipBubble ${openTip === "profit" ? "open" : ""}`}>{headerTips.profit}</div>
                                    </th>

                                    <th className="thWithTip" align="left">
                      <span className="thLabel" onClick={() => setOpenTip((v) => (v === "req" ? null : "req"))}>
                        REQUIREMENTS
                      </span>
                                        <div className={`tipBubble ${openTip === "req" ? "open" : ""}`}>{headerTips.req}</div>
                                    </th>
                                </tr>
                                </thead>

                                <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={6} style={{ padding: 18 }}>Loading…</td>
                                    </tr>
                                )}

                                {!loading && !error && filteredSortedOffers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ padding: 18 }}>No offers.</td>
                                    </tr>
                                )}

                                {!loading && !error && filteredSortedOffers.map((o, idx) => {
                                    const oo = o as any;
                                    const name = safeStr(oo.name_get_item);
                                    const icon = safeStr(oo.icon_get_item);
                                    const qty = Number.isFinite(oo.quantity) ? oo.quantity : 0;
                                    const reqs = safeArray<any>(oo.required_items);

                                    return (
                                        <tr key={`${name}-${idx}`}>
                                            <td>
                                                <div className="nameCell">
                                                    {icon ? <img className="itemIcon" src={icon} alt={name} /> : <div className="itemIcon" />}
                                                    <div className="itemTitle">{name} × {fmtInt(qty)}</div>
                                                </div>
                                            </td>

                                            <td align="right" style={{ fontVariantNumeric: "tabular-nums" }}>
                                                {fmtInt(oo.lp_cost ?? 0)}
                                            </td>

                                            <td align="right" style={{ fontVariantNumeric: "tabular-nums" }}>
                                                {fmtInt(oo.isk_cost ?? 0)}
                                            </td>

                                            <td align="right" style={{ fontVariantNumeric: "tabular-nums" }}>
                                                {fmtMoney(oo.market_price)}
                                            </td>

                                            <td align="right" style={{ fontVariantNumeric: "tabular-nums" }}>
                                                {fmtMoney(oo.profit)}
                                            </td>

                                            <td>
                                                <div className="depsList">
                                                    {reqs.map((r, rIdx) => {
                                                        const rn = safeStr(r?.name) || "Unknown";
                                                        const ri = safeStr(r?.icon);
                                                        const rq = Number.isFinite(r?.quantity) ? r.quantity : 0;
                                                        return (
                                                            <div key={`${rn}-${rIdx}`} className="depRow">
                                                                {ri ? <img className="depIcon" src={ri} alt={rn} /> : <div className="depIcon" />}
                                                                <div>{rn}</div>
                                                                <div className="depQty">× {fmtInt(rq)}</div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* MOBILE CARDS */}
                    <section className="tableCard mobileOnly">
                        <div className="offerCards">
                            {loading && <div style={{ padding: 8 }}>Loading…</div>}
                            {!loading && !error && filteredSortedOffers.length === 0 && <div style={{ padding: 8 }}>No offers.</div>}

                            {!loading && !error && filteredSortedOffers.map((o, idx) => {
                                const oo = o as any;
                                const name = safeStr(oo.name_get_item);
                                const icon = safeStr(oo.icon_get_item);
                                const qty = Number.isFinite(oo.quantity) ? oo.quantity : 0;
                                const deps = safeArray<any>(oo.required_items);

                                const cardKey = `${name}-${idx}`;
                                const isExpanded = expandedDeps[cardKey] === true;

                                const visibleCount = isExpanded ? deps.length : Math.min(2, deps.length);
                                const hiddenCount = Math.max(0, deps.length - visibleCount);

                                return (
                                    <div className="offerCard" key={cardKey}>
                                        <div className="offerCardTop">
                                            {icon ? <img className="itemIcon" src={icon} alt={name} /> : <div className="itemIcon" />}
                                            <div>
                                                <div className="offerCardTitle">{name}</div>
                                                <div className="offerCardSub">× {fmtInt(qty)}</div>
                                            </div>
                                        </div>

                                        <div className="kvGrid">
                                            <div className="kv">
                                                <div className="kvLabel">LP</div>
                                                <div className="kvValue">{fmtInt(oo.lp_cost ?? 0)}</div>
                                            </div>
                                            <div className="kv">
                                                <div className="kvLabel">ISK</div>
                                                <div className="kvValue">{fmtInt(oo.isk_cost ?? 0)}</div>
                                            </div>
                                            <div className="kv">
                                                <div className="kvLabel">Market</div>
                                                <div className="kvValue">{fmtMoney(oo.market_price)}</div>
                                            </div>
                                            <div className="kv">
                                                <div className="kvLabel">Profit</div>
                                                <div className="kvValue">{fmtMoney(oo.profit)}</div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="depsBlockTitle">Requirements</div>

                                            <div className="depsList">
                                                {deps.slice(0, visibleCount).map((r, rIdx) => {
                                                    const rn = safeStr(r?.name) || "Unknown";
                                                    const ri = safeStr(r?.icon);
                                                    const rq = Number.isFinite(r?.quantity) ? r.quantity : 0;
                                                    return (
                                                        <div key={`${rn}-${rIdx}`} className="depRow">
                                                            {ri ? <img className="depIcon" src={ri} alt={rn} /> : <div className="depIcon" />}
                                                            <div>{rn}</div>
                                                            <div className="depQty">× {fmtInt(rq)}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {hiddenCount > 0 && (
                                                <button
                                                    type="button"
                                                    className="showMoreBtn"
                                                    onClick={() => setExpandedDeps((prev) => ({ ...prev, [cardKey]: !isExpanded }))}
                                                >
                                                    {isExpanded ? "Hide" : `Show more (${hiddenCount})`}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </main>

                <footer className="appFooter">
                    <div className="appFooterInner">
                        <Link className="navBtn" to="/corporations">
                            Back to LP Shop
                        </Link>
                    </div>
                </footer>
            </div>
        </>
    );
}