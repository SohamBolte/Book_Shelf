
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

interface BookExchangeContextType {
  users: User[];
  books: Book[];
  currentUser: User | null;
  registerUser: (user: Omit<User, "id">) => void;
  loginUser: (email: string, password: string) => boolean;
  logoutUser: () => void;
  addBook: (book: Omit<Book, "id" | "ownerId" | "ownerName" | "available" | "createdAt">) => void;
  toggleBookAvailability: (bookId: string) => void;
  deleteBook: (bookId: string) => void;
  filterBooksBySearch: (search: string) => Book[];
}

const BookExchangeContext = createContext<BookExchangeContextType | undefined>(undefined);

// Sample initial data
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

const initialBooks: Book[] = [
  {
    id: "1",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    genre: "Fiction",
    location: "New York",
    contact: "john@example.com",
    ownerId: "1",
    ownerName: "John Doe",
    available: true,
    coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=387&ixlib=rb-4.0.3",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "1984",
    author: "George Orwell",
    genre: "Dystopian",
    location: "Boston",
    contact: "john@example.com",
    ownerId: "1",
    ownerName: "John Doe",
    available: true,
    coverUrl: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=388&ixlib=rb-4.0.3",
    createdAt: new Date().toISOString(),
  },
];

export const BookExchangeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Try to load data from localStorage if available
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem("bookExchangeUsers");
    return savedUsers ? JSON.parse(savedUsers) : initialUsers;
  });
  
  const [books, setBooks] = useState<Book[]>(() => {
    const savedBooks = localStorage.getItem("bookExchangeBooks");
    return savedBooks ? JSON.parse(savedBooks) : initialBooks;
  });
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("bookExchangeCurrentUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem("bookExchangeUsers", JSON.stringify(users));
    localStorage.setItem("bookExchangeBooks", JSON.stringify(books));
    localStorage.setItem("bookExchangeCurrentUser", currentUser ? JSON.stringify(currentUser) : "");
  }, [users, books, currentUser]);

  const registerUser = (userData: Omit<User, "id">) => {
    // Check if user with this email already exists
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
      id: Date.now().toString(), // Simple ID generation
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

  const addBook = (bookData: Omit<Book, "id" | "ownerId" | "ownerName" | "available" | "createdAt">) => {
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

    const newBook: Book = {
      ...bookData,
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

  return (
    <BookExchangeContext.Provider
      value={{
        users,
        books,
        currentUser,
        registerUser,
        loginUser,
        logoutUser,
        addBook,
        toggleBookAvailability,
        deleteBook,
        filterBooksBySearch,
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
