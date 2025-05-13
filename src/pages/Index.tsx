import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Heart,
  Users,
  Calendar,
  Clock,
  MessageSquare,
  Shield,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#f0f9ff_1px,transparent_1px)] [background-size:32px_32px] opacity-40 -z-10" />

        <div className="relative pt-20 pb-16 sm:pb-20">
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center space-x-4 mb-8"
            >
              <Heart className="h-12 w-12 text-pink-600 animate-pulse" />
              <Users className="h-12 w-12 text-indigo-600 animate-pulse [animation-delay:0.2s]" />
            </motion.div>

            <motion.h1
              className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7 }}
            >
              <span className="text-primary">Volunteer Management System</span>
            </motion.h1>

            <motion.p
              className="mt-6 max-w-2xl mx-auto text-lg text-slate-600 sm:text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Bringing volunteers and residents together for meaningful connections.
              Join us and be a part of something impactful.
            </motion.p>

            <motion.div
              className="mt-10 flex justify-center gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Link to="/login">
                <Button size="lg" className="h-12 px-8 text-lg shadow-lg">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 text-lg backdrop-blur bg-white/50 border-slate-300"
                >
                  Join as Volunteer
                </Button>
              </Link>
            </motion.div>
          </main>
        </div>
      </div>

      {/* Features Section */}
      <section className="pt-12 pb-24 sm:pt-16 sm:pb-28 bg-white relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-slate-900 sm:text-5xl">
              Why Choose Us?
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to make volunteering easy, meaningful, and impactful.
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                className="relative rounded-3xl border border-slate-200 bg-white p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300 group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 mb-4 group-hover:scale-105 transition-transform">
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {feature.name}
                </h3>
                <p className="mt-2 text-slate-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-indigo-500">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-4xl font-bold sm:text-5xl">
            Ready to Make a Difference?
          </h2>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
            Start your journey as a volunteer and change lives — including your own.
          </p>
          <div className="mt-8">
            <Link to="/register">
              <Button
                size="lg"
                variant="secondary"
                className="h-12 px-8 text-lg bg-white text-primary hover:bg-slate-100"
              >
                Become a Volunteer
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const features = [
  {
    name: "Easy Scheduling",
    description:
      "Flexible calendar system that makes it easy to find and book volunteer opportunities.",
    icon: Calendar,
    color: "text-sky-600",
  },
  {
    name: "Time Tracking",
    description:
      "Track your volunteer hours and maintain a record of your contributions.",
    icon: Clock,
    color: "text-amber-600",
  },
  {
    name: "Direct Communication",
    description:
      "Stay connected with residents and other volunteers through secure messaging.",
    icon: MessageSquare,
    color: "text-emerald-600",
  },
  {
    name: "Secure Platform",
    description:
      "Your data is protected with modern security measures and privacy standards.",
    icon: Shield,
    color: "text-violet-600",
  },
  {
    name: "Community Focus",
    description:
      "Join a vibrant community of individuals making a real impact.",
    icon: Users,
    color: "text-indigo-600",
  },
  {
    name: "Meaningful Impact",
    description:
      "Create lasting connections and enrich lives — including your own.",
    icon: Heart,
    color: "text-rose-600",
  },
];
