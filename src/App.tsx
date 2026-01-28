import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";

// Auth
import LoginScreen from "./components/LoginScreen";
import AdminLogin from "./components/AdminLogin";
import ProtectedRoute from "./components/ProtectedRoute";

// User Layout & Pages
import UserLayout from "./components/UserLayout";
import UserDashboard from "./components/UserDashboard";
import MapPage from "./pages/MapPage";
import FindRoutePage from "./pages/FindRoutePage";
import ReportHazard from "./components/ReportHazard";
import EmergencyHotlines from "./components/EmergencyHotlines";
import UserProfile from "./components/UserProfile";
import HelpPage from "./pages/HelpPage";

// Admin Layout & Pages
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./components/AdminDashboard";
import AdminHazards from "./pages/AdminHazards";
import AdminEvacCenters from "./pages/AdminEvacCenters";
import AdminUsers from "./pages/AdminUsers";
import AdminReports from "./pages/AdminReports";
import AdminMap from "./pages/AdminMap";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
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
              <Route element={
                <ProtectedRoute>
                  <UserLayout />
                </ProtectedRoute>
              }>
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/find-route" element={<FindRoutePage />} />
                <Route path="/report" element={<ReportHazard />} />
                <Route path="/hotlines" element={<EmergencyHotlines />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/profile" element={<UserProfile />} />
              </Route>

              {/* Admin Routes */}
              <Route element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/hazards" element={<AdminHazards />} />
                <Route path="/admin/centers" element={<AdminEvacCenters />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/admin/map" element={<AdminMap />} />
                <Route path="/admin/hotlines" element={<EmergencyHotlines />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
