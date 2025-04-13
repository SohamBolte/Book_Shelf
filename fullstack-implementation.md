
# SharedShelf Full-Stack Implementation Guide

This guide outlines how to transform the current React application into a full-stack application using Next.js and Express with a SQLite database.

## Project Structure

The full-stack implementation will follow this structure:

```
sharedshelf/
├── app/                        # Next.js app router 
│   ├── api/                    # API routes
│   ├── (routes)/               # Frontend routes
│   │   ├── page.tsx            # Home page
│   │   ├── login/page.tsx      # Login page
│   │   ├── register/page.tsx   # Register page
│   │   ├── browse/page.tsx     # Browse Books page
│   │   ├── add-book/page.tsx   # Add Book page
│   │   ├── profile/page.tsx    # Profile page
│   │   ├── messages/page.tsx   # Messages page
│   ├── layout.tsx              # Root layout
│   ├── providers.tsx           # Context providers
├── components/                 # React components
│   ├── ui/                     # UI components
│   ├── Layout.tsx              # Layout component
├── lib/                        # Utility functions
│   ├── db.ts                   # Database connection
│   ├── auth.ts                 # Authentication helpers
├── prisma/                     # Prisma ORM
│   ├── schema.prisma           # Database schema
│   ├── seed.ts                 # Seed script
├── server/                     # Express server
│   ├── index.ts                # Server entry point
│   ├── routes/                 # API routes
│   │   ├── books.ts            # Books API
│   │   ├── users.ts            # Users API
│   │   ├── messages.ts         # Messages API
├── public/                     # Static files
├── .env                        # Environment variables
├── next.config.js              # Next.js configuration
├── package.json                # Project dependencies
└── tsconfig.json               # TypeScript configuration
```

## Step 1: Setup Next.js Project

1. Create a new Next.js project:
```bash
npx create-next-app@latest sharedshelf-fullstack --typescript
cd sharedshelf-fullstack
```

2. Install dependencies:
```bash
npm install @prisma/client bcrypt express cors jsonwebtoken
npm install -D prisma @types/express @types/bcrypt @types/jsonwebtoken @types/cors
```

## Step 2: Setup Prisma with SQLite

1. Initialize Prisma:
```bash
npx prisma init --datasource-provider sqlite
```

2. Define the database schema in `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id        String    @id @default(cuid())
  email     String    @unique
  password  String
  name      String
  role      String    @default("borrower") // "owner" or "borrower"
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  books     Book[]
  sentMessages     Message[] @relation("SentMessages")
  receivedMessages Message[] @relation("ReceivedMessages")
}

model Book {
  id          String    @id @default(cuid())
  title       String
  author      String
  description String
  condition   String
  genre       String
  coverImage  String?
  available   Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  ownerId     String
  owner       User      @relation(fields: [ownerId], references: [id])
  messages    Message[]
}

model Message {
  id          String   @id @default(cuid())
  content     String
  read        Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  senderId    String
  sender      User     @relation("SentMessages", fields: [senderId], references: [id])
  receiverId  String
  receiver    User     @relation("ReceivedMessages", fields: [receiverId], references: [id])
  bookId      String?
  book        Book?    @relation(fields: [bookId], references: [id])
}
```

3. Create a seed script in `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create sample users
  const ownerPassword = await bcrypt.hash('owner123', 10);
  const borrowerPassword = await bcrypt.hash('borrower123', 10);
  
  const owner = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      email: 'owner@example.com',
      name: 'Book Owner',
      password: ownerPassword,
      role: 'owner',
    },
  });

  const borrower = await prisma.user.upsert({
    where: { email: 'borrower@example.com' },
    update: {},
    create: {
      email: 'borrower@example.com',
      name: 'Book Borrower',
      password: borrowerPassword,
      role: 'borrower',
    },
  });

  // Create sample books
  const books = [
    {
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      description: 'A classic novel about the American Dream set in the Roaring Twenties.',
      condition: 'Good',
      genre: 'Fiction',
      coverImage: '/covers/gatsby.jpg',
      ownerId: owner.id,
    },
    {
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      description: 'A novel about racial injustice and moral growth in the American South.',
      condition: 'Excellent',
      genre: 'Fiction',
      coverImage: '/covers/mockingbird.jpg',
      ownerId: owner.id,
    },
    {
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      description: 'A romantic novel exploring themes of class, marriage, and social expectations.',
      condition: 'Fair',
      genre: 'Romance',
      coverImage: '/covers/pride.jpg',
      ownerId: owner.id,
    },
  ];

  for (const book of books) {
    await prisma.book.create({
      data: book,
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

4. Update `package.json` to include a seed command:

```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

5. Generate Prisma client and run migrations:
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

## Step 3: Setup Express Server

1. Create `server/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'borrower',
      },
    });
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
    
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Books routes
app.get('/api/books', async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    res.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/books', authenticateToken, async (req, res) => {
  try {
    const { title, author, description, condition, genre, coverImage } = req.body;
    const userId = req.user.id;
    
    // Check if user is an owner
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user || user.role !== 'owner') {
      return res.status(403).json({ error: 'Only book owners can add books' });
    }
    
    const book = await prisma.book.create({
      data: {
        title,
        author,
        description,
        condition,
        genre,
        coverImage,
        ownerId: userId,
      },
    });
    
    res.status(201).json(book);
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Messages routes
app.get('/api/messages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        book: {
          select: {
            id: true,
            title: true,
            coverImage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { receiverId, bookId, content } = req.body;
    const senderId = req.user.id;
    
    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        receiverId,
        bookId,
      },
    });
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/messages/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if the message belongs to the current user
    const message = await prisma.message.findUnique({
      where: { id },
    });
    
    if (!message || message.receiverId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const updatedMessage = await prisma.message.update({
      where: { id },
      data: { read: true },
    });
    
    res.json(updatedMessage);
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User profile route
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        books: true,
      },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

## Step 4: Setup Next.js API Route Handler

1. Create a simple API proxy in `app/api/[...path]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const searchParams = request.nextUrl.search;
  const url = `${API_URL}/api/${path}${searchParams}`;
  
  const headers: HeadersInit = {};
  
  // Forward authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    headers['authorization'] = authHeader;
  }
  
  const response = await fetch(url, {
    headers,
    cache: 'no-store',
  });
  
  const data = await response.json();
  
  return NextResponse.json(data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const url = `${API_URL}/api/${path}`;
  const body = await request.json();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Forward authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    headers['authorization'] = authHeader;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  
  const data = await response.json();
  
  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const url = `${API_URL}/api/${path}`;
  const body = await request.json();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Forward authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    headers['authorization'] = authHeader;
  }
  
  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  
  const data = await response.json();
  
  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const url = `${API_URL}/api/${path}`;
  
  const headers: HeadersInit = {};
  
  // Forward authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    headers['authorization'] = authHeader;
  }
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers,
  });
  
  const data = await response.json();
  
  return NextResponse.json(data);
}
```

## Step 5: Create Authentication Context

1. Create `lib/auth.ts`:

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type User = {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'borrower';
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: 'owner' | 'borrower') => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to login');
      }
      
      const data = await response.json();
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: 'owner' | 'borrower') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to register');
      }
      
      const data = await response.json();
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## Step 6: Create Layout and Root Providers

1. Create `app/providers.tsx`:

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AuthProvider } from '@/lib/auth';
import { ReactNode, useState } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {children}
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

2. Create `app/layout.tsx`:

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SharedShelf - Book Exchange Community',
  description: 'Connect with book lovers in your community',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

3. Create `components/Layout.tsx`:

```typescript
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, LogIn, LogOut, User, PlusCircle, Library, Search, MessageCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  // Fetch unread messages count
  const { data: messages } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      
      const res = await fetch('/api/messages', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      return res.json();
    },
    enabled: isAuthenticated,
  });
  
  const unreadCount = messages?.filter(
    (message: any) => message.receiverId === user?.id && !message.read
  ).length || 0;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-book-brown" />
              <Link href="/" className="font-serif text-2xl font-bold text-book-brown">SharedShelf</Link>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link href="/" className={`text-book-charcoal hover:text-book-brown font-medium ${pathname === '/' ? 'text-book-brown' : ''}`}>Home</Link>
              <Link href="/browse" className={`text-book-charcoal hover:text-book-brown font-medium ${pathname === '/browse' ? 'text-book-brown' : ''}`}>Browse Books</Link>
              {user && (
                <>
                  {user.role === "owner" && (
                    <Link href="/add-book" className={`text-book-charcoal hover:text-book-brown font-medium ${pathname === '/add-book' ? 'text-book-brown' : ''}`}>Add Book</Link>
                  )}
                  <Link href="/messages" className={`text-book-charcoal hover:text-book-brown font-medium relative ${pathname === '/messages' ? 'text-book-brown' : ''}`}>
                    Messages
                    {unreadCount > 0 && (
                      <Badge className="ml-1 bg-book-brown absolute -top-2 -right-4 w-5 h-5 flex items-center justify-center p-0 text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Link>
                  <Link href="/profile" className={`text-book-charcoal hover:text-book-brown font-medium ${pathname === '/profile' ? 'text-book-brown' : ''}`}>My Profile</Link>
                </>
              )}
            </nav>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="hidden md:inline text-sm text-muted-foreground">
                    Hi, {user.name}
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
                    onClick={() => router.push("/login")}
                    className="flex items-center space-x-1"
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="hidden md:inline">Login</span>
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => router.push("/register")}
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
          <Link href="/" className="flex flex-col items-center text-xs text-book-charcoal">
            <BookOpen className="h-6 w-6" />
            <span>Home</span>
          </Link>
          <Link href="/browse" className="flex flex-col items-center text-xs text-book-charcoal">
            <Search className="h-6 w-6" />
            <span>Browse</span>
          </Link>
          {user && (
            <Link href="/messages" className="flex flex-col items-center text-xs text-book-charcoal relative">
              <MessageCircle className="h-6 w-6" />
              <span>Messages</span>
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs bg-book-brown">
                  {unreadCount}
                </Badge>
              )}
            </Link>
          )}
          {user && user.role === "owner" && (
            <Link href="/add-book" className="flex flex-col items-center text-xs text-book-charcoal">
              <PlusCircle className="h-6 w-6" />
              <span>Add Book</span>
            </Link>
          )}
          {user && (
            <Link href="/profile" className="flex flex-col items-center text-xs text-book-charcoal">
              <User className="h-6 w-6" />
              <span>Profile</span>
            </Link>
          )}
          {!user && (
            <Link href="/login" className="flex flex-col items-center text-xs text-book-charcoal">
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
              <Link href="/" className="text-book-cream hover:text-white text-sm">Home</Link>
              <Link href="/browse" className="text-book-cream hover:text-white text-sm">Browse Books</Link>
              <Link href="/register" className="text-book-cream hover:text-white text-sm">Join the Community</Link>
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
```

## Step 7: Create Page Components

Implement the necessary page components following the Next.js App Router structure.

## Step 8: Setup Script for Running the Full-Stack Application

1. Create a `server.js` file in the root directory:

```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
require('./server/index');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});
```

2. Add start script to `package.json`:

```json
"scripts": {
  "dev": "node server.js",
  "build": "next build",
  "start": "NODE_ENV=production node server.js",
  "setup": "prisma migrate deploy && prisma db seed"
}
```

## Step 9: Setup Environment Variables

Create a `.env` file:

```
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secret-key-change-this-in-production"
API_URL="http://localhost:3001"
```

## How to Run the Application

1. Clone the repository
2. Install dependencies: `npm install`
3. Setup the database: `npm run setup`
4. Start the development server: `npm run dev`
5. Open http://localhost:3000 in your browser

## Production Deployment

For production deployment:

1. Build the application: `npm run build`
2. Start the production server: `npm start`

You can deploy this application to platforms like Vercel, Railway, or any other Node.js hosting provider.
