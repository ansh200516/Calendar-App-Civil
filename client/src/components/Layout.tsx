import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/store/auth";
import { useNotifications } from "@/store/notifications";
import { ChevronRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type Props = {
  children: ReactNode;
};

export default function Layout({ children }: Props) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Mobile Menu Button */}
      <div className="md:hidden flex items-center p-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-heading font-bold text-primary-500 ml-3">
          Academic Calendar
        </h1>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-heading font-bold text-primary-500">
                Academic Calendar
              </h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {user?.isAdmin ? "Admin View" : "Student View"}
            </p>
          </div>
          {renderNav(true)}
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block bg-white border-r border-gray-200 w-64 flex-shrink-0 fixed h-full">
        <div className="p-6">
          <h1 className="text-2xl font-heading font-bold text-primary-500">
            Academic Calendar
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {user?.isAdmin ? "Admin View" : "Student View"}
          </p>
        </div>
        {renderNav()}
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 px-4 py-4 md:px-8 md:py-8 bg-gray-50">
        {children}
      </main>
    </div>
  );

  function renderNav(isMobile = false) {
    return (
      <>
        <nav className="px-4 pb-4">
          <div className="space-y-1">
            <Link 
              href="/" 
              onClick={() => isMobile && setMobileMenuOpen(false)}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                location === "/" 
                  ? "bg-primary-50 text-primary-700" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-3"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              Calendar
            </Link>
            
            {user?.isAdmin && (
              <Link 
                href="/admin" 
                onClick={() => isMobile && setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  location === "/admin" 
                    ? "bg-primary-50 text-primary-700" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-3"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                  />
                </svg>
                Admin
              </Link>
            )}
            
            <Link 
              href="/notifications" 
              onClick={() => isMobile && setMobileMenuOpen(false)}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                location === "/notifications" 
                  ? "bg-primary-50 text-primary-700" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-3"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
                />
              </svg>
              Notifications
              {unreadCount > 0 && (
                <span className="ml-auto bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </nav>
        
        <div className="px-4 mt-4">
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Event Categories</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                  <span className="text-sm text-gray-700">Deadlines</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span>
                  <span className="text-sm text-gray-700">Quizzes</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span>
                  <span className="text-sm text-gray-700">Other Events</span>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <button 
                onClick={() => {
                  logout();
                  if (isMobile) setMobileMenuOpen(false);
                }}
                className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-3"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                  />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }
}
