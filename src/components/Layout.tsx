
import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useBookExchange } from "../context/BookExchangeContext";
import { Badge } from "@/components/ui/badge";
import { BookOpen, LogIn, LogOut, User, PlusCircle, Library, Search, MessageCircle } from "lucide-react";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logoutUser, getUnreadMessagesCount } = useBookExchange();
  const navigate = useNavigate();
  const location = useLocation();
  const unreadCount = currentUser ? getUnreadMessagesCount() : 0;

  const handleLogout = () => {
    logoutUser();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-book-brown" />
              <Link to="/" className="font-serif text-2xl font-bold text-book-brown">SharedShelf</Link>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link to="/" className={`text-book-charcoal hover:text-book-brown font-medium ${location.pathname === '/' ? 'text-book-brown' : ''}`}>Home</Link>
              <Link to="/browse" className={`text-book-charcoal hover:text-book-brown font-medium ${location.pathname === '/browse' ? 'text-book-brown' : ''}`}>Browse Books</Link>
              {currentUser && (
                <>
                  {currentUser.role === "owner" && (
                    <Link to="/add-book" className={`text-book-charcoal hover:text-book-brown font-medium ${location.pathname === '/add-book' ? 'text-book-brown' : ''}`}>Add Book</Link>
                  )}
                  <Link to="/messages" className={`text-book-charcoal hover:text-book-brown font-medium relative ${location.pathname === '/messages' ? 'text-book-brown' : ''}`}>
                    Messages
                    {unreadCount > 0 && (
                      <Badge className="ml-1 bg-book-brown absolute -top-2 -right-4 w-5 h-5 flex items-center justify-center p-0 text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Link>
                  <Link to="/profile" className={`text-book-charcoal hover:text-book-brown font-medium ${location.pathname === '/profile' ? 'text-book-brown' : ''}`}>My Profile</Link>
                </>
              )}
            </nav>
            <div className="flex items-center space-x-4">
              {currentUser ? (
                <div className="flex items-center space-x-4">
                  <span className="hidden md:inline text-sm text-muted-foreground">
                    Hi, {currentUser.name}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="flex items-center space-x-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden md:inline">Logout</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate("/login")}
                    className="flex items-center space-x-1"
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="hidden md:inline">Login</span>
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => navigate("/register")}
                    className="flex items-center space-x-1 bg-book-brown hover:bg-book-brown/90"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">Register</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 z-10">
        <div className="flex justify-around">
          <Link to="/" className="flex flex-col items-center text-xs text-book-charcoal">
            <BookOpen className="h-6 w-6" />
            <span>Home</span>
          </Link>
          <Link to="/browse" className="flex flex-col items-center text-xs text-book-charcoal">
            <Search className="h-6 w-6" />
            <span>Browse</span>
          </Link>
          {currentUser && (
            <Link to="/messages" className="flex flex-col items-center text-xs text-book-charcoal relative">
              <MessageCircle className="h-6 w-6" />
              <span>Messages</span>
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs bg-book-brown">
                  {unreadCount}
                </Badge>
              )}
            </Link>
          )}
          {currentUser && currentUser.role === "owner" && (
            <Link to="/add-book" className="flex flex-col items-center text-xs text-book-charcoal">
              <PlusCircle className="h-6 w-6" />
              <span>Add Book</span>
            </Link>
          )}
          {currentUser && (
            <Link to="/profile" className="flex flex-col items-center text-xs text-book-charcoal">
              <User className="h-6 w-6" />
              <span>Profile</span>
            </Link>
          )}
          {!currentUser && (
            <Link to="/login" className="flex flex-col items-center text-xs text-book-charcoal">
              <LogIn className="h-6 w-6" />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>

      <main className="flex-grow mb-16 md:mb-0">
        {children}
      </main>

      <footer className="bg-book-brown text-book-cream py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center space-x-2 mb-2">
                <BookOpen className="h-6 w-6" />
                <span className="font-serif text-xl font-bold">SharedShelf</span>
              </div>
              <p className="text-sm opacity-80">
                Connecting book lovers in your community since 2025
              </p>
            </div>
            <div className="flex flex-col space-y-2 text-center md:text-right">
              <Link to="/" className="text-book-cream hover:text-white text-sm">Home</Link>
              <Link to="/browse" className="text-book-cream hover:text-white text-sm">Browse Books</Link>
              <Link to="/register" className="text-book-cream hover:text-white text-sm">Join the Community</Link>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-book-cream/20 text-center text-xs opacity-70">
            <p>© 2025 SharedShelf. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
