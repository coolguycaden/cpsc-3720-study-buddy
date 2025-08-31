// src/app/router.tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./layout";
import { RequireAuth } from "./guard";
import CreateProfile from "../features/auth/CreateProfile";
import Login from "../features/auth/Login";
import CoursesPage from "../features/courses/CoursesPage";
import ProfilePage from "../features/profiles/ProfilePage";
import SessionsPage from "../features/sessions/SessionsPage";

/**
 * Super simple dashboard stub.
 * Protected by <RequireAuth> in the route table below.
 */
function Dashboard() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p>Welcome. Next you will add courses and find classmates.</p>
    </div>
  );
}

/**
 * Route table:
 * - /onboard   → public onboarding (CreateProfile + Login)
 * - /, /dashboard, /courses → protected by <RequireAuth>
 *
 * We wrap protected pages with <RequireAuth><Layout>…</Layout></RequireAuth>
 * so: (1) we hydrate/check auth, (2) we render the shared shell, then content.
 */
const router = createBrowserRouter([
  {
    path: "/onboard",
    element: (
      <Layout>
        <div className="grid gap-8 md:grid-cols-2">
          <CreateProfile />
          <Login />
        </div>
      </Layout>
    ),
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <Layout>
          <Dashboard />
        </Layout>
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <RequireAuth>
        <Layout>
          <Dashboard />
        </Layout>
      </RequireAuth>
    ),
  },
  {
    path: "/courses",
    element: (
      <RequireAuth>
        <Layout>
          <CoursesPage />
        </Layout>
      </RequireAuth>
    ),
  },
  {
    path: "/profiles/:username",
    element: (
      <RequireAuth>
        <Layout>
          <ProfilePage />
        </Layout>
      </RequireAuth>
    ),
  },
  {path: "/sessions", 
  element: (
  <RequireAuth>
    <Layout>
      <SessionsPage/>
      </Layout>
      </RequireAuth>
  ),
  },
]);

/** Router root used by main.tsx */
export default function AppRouter() {
  return <RouterProvider router={router} />;
}
