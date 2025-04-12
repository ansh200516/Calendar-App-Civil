import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";
import Calendar from "@/pages/Calendar";
import Admin from "@/pages/Admin";
import Notifications from "@/pages/Notifications";
import AdminLogin from "@/pages/AdminLogin";
import AdminSignup from "@/pages/AdminSignup";
import Layout from "@/components/Layout";
import { useAuth } from "@/store/auth";
import { useEvents } from "@/store/events";
import { useNotifications } from "@/store/notifications";

function App() {
  const [ready, setReady] = useState(false);
  const { toast } = useToast();
  const { checkAuth, isAuthenticated } = useAuth();
  const { fetchEvents } = useEvents();
  const { fetchNotifications } = useNotifications();
  const [location, navigate] = useLocation();

  useEffect(() => {
    const initApp = async () => {
      // Check if user is already authenticated
      await checkAuth();
      
      // Fetch initial data
      try {
        await fetchEvents();
        await fetchNotifications();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load initial data",
          variant: "destructive",
        });
      }
      
      setReady(true);
    };
    
    initApp();
  }, [checkAuth, fetchEvents, fetchNotifications, toast]);
  
  useEffect(() => {
    // Redirect to home if not authenticated and trying to access admin pages
    if (ready && !isAuthenticated && 
        (location === "/admin" || location === "/notifications")) {
      navigate("/");
    }
  }, [ready, isAuthenticated, location, navigate]);

  // Show loading state until initialization is complete
  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if the current path is an admin-specific route
  const isAdminRoute = location === "/admin" || location === "/notifications";
  
  // Admin authentication routes
  if (location === "/admin/login") {
    return (
      <>
        <AdminLogin />
        <Toaster />
      </>
    );
  }
  
  if (location === "/admin/signup") {
    return (
      <>
        <AdminSignup />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <Layout>
        <Switch>
          {/* Public routes - accessible without login */}
          <Route path="/" component={Calendar} />
          
          {/* Admin routes - require authentication */}
          <Route path="/admin">
            {isAuthenticated ? <Admin /> : <AdminLogin />}
          </Route>
          <Route path="/notifications">
            {isAuthenticated ? <Notifications /> : <AdminLogin />}
          </Route>
          
          <Route component={NotFound} />
        </Switch>
      </Layout>
      
      <Toaster />
    </>
  );
}

export default App;
