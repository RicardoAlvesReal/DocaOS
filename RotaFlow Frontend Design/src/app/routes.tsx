import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { DashboardLayout } from "./pages/DashboardLayout";
import { DashboardOverview } from "./pages/DashboardOverview";
import { Vehicles } from "./pages/Vehicles";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/dashboard",
    Component: DashboardLayout,
    children: [
      { index: true, Component: DashboardOverview },
      { path: "vehicles", Component: Vehicles },
      { path: "*", Component: NotFound },
    ],
  },
]);
