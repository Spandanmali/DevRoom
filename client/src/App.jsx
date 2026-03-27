import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import RoomPage from "@/pages/RoomPage";
import AuthCallbackPage from "@/pages/AuthCallbackPage";
import {
  AuthMiddleware,
  GuestOnlyMiddleware,
} from "@/middleware/AuthMiddleware";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={
            <GuestOnlyMiddleware>
              <LoginPage />
            </GuestOnlyMiddleware>
          }
        />
        <Route
          path="/register"
          element={
            <GuestOnlyMiddleware>
              <RegisterPage />
            </GuestOnlyMiddleware>
          }
        />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route
          path="/room/:roomId"
          element={
            <AuthMiddleware>
              <RoomPage />
            </AuthMiddleware>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
