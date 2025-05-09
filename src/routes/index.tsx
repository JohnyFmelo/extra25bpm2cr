
import { Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import Index from "@/pages/Index";
import Hours from "@/pages/Hours";

const routes = [
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/hours",
    element: <Hours />,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
];

export default routes;
