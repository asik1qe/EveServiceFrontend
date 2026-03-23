// src/pages/CorporationsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCorporations } from "../api/corporations";
import type { CorporationDto } from "../types/corporation";

export default function CorporationsPage() {
    const [corporations, setCorporations] = useState<CorporationDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");

    useEffect(() => {
        setLoading(true);
        setError(null);

        getCorporations()
            .then(setCorporations)
            .catch((e: unknown) => setError(e instanceof Error ? e.message : "Unknown error"))
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return corporations;
        return corporations.filter((c) => c.name.toLowerCase().includes(q));
    }, [corporations, query]);

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
                    <section className="corpGridCard">
                        <div className="corpGridHeader">
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr minmax(260px, 380px)",
                                    gap: 16,
                                    alignItems: "start",
                                }}
                            >
                                {/* Left: title + search */}
                                <div>
                                    <h1 className="corpGridTitle">EVE LP Shop</h1>

                                    <div className="searchRow" style={{ marginTop: 12 }}>
                                        <input
                                            className="searchInput"
                                            placeholder="Search corporations"
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

                                    {loading && <div className="subtle" style={{ marginTop: 10 }}>Loading corporations…</div>}
                                    {error && <div style={{ marginTop: 10 }}>Error: {error}</div>}

                                    {!loading && !error && (
                                        <div style={{ marginTop: 14, fontWeight: 900 }}>
                                            Corporations
                                        </div>
                                    )}
                                </div>

                                {/* Right: description */}
                                <div
                                    style={{
                                        background: "rgba(0,0,0,0.18)",
                                        borderRadius: 14,
                                        padding: 12,
                                    }}
                                >
                                    <div style={{ fontWeight: 900, marginBottom: 6 }}>Overview</div>
                                    <div className="subtle">
                                        This tool shows Loyalty Points (LP) Store offers for EVE Online NPC corporations.
                                        Pick a corporation to view offers, required items, market price and profit.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="corpGrid">
                            {!loading && !error && filtered.map((c) => (
                                <Link
                                    key={c.corporation_id}
                                    to={`/corporations/${c.corporation_id}/offers`}
                                    className="corpTile"
                                    title={c.name}
                                >
                                    <div className="corpTileImgWrap">
                                        {c.px256x256 ? (
                                            <img className="corpTileImg" src={c.px256x256} alt={c.name} />
                                        ) : (
                                            <div className="corpTilePlaceholder" />
                                        )}
                                    </div>
                                    <div className="corpTileFooter">{c.name}</div>
                                </Link>
                            ))}

                            {!loading && !error && filtered.length === 0 && (
                                <div className="subtle" style={{ padding: 12 }}>Nothing found.</div>
                            )}
                        </div>
                    </section>
                </main>

                <footer className="appFooter">
                    <div className="appFooterInner">
                        <span className="subtle">EVE LP Shop</span>
                    </div>
                </footer>
            </div>
        </>
    );
}