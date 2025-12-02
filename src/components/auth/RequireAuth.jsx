import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.js";

function RequireAuth({ children }) {
  const { token } = useContext(AuthContext);

  if (!token) return <Navigate to="/auth/login" replace />;

  return children;
}

export default RequireAuth;
