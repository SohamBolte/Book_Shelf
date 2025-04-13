
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Search, MapPin, User, Mail, Phone, MessageCircle, Send } from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BrowseBooks = () => {
  const { books, currentUser, sendMessage } = useBookExchange();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<null | typeof books[0]>(null);
  const [messageText, setMessageText] = useState("");
  const [activeTab, setActiveTab] = useState("info");

  const filteredBooks = searchQuery.trim() === "" 
    ? books 
    : books.filter(book => 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (book.genre && book.genre.toLowerCase().includes(searchQuery.toLowerCase())) ||
        book.location.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleSendMessage = (isRequest: boolean) => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (!selectedBook) return;

    const finalMessage = isRequest 
      ? `I'm interested in borrowing "${selectedBook.title}". ${messageText}`
      : messageText;

    sendMessage(selectedBook.ownerId, selectedBook.id, finalMessage, isRequest);
    setMessageText("");
    setActiveTab("info");
  };

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
          <div className="grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredBooks.map((book) => (
              <Card key={book.id} className="overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                <div className="book-cover aspect-[3/4]">
                  {book.coverUrl ? (
                    <img 
                      src={book.coverUrl} 
                      alt={book.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-book-brown/10">
                      <BookOpen className="h-12 w-12 text-book-brown/60" />
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-base font-semibold line-clamp-1">{book.title}</CardTitle>
                  <CardDescription className="text-xs line-clamp-1">by {book.author}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2 px-3 text-xs">
                  <div className="flex items-center text-xs text-muted-foreground mb-1">
                    <MapPin className="mr-1 h-3 w-3" />
                    {book.location}
                  </div>
                  {book.genre && (
                    <div className="inline-block bg-muted text-xs px-2 py-0.5 rounded-full">
                      {book.genre}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-2 flex justify-between items-center mt-auto px-3 pb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    book.available 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {book.available ? "Available" : "Not Available"}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-book-brown border-book-brown/50 hover:border-book-brown hover:bg-book-brown/5 text-xs h-7"
                    onClick={() => setSelectedBook(book)}
                  >
                    Contact
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
        onOpenChange={(open) => {
          if (!open) {
            setSelectedBook(null);
            setMessageText("");
            setActiveTab("info");
          }
        }}
      >
        {selectedBook && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedBook.title}</DialogTitle>
              <DialogDescription>by {selectedBook.author}</DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Book Info</TabsTrigger>
                <TabsTrigger value="message" disabled={!currentUser || currentUser.id === selectedBook.ownerId}>
                  Message Owner
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
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

                {currentUser && currentUser.id !== selectedBook.ownerId && (
                  <Button 
                    className="w-full bg-book-brown hover:bg-book-brown/90"
                    onClick={() => setActiveTab("message")}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Message Owner
                  </Button>
                )}
              </TabsContent>
              
              <TabsContent value="message">
                {currentUser ? (
                  <>
                    <div className="space-y-4">
                      <div className="text-sm mb-3">
                        <p>Send a message to <span className="font-semibold">{selectedBook.ownerName}</span> about <span className="font-semibold">"{selectedBook.title}"</span></p>
                      </div>
                      
                      <Textarea
                        placeholder={`Hi ${selectedBook.ownerName}, I'm interested in your book "${selectedBook.title}"...`}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        className="min-h-[120px]"
                      />
                      
                      <DialogFooter className="sm:justify-between gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setActiveTab("info")}
                          className="mt-2 sm:mt-0"
                        >
                          Cancel
                        </Button>
                        
                        <div className="flex space-x-2">
                          <Button
                            type="submit"
                            onClick={() => handleSendMessage(false)}
                            disabled={!messageText.trim()}
                            className="bg-book-brown hover:bg-book-brown/90"
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Send Message
                          </Button>
                          
                          <Button
                            type="submit"
                            onClick={() => handleSendMessage(true)}
                            disabled={!selectedBook.available || !messageText.trim()}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Request Book
                          </Button>
                        </div>
                      </DialogFooter>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="mb-4">Please log in to message book owners</p>
                    <Button onClick={() => navigate("/login")}>
                      Log In
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        )}
      </Dialog>
    </Layout>
  );
};

export default BrowseBooks;
