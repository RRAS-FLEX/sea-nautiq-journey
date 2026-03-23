import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { Route, Routes } from "react-router-dom";
import { StaticRouter } from "react-router-dom/server";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "@/pages/Index";
import Boats from "@/pages/Boats";
import DestinationsPage from "@/pages/DestinationsPage";
import About from "@/pages/About";
import NotFound from "@/pages/NotFound";

const prerenderedRoutes = ["/", "/boats", "/destinations", "/about"];

const getHeadTitle = (url: string) => {
  if (url === "/boats") {
    return "Browse Boats for Rent in Greece | Nautiplex";
  }

  if (url === "/destinations") {
    return "Greek Island Boating Destinations | Nautiplex";
  }

  if (url === "/about") {
    return "About Nautiplex — Greece's Trusted Boat Rental Platform";
  }

  return "Nautiplex — Boat Rentals & Sea Experiences in Greece";
};

export async function prerender({ url }: { url: string }) {
  const queryClient = new QueryClient();

  const html = renderToString(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <StaticRouter location={url} future={{ v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/boats" element={<Boats />} />
            <Route path="/destinations" element={<DestinationsPage />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </StaticRouter>
      </TooltipProvider>
    </QueryClientProvider>,
  );

  return {
    html,
    links: new Set(prerenderedRoutes),
    head: {
      title: getHeadTitle(url),
      elements: new Set([
        {
          type: "meta",
          props: {
            name: "prerendered",
            content: "true",
          },
        },
      ]),
    },
  };
}
