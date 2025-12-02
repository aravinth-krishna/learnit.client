import { createBrowserRouter } from "react-router-dom";

import LandingPage from "./components/home/LandingPage.jsx";

import Signin from "./components/auth/Signin.jsx";
import Signup from "./components/auth/Signup.jsx";

import Course from "./components/main/Course.jsx";
import Schedule from "./components/main/Schedule.jsx";
import Progress from "./components/main/Progress.jsx";
import Profile from "./components/main/Profile.jsx";

import Layout from "./layouts/Layout.jsx";
import HomeLayout from "./layouts/HomeLayout.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";
import RequireAuth from "./components/auth/RequireAuth.jsx";

const router = createBrowserRouter([
  // Public Home Pages
  {
    path: "/",
    element: <HomeLayout />,
    children: [{ index: true, element: <LandingPage /> }],
  },

  // Auth Pages (login / register)
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      { path: "login", element: <Signin /> },
      { path: "register", element: <Signup /> },
    ],
  },

  // Protected Main App Pages
  {
    path: "/app",
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      { path: "course", element: <Course /> },
      { path: "schedule", element: <Schedule /> },
      { path: "progress", element: <Progress /> },
      { path: "profile", element: <Profile /> },
    ],
  },
]);

export default router;
