import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const KEY_CORP = "scroll:/corporations";

function getScroll(): number {
    return window.scrollY || document.documentElement.scrollTop || 0;
}

function setScroll(y: number) {
    window.scrollTo(0, y);
}

export default function ScrollManager() {
    const location = useLocation();

    // Сохраняем скролл только для /corporations
    useEffect(() => {
        if (location.pathname !== "/corporations") return;

        let ticking = false;

        const save = () => {
            sessionStorage.setItem(KEY_CORP, String(getScroll()));
        };

        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                save();
                ticking = false;
            });
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        save();

        return () => {
            save();
            window.removeEventListener("scroll", onScroll);
        };
    }, [location.pathname]);

    // При ЛЮБОМ заходе на /corporations восстанавливаем позицию
    useEffect(() => {
        if (location.pathname !== "/corporations") return;

        const raw = sessionStorage.getItem(KEY_CORP);
        const y = raw ? Number(raw) : 0;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setScroll(Number.isFinite(y) ? y : 0);
                setTimeout(() => setScroll(Number.isFinite(y) ? y : 0), 120);
            });
        });
    }, [location.pathname]);

    return null;
}