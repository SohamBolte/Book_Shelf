import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "../hooks/use-toast";

export type UserRole = "owner" | "seeker";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // In a real app, we would never store this in plain text
  phone: string;
  role: UserRole;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  genre?: string;
  location: string;
  contact: string;
  ownerId: string;
  ownerName: string;
  available: boolean;
  coverUrl?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  bookId: string;
  bookTitle: string;
  content: string;
  isRequest: boolean;
  isRead: boolean;
  createdAt: string;
}

interface BookExchangeContextType {
  users: User[];
  books: Book[];
  messages: Message[];
  currentUser: User | null;
  registerUser: (user: Omit<User, "id">) => void;
  loginUser: (email: string, password: string) => boolean;
  logoutUser: () => void;
  addBook: (book: Omit<Book, "id" | "ownerId" | "ownerName" | "available" | "createdAt">, coverFile?: File) => void;
  toggleBookAvailability: (bookId: string) => void;
  deleteBook: (bookId: string) => void;
  filterBooksBySearch: (search: string) => Book[];
  sendMessage: (receiverId: string, bookId: string, content: string, isRequest: boolean) => void;
  getMessagesForUser: () => Message[];
  markMessageAsRead: (messageId: string) => void;
  getUnreadMessagesCount: () => number;
  acceptBookRequest: (messageId: string) => void;
  uploadCoverImage: (file: File) => Promise<string>;
}

const BookExchangeContext = createContext<BookExchangeContextType | undefined>(undefined);

const initialUsers: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    password: "password123",
    phone: "555-123-4567",
    role: "owner",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    password: "password123",
    phone: "555-987-6543",
    role: "seeker",
  },
];

const initialBooks: Book[] = [];

const initialMessages: Message[] = [];

export const BookExchangeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem("bookExchangeUsers");
    return savedUsers ? JSON.parse(savedUsers) : initialUsers;
  });
  
  const [books, setBooks] = useState<Book[]>(() => {
    const savedBooks = localStorage.getItem("bookExchangeBooks");
    return savedBooks ? JSON.parse(savedBooks) : initialBooks;
  });
  
  const [messages, setMessages] = useState<Message[]>(() => {
    const savedMessages = localStorage.getItem("bookExchangeMessages");
    return savedMessages ? JSON.parse(savedMessages) : initialMessages;
  });
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("bookExchangeCurrentUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    localStorage.setItem("bookExchangeUsers", JSON.stringify(users));
    localStorage.setItem("bookExchangeBooks", JSON.stringify(books));
    localStorage.setItem("bookExchangeMessages", JSON.stringify(messages));
    localStorage.setItem("bookExchangeCurrentUser", currentUser ? JSON.stringify(currentUser) : "");
  }, [users, books, messages, currentUser]);

  const registerUser = (userData: Omit<User, "id">) => {
    if (users.some(user => user.email === userData.email)) {
      toast({
        title: "Registration failed",
        description: "A user with this email already exists",
        variant: "destructive"
      });
      return;
    }

    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
    };

    setUsers(prevUsers => [...prevUsers, newUser]);
    setCurrentUser(newUser);
    toast({
      title: "Registration successful",
      description: `Welcome, ${newUser.name}!`,
    });
  };

  const loginUser = (email: string, password: string): boolean => {
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      setCurrentUser(user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
      });
      return true;
    } else {
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive"
      });
      return false;
    }
  };

  const logoutUser = () => {
    setCurrentUser(null);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  const uploadCoverImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          resolve(event.target.result);
        } else {
          reject(new Error('Failed to convert file to data URL'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      reader.readAsDataURL(file);
    });
  };

  const addBook = async (
    bookData: Omit<Book, "id" | "ownerId" | "ownerName" | "available" | "createdAt">, 
    coverFile?: File
  ) => {
    if (!currentUser) {
      toast({
        title: "Not authorized",
        description: "You must be logged in to add a book",
        variant: "destructive"
      });
      return;
    }

    if (currentUser.role !== "owner") {
      toast({
        title: "Not authorized",
        description: "Only book owners can add listings",
        variant: "destructive"
      });
      return;
    }

    let coverUrl = bookData.coverUrl;

    if (coverFile) {
      try {
        coverUrl = await uploadCoverImage(coverFile);
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Failed to upload cover image",
          variant: "destructive"
        });
      }
    }

    const newBook: Book = {
      ...bookData,
      coverUrl,
      id: Date.now().toString(),
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      available: true,
      createdAt: new Date().toISOString(),
    };

    setBooks(prevBooks => [...prevBooks, newBook]);
    toast({
      title: "Book added",
      description: `${newBook.title} has been added to your listings`,
    });
  };

  const toggleBookAvailability = (bookId: string) => {
    if (!currentUser) {
      toast({
        title: "Not authorized",
        description: "You must be logged in to manage books",
        variant: "destructive"
      });
      return;
    }

    setBooks(prevBooks => 
      prevBooks.map(book => 
        book.id === bookId && book.ownerId === currentUser.id
          ? { ...book, available: !book.available }
          : book
      )
    );
  };

  const deleteBook = (bookId: string) => {
    if (!currentUser) {
      toast({
        title: "Not authorized",
        description: "You must be logged in to delete books",
        variant: "destructive"
      });
      return;
    }

    const book = books.find(b => b.id === bookId);
    
    if (!book || book.ownerId !== currentUser.id) {
      toast({
        title: "Not authorized",
        description: "You can only delete your own books",
        variant: "destructive"
      });
      return;
    }

    setBooks(prevBooks => prevBooks.filter(book => book.id !== bookId));
    toast({
      title: "Book deleted",
      description: `${book.title} has been removed from your listings`,
    });
  };

  const filterBooksBySearch = (search: string): Book[] => {
    const lowerSearch = search.toLowerCase();
    return books.filter(
      book => 
        book.title.toLowerCase().includes(lowerSearch) || 
        book.author.toLowerCase().includes(lowerSearch) ||
        (book.genre && book.genre.toLowerCase().includes(lowerSearch)) ||
        book.location.toLowerCase().includes(lowerSearch)
    );
  };

  const sendMessage = (receiverId: string, bookId: string, content: string, isRequest: boolean) => {
    if (!currentUser) {
      toast({
        title: "Not authorized",
        description: "You must be logged in to send messages",
        variant: "destructive"
      });
      return;
    }

    const book = books.find(b => b.id === bookId);
    if (!book) {
      toast({
        title: "Error",
        description: "Book not found",
        variant: "destructive"
      });
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      receiverId,
      bookId,
      bookTitle: book.title,
      content,
      isRequest,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    setMessages(prevMessages => [...prevMessages, newMessage]);
    
    toast({
      title: isRequest ? "Book Request Sent" : "Message Sent",
      description: `Your ${isRequest ? "request" : "message"} has been sent to the book owner`,
    });
  };

  const getMessagesForUser = () => {
    if (!currentUser) return [];
    
    return messages.filter(message => 
      message.senderId === currentUser.id || message.receiverId === currentUser.id
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const markMessageAsRead = (messageId: string) => {
    if (!currentUser) return;
    
    setMessages(prevMessages => 
      prevMessages.map(message => 
        message.id === messageId && message.receiverId === currentUser.id
          ? { ...message, isRead: true }
          : message
      )
    );
  };

  const getUnreadMessagesCount = () => {
    if (!currentUser) return 0;
    
    return messages.filter(message => 
      message.receiverId === currentUser.id && !message.isRead
    ).length;
  };

  const acceptBookRequest = (messageId: string) => {
    if (!currentUser) {
      toast({
        title: "Not authorized",
        description: "You must be logged in to accept requests",
        variant: "destructive"
      });
      return;
    }

    const requestMessage = messages.find(m => 
      m.id === messageId && 
      m.isRequest && 
      m.receiverId === currentUser.id
    );

    if (!requestMessage) {
      toast({
        title: "Error",
        description: "Request not found or cannot be accepted",
        variant: "destructive"
      });
      return;
    }

    setBooks(prevBooks => 
      prevBooks.map(book => 
        book.id === requestMessage.bookId
          ? { ...book, available: false }
          : book
      )
    );

    const acceptanceMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      receiverId: requestMessage.senderId,
      bookId: requestMessage.bookId,
      bookTitle: requestMessage.bookTitle,
      content: `Your request for "${requestMessage.bookTitle}" has been accepted! The book will be delivered to you soon.`,
      isRequest: false,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    setMessages(prevMessages => [...prevMessages, acceptanceMessage]);
    
    toast({
      title: "Request Accepted",
      description: `You've accepted the request for "${requestMessage.bookTitle}"`,
    });
  };

  return (
    <BookExchangeContext.Provider
      value={{
        users,
        books,
        messages,
        currentUser,
        registerUser,
        loginUser,
        logoutUser,
        addBook,
        toggleBookAvailability,
        deleteBook,
        filterBooksBySearch,
        sendMessage,
        getMessagesForUser,
        markMessageAsRead,
        getUnreadMessagesCount,
        acceptBookRequest,
        uploadCoverImage,
      }}
    >
      {children}
    </BookExchangeContext.Provider>
  );
};

export const useBookExchange = () => {
  const context = useContext(BookExchangeContext);
  if (context === undefined) {
    throw new Error("useBookExchange must be used within a BookExchangeProvider");
  }
  return context;
};
