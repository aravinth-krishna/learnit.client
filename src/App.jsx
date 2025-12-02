import { RouterProvider } from "react-router-dom";
import router from "./router";
import { AuthProvider } from "./context/AuthProvider";
import { ThemeProvider } from "./context/ThemeContext.jsx";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
