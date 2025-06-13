import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";
import Calendar from "@/pages/Calendar";
import Admin from "@/pages/Admin";
import StudentNotifications from "@/pages/StudentNotifications";
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
      await checkAuth();
      
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
    if (ready && !isAuthenticated && 
        (location === "/admin")) {
      navigate("/");
    }
    if (ready && !isAuthenticated && 
        (location === "/notifications")) {
      navigate("/studentnotifications");
    }
  }, [ready, isAuthenticated, location, navigate]);

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

  const isAdminRoute = location === "/admin" || location === "/notifications";
  
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
          <Route path="/" component={Calendar} />
          
          <Route path="/admin">
            {isAuthenticated ? <Admin /> : <AdminLogin />}
          </Route>
          <Route path="/notifications">
            {isAuthenticated ? <Notifications /> : <AdminLogin />}
          </Route>
          <Route path="/studentnotifications" component={StudentNotifications} />

          
          <Route component={NotFound} />
        </Switch>
      </Layout>
      
      <Toaster />
    </>
  );
}

export default App;
