
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import Layout from "../components/Layout";
import { useBookExchange } from "../context/BookExchangeContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "../hooks/use-toast";

const Profile = () => {
  const { currentUser, books, toggleBookAvailability, deleteBook } = useBookExchange();
  const navigate = useNavigate();

  // Redirect if user is not logged in
  React.useEffect(() => {
    if (!currentUser) {
      toast({
        title: "Not authorized",
        description: "Please log in to view your profile",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return null; // Don't render anything while redirecting
  }

  // Get books owned by the current user
  const userBooks = books.filter(book => book.ownerId === currentUser.id);

  return (
    <Layout>
      <div className="page-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-book-charcoal">My Profile</h1>
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-4 text-book-charcoal">
                  Account Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{currentUser.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{currentUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{currentUser.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium capitalize">
                      {currentUser.role === "owner" ? "Book Owner" : "Book Seeker"}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col justify-center items-center bg-book-cream/20 rounded-lg p-6">
                <div className="mb-4 bg-book-cream w-16 h-16 rounded-full flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-book-brown" />
                </div>
                {currentUser.role === "owner" ? (
                  <>
                    <p className="text-center mb-4">
                      You have {userBooks.length} book{userBooks.length !== 1 ? "s" : ""} listed for exchange.
                    </p>
                    <Button 
                      className="bg-book-brown hover:bg-book-brown/90"
                      onClick={() => navigate("/add-book")}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Book
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-center mb-4">
                      You're registered as a Book Seeker. Browse available books to find your next read!
                    </p>
                    <Button 
                      className="bg-book-brown hover:bg-book-brown/90"
                      onClick={() => navigate("/browse")}
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Browse Books
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {currentUser.role === "owner" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-book-charcoal">My Book Listings</h2>
                <Button 
                  onClick={() => navigate("/add-book")}
                  className="bg-book-brown hover:bg-book-brown/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Book
                </Button>
              </div>

              {userBooks.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userBooks.map((book) => (
                    <Card key={book.id}>
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
                      <CardHeader className="pb-2">
                        <CardTitle>{book.title}</CardTitle>
                        <CardDescription>by {book.author}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="text-sm text-muted-foreground mb-2">
                          Location: {book.location}
                        </div>
                        {book.genre && (
                          <div className="text-sm text-muted-foreground">
                            Genre: {book.genre}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button
                          variant={book.available ? "outline" : "default"}
                          size="sm"
                          className={book.available 
                            ? "border-green-500 text-green-600 hover:bg-green-50" 
                            : "bg-book-brown hover:bg-book-brown/90"
                          }
                          onClick={() => toggleBookAvailability(book.id)}
                        >
                          {book.available ? (
                            <>
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Available
                            </>
                          ) : (
                            <>
                              <XCircle className="mr-1 h-4 w-4" />
                              Not Available
                            </>
                          )}
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{book.title}" from your listings.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteBook(book.id)}
                                className="bg-red-600 text-white hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <p className="text-muted-foreground mb-4">You haven't added any books yet.</p>
                  <Button 
                    className="bg-book-brown hover:bg-book-brown/90"
                    onClick={() => navigate("/add-book")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Book
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
