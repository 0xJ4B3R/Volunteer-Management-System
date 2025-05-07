import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import LoginForm from "@/components/login/LoginForm";
import { Heart, Users } from "lucide-react";

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-12 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="w-full max-w-md text-center space-y-6 mb-8">
        <div className="flex justify-center items-center space-x-2">
          <Heart className="h-8 w-8 text-pink-600" />
          <Users className="h-8 w-8 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Volunteer Management System
        </h1>
        <p className="text-sm text-slate-600">
          Bringing volunteers and residents together for meaningful connections
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md space-y-6">
        <Card className="border-none shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        {/* Links */}
        <div className="text-center text-sm space-y-4">
          <div className="flex justify-center items-center space-x-4">
            <Link
              to="/forgot-password"
              className="text-primary hover:text-primary/90 transition-colors"
            >
              Forgot password?
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <Link
              to="/register"
              className="text-primary hover:text-primary/90 transition-colors"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
