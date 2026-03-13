import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import { trackPageView } from "@/lib/analytics";
import { isGoogleClientIdUsable, sanitizeGoogleClientId } from "@/lib/google-oauth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Index from "./pages/Index.tsx";
import Boats from "./pages/Boats.tsx";
import BoatDetails from "./pages/BoatDetails.tsx";
import DestinationsPage from "./pages/DestinationsPage.tsx";
import About from "./pages/About.tsx";
import OwnerProfile from "./pages/OwnerProfile.tsx";
import OwnerDashboard from "./pages/OwnerDashboard.tsx";
import CustomerProfile from "./pages/CustomerProfile.tsx";
import ContactOwner from "./pages/ContactOwner.tsx";
import Booking from "./pages/Booking.tsx";
import Chat from "./pages/Chat.tsx";
import History from "./pages/History.tsx";
import OwnerFleet from "./pages/OwnerFleet.tsx";
import BecomeOwner from "./pages/BecomeOwner.tsx";
import Settings from "./pages/Settings.tsx";
import PostTripReview from "./pages/PostTripReview.tsx";
import BusinessPromotions from "./pages/BusinessPromotions.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import TermsOfService from "./pages/TermsOfService.tsx";
import CookiePolicy from "./pages/CookiePolicy.tsx";
import RefundPolicy from "./pages/RefundPolicy.tsx";
import BoatOwnerAgreement from "./pages/BoatOwnerAgreement.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();
const googleClientId = sanitizeGoogleClientId(import.meta.env.VITE_GOOGLE_CLIENT_ID);
const hasUsableGoogleClientId = isGoogleClientIdUsable(googleClientId);

const RouteAnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const pathWithQuery = `${location.pathname}${location.search}`;
    trackPageView({
      path: pathWithQuery,
      pageTitle: document.title,
    });
  }, [location.pathname, location.search]);

  return null;
};

const RoleLoadingScreen = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="pt-24">
      <div className="container mx-auto px-4">
        <p className="text-sm text-muted-foreground">Checking account role...</p>
      </div>
    </main>
  </div>
);

type ResolvedRole = "visitor" | "customer" | "owner";

const useResolvedRole = () => {
  const { user, isLoading } = useCurrentUser();
  const [role, setRole] = useState<ResolvedRole>("visitor");
  const [isRoleLoading, setIsRoleLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const resolveRole = async () => {
      if (isLoading) {
        if (!cancelled) {
          setIsRoleLoading(true);
        }
        return;
      }

      if (!user) {
        if (!cancelled) {
          setRole("visitor");
          setIsRoleLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setRole(user.isOwner ? "owner" : "customer");
        setIsRoleLoading(false);
      }
    };

    resolveRole();

    return () => {
      cancelled = true;
    };
  }, [isLoading, user]);

  return { role, isRoleLoading };
};

const RoleRouter = () => {
  const { role, isRoleLoading } = useResolvedRole();

  if (isRoleLoading) {
    return <RoleLoadingScreen />;
  }

  if (role === "owner") {
    return <OwnerProfile />;
  }

  return <Index />;
};

const CustomerRoute = ({ children }: { children: JSX.Element }) => {
  const { role, isRoleLoading } = useResolvedRole();

  if (isRoleLoading) {
    return <RoleLoadingScreen />;
  }

  if (role === "visitor") {
    return <Navigate to="/" replace />;
  }

  return children;
};

const OwnerRoute = ({ children }: { children: JSX.Element }) => {
  const { role, isRoleLoading } = useResolvedRole();

  if (isRoleLoading) {
    return <RoleLoadingScreen />;
  }

  if (role === "visitor") {
    return <Navigate to="/" replace />;
  }

  if (role !== "owner") {
    return <Navigate to="/customer-profile" replace />;
  }

  return children;
};

const AppRoutes = () => (
  <BrowserRouter>
    <RouteAnalyticsTracker />
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/boats" element={<Boats />} />
      <Route path="/boats/:boatId" element={<BoatDetails />} />
      <Route path="/destinations" element={<DestinationsPage />} />
      <Route path="/about" element={<About />} />
      <Route path="/owner-profile" element={<OwnerRoute><OwnerProfile /></OwnerRoute>} />
      <Route path="/owner-dashboard" element={<OwnerRoute><OwnerDashboard /></OwnerRoute>} />
      <Route path="/owners/:ownerSlug" element={<OwnerFleet />} />
      <Route path="/portal" element={<RoleRouter />} />
      <Route path="/admin" element={<Navigate to="/portal" replace />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/customer-profile" element={<CustomerRoute><CustomerProfile /></CustomerRoute>} />
      <Route path="/history" element={<History />} />
      <Route path="/contact-owner" element={<ContactOwner />} />
      <Route path="/booking" element={<Booking />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/become-owner" element={<BecomeOwner />} />
      <Route path="/post-trip-review" element={<PostTripReview />} />
      <Route path="/business-promotions" element={<BusinessPromotions />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/cookie-policy" element={<CookiePolicy />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/boat-owner-agreement" element={<BoatOwnerAgreement />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {hasUsableGoogleClientId ? (
        <GoogleOAuthProvider clientId={googleClientId}>
          <AppRoutes />
        </GoogleOAuthProvider>
      ) : (
        <AppRoutes />
      )}
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
