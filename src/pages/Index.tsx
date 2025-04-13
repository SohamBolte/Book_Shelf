
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { BookOpen, Users, MapPin, ArrowRight } from "lucide-react";
import { useBookExchange } from "../context/BookExchangeContext";

const Index = () => {
  const { books, currentUser } = useBookExchange();
  
  // Show just the most recent 3 books
  const recentBooks = [...books]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <Layout>
      {/* Hero section */}
      <section className="relative bg-gradient-to-br from-book-cream to-white py-16 md:py-24">
        <div className="page-container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-book-brown mb-6">
              Share Books, Connect Communities
            </h1>
            <p className="text-lg md:text-xl text-book-charcoal/80 mb-8">
              Join our community of book lovers who share, exchange, and discover new stories together.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                className="bg-book-brown hover:bg-book-brown/90 text-white"
                size="lg"
                asChild
              >
                <Link to="/browse">Browse Books</Link>
              </Button>
              {!currentUser && (
                <Button 
                  variant="outline" 
                  size="lg"
                  asChild
                >
                  <Link to="/register">Join Now</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* How it works section */}
      <section className="py-16 bg-white">
        <div className="page-container">
          <h2 className="text-3xl font-bold text-center mb-12 text-book-charcoal">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-book-cream/30 rounded-lg p-6 text-center">
              <div className="mb-4 mx-auto bg-book-cream w-16 h-16 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-book-brown" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-book-charcoal">Create Your Profile</h3>
              <p className="text-book-charcoal/80">
                Sign up as a book owner or seeker and create your personal profile.
              </p>
            </div>
            <div className="bg-book-cream/30 rounded-lg p-6 text-center">
              <div className="mb-4 mx-auto bg-book-cream w-16 h-16 rounded-full flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-book-brown" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-book-charcoal">List or Browse Books</h3>
              <p className="text-book-charcoal/80">
                Book owners can list their books, while seekers can browse available titles.
              </p>
            </div>
            <div className="bg-book-cream/30 rounded-lg p-6 text-center">
              <div className="mb-4 mx-auto bg-book-cream w-16 h-16 rounded-full flex items-center justify-center">
                <MapPin className="h-8 w-8 text-book-brown" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-book-charcoal">Connect Locally</h3>
              <p className="text-book-charcoal/80">
                Find books in your area and connect with other readers to exchange books.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent books section */}
      <section className="py-16 bg-book-cream/30">
        <div className="page-container">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-book-charcoal">Recently Added Books</h2>
            <Link to="/browse" className="text-book-brown hover:text-book-brown/80 font-medium flex items-center">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          {recentBooks.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentBooks.map(book => (
                <div key={book.id} className="book-card">
                  <div className="book-cover">
                    {book.coverUrl ? (
                      <img 
                        src={book.coverUrl} 
                        alt={book.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="h-12 w-12 text-book-brown/40" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1 text-book-charcoal">{book.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">by {book.author}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs bg-muted px-2 py-1 rounded-full">
                        {book.location}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        book.available 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {book.available ? "Available" : "Not Available"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No books added yet. Be the first to share a book!</p>
              {currentUser && currentUser.role === "owner" && (
                <Button className="mt-4 bg-book-brown hover:bg-book-brown/90" asChild>
                  <Link to="/add-book">Add Your First Book</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 bg-book-green/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 text-book-charcoal">Ready to Join Our Community?</h2>
          <p className="text-lg mb-8 text-book-charcoal/80 max-w-2xl mx-auto">
            Whether you have books to share or are looking for your next great read, 
            SharedShelf connects you with fellow book lovers in your area.
          </p>
          {!currentUser ? (
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                className="bg-book-brown hover:bg-book-brown/90 text-white"
                size="lg"
                asChild
              >
                <Link to="/register">Create Account</Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                asChild
              >
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          ) : (
            <Button 
              className="bg-book-brown hover:bg-book-brown/90 text-white"
              size="lg"
              asChild
            >
              <Link to="/browse">Browse Available Books</Link>
            </Button>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Index;
