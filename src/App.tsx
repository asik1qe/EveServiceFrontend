import { Routes, Route, Navigate } from "react-router-dom";
import CorporationsPage from "./pages/CorporationsPage";
import OffersPage from "./pages/OffersPage";
import ScrollManager from "./ScrollManager";

export default function App() {
    return (
        <>
            <ScrollManager />
            <Routes>
                <Route path="/" element={<Navigate to="/corporations" replace />} />
                <Route path="/corporations" element={<CorporationsPage />} />
                <Route path="/corporations/:id/offers" element={<OffersPage />} />
            </Routes>
        </>
    );
}