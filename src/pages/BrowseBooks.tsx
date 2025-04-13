
import React, { useState } from "react";
import Layout from "../components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, MapPin, User, Mail, Phone } from "lucide-react";
import { useBookExchange } from "../context/BookExchangeContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BrowseBooks = () => {
  const { books } = useBookExchange();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<null | typeof books[0]>(null);

  const filteredBooks = searchQuery.trim() === "" 
    ? books 
    : books.filter(book => 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (book.genre && book.genre.toLowerCase().includes(searchQuery.toLowerCase())) ||
        book.location.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <Layout>
      <div className="page-container">
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-book-charcoal">Find Your Next Book</h1>
          <p className="text-muted-foreground mb-6">
            Browse through our collection of books shared by the community.
          </p>
          <div className="relative">
            <Input
              className="pl-10"
              placeholder="Search by title, author, genre or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {filteredBooks.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => (
              <Card key={book.id} className="overflow-hidden hover:shadow-md transition-shadow">
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
                  <CardTitle className="text-lg font-semibold">{book.title}</CardTitle>
                  <CardDescription>by {book.author}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <MapPin className="mr-1 h-4 w-4" />
                    {book.location}
                  </div>
                  {book.genre && (
                    <div className="inline-block bg-muted text-xs px-2 py-1 rounded-full">
                      {book.genre}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-2 flex justify-between items-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    book.available 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {book.available ? "Available" : "Not Available"}
                  </span>
                  <Button 
                    variant="outline" 
                    className="text-book-brown border-book-brown/50 hover:border-book-brown hover:bg-book-brown/5"
                    onClick={() => setSelectedBook(book)}
                  >
                    Contact Owner
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
            {searchQuery ? (
              <>
                <p>No books match your search.</p>
                <Button 
                  variant="link" 
                  className="mt-2 text-book-brown"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </Button>
              </>
            ) : (
              <p>No books available at the moment. Check back later!</p>
            )}
          </div>
        )}
      </div>

      <Dialog 
        open={selectedBook !== null} 
        onOpenChange={(open) => !open && setSelectedBook(null)}
      >
        {selectedBook && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedBook.title}</DialogTitle>
              <DialogDescription>by {selectedBook.author}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="h-20 w-16 flex-shrink-0 overflow-hidden rounded">
                  {selectedBook.coverUrl ? (
                    <img 
                      src={selectedBook.coverUrl} 
                      alt={selectedBook.title} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-muted">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  {selectedBook.genre && (
                    <div className="text-sm mb-1">
                      <span className="font-medium">Genre:</span> {selectedBook.genre}
                    </div>
                  )}
                  <div className="text-sm mb-1 flex items-center">
                    <MapPin className="mr-1 h-4 w-4 text-muted-foreground" />
                    <span>{selectedBook.location}</span>
                  </div>
                  <div className="text-sm mb-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      selectedBook.available 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {selectedBook.available ? "Available" : "Not Available"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Owner Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    {selectedBook.ownerName}
                  </div>
                  <div className="flex items-center text-sm">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                    {selectedBook.contact}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  Contact the owner to arrange for book exchange. Please be respectful and follow 
                  community guidelines when arranging meetings.
                </p>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </Layout>
  );
};

export default BrowseBooks;
