import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";

// Auth
import LoginScreen from "./components/LoginScreen";
import AdminLogin from "./components/AdminLogin";

// User Layout & Pages
import UserLayout from "./components/UserLayout";
import UserDashboard from "./components/UserDashboard";
import MapPage from "./pages/MapPage";
import ReportHazard from "./components/ReportHazard";
import EmergencyHotlines from "./components/EmergencyHotlines";
import UserProfile from "./components/UserProfile";

// Admin Layout & Pages
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./components/AdminDashboard";
import AdminHazards from "./pages/AdminHazards";
import AdminEvacCenters from "./pages/AdminEvacCenters";
import AdminUsers from "./pages/AdminUsers";
import AdminReports from "./pages/AdminReports";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/" element={<LoginScreen />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* User Routes */}
            <Route element={<UserLayout />}>
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/report" element={<ReportHazard />} />
              <Route path="/hotlines" element={<EmergencyHotlines />} />
              <Route path="/profile" element={<UserProfile />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/hazards" element={<AdminHazards />} />
              <Route path="/admin/centers" element={<AdminEvacCenters />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/reports" element={<AdminReports />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
