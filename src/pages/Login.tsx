import * as React from "react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const params = new URLSearchParams();
    params.append("email", email);
    params.append("password", password);

    try {
      const { data } = await api.post("/user/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (data.success) {
        localStorage.setItem("accessToken", data.data.accessToken);
        toast.success("Successfully logged in!");
        navigate("/dashboard");
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-[400px] space-y-8">
        {/* Header */}
        <div className="text-left space-y-2">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Log In
          </h2>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="space-y-4">
            {/* Email Field */}
            <Input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 h-12 rounded-xl focus:border-zinc-700 focus:ring-zinc-700"
            />

            {/* Password Field */}
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 h-12 rounded-xl focus:border-zinc-700 focus:ring-zinc-700 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Log In"}
          </Button>

          <p className="text-center text-zinc-400 text-sm">
            Don't have an account?{" "}
            <Link
              to="/sign-up"
              className="text-blue-500 font-semibold hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
