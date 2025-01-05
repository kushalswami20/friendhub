import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Router,
  Navigate,
} from "react-router-dom";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Signup from "./components/Signup";

import Login from "./components/Login";
import Home from "./components/Home";

function App() {
  // const [count, setCount] = useState(0);
  const isAuthenticated = () => {
    return !!localStorage.getItem("token");
  };

  // Protected Route wrapper
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          {/* Add other routes as needed */}
          <Route path="/login" element={<Login />} />

          <Route path="/signup" element={<Signup />}/>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
