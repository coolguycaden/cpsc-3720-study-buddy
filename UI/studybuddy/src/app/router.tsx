import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./layout";
import { RequireAuth } from "./guard";
import CreateProfile from "../features/auth/CreateProfile";
import Login from "../features/auth/Login";
import CoursesPage from "../features/courses/CoursesPage";



function Dashboard() {
  return <div className="space-y-2">
    <h1 className="text-2xl font-semibold">Dashboard</h1>
    <p>Welcome. Next you will add courses and find classmates.</p>
  </div>;
}

const router = createBrowserRouter([
  { path: "/onboard", element: (
      <Layout>
        <div className="grid gap-8 md:grid-cols-2">
          <CreateProfile />
          <Login />
        </div>
      </Layout>
    ) },
  { path: "/", element: <RequireAuth><Layout><Dashboard/></Layout></RequireAuth> },
  { path: "/dashboard", element: <RequireAuth><Layout><Dashboard/></Layout></RequireAuth> },
  { path: "/courses", element: <RequireAuth><Layout><CoursesPage/></Layout></RequireAuth> },
]);

export default function AppRouter() { return <RouterProvider router={router} />; }
