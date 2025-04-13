
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Layout from "../components/Layout";
import { useBookExchange } from "../context/BookExchangeContext";
import { toast } from "../hooks/use-toast";
import { BookOpen, Upload, X } from "lucide-react";

const bookSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  author: z.string().min(1, { message: "Author is required" }),
  genre: z.string().optional(),
  location: z.string().min(1, { message: "Location is required" }),
  contact: z.string().min(1, { message: "Contact information is required" }),
  coverUrl: z.string().optional(),
});

type BookFormValues = z.infer<typeof bookSchema>;

const AddBook = () => {
  const { addBook, currentUser } = useBookExchange();
  const navigate = useNavigate();
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: "",
      author: "",
      genre: "",
      location: "",
      contact: currentUser?.email || "",
      coverUrl: "",
    },
  });

  // Redirect if user is not logged in or is not a book owner
  React.useEffect(() => {
    if (!currentUser) {
      toast({
        title: "Not authorized",
        description: "Please log in to add a book",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (currentUser.role !== "owner") {
      toast({
        title: "Not authorized",
        description: "Only book owners can add listings",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [currentUser, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setPreviewUrl(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearCoverImage = () => {
    setCoverFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = (values: BookFormValues) => {
    // Ensure required fields are present
    const bookData = {
      title: values.title,
      author: values.author,
      genre: values.genre || undefined,
      location: values.location,
      contact: values.contact,
      coverUrl: values.coverUrl || undefined,
    };
    
    addBook(bookData, coverFile || undefined);
    navigate("/profile");
  };

  if (!currentUser || currentUser.role !== "owner") {
    return null; // Don't render anything while redirecting
  }

  return (
    <Layout>
      <div className="page-container max-w-2xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold text-center mb-6 text-book-charcoal">Add A Book Listing</h1>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Book Title</FormLabel>
                      <FormControl>
                        <Input placeholder="To Kill a Mockingbird" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="author"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author</FormLabel>
                      <FormControl>
                        <Input placeholder="Harper Lee" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="genre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Genre (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Fiction, Non-fiction, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="City, Neighborhood" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Information</FormLabel>
                    <FormControl>
                      <Input placeholder="Email or phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-3">
                <FormLabel>Book Cover</FormLabel>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="relative mt-2 mb-4">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="sr-only"
                        id="cover-upload"
                      />
                      <label
                        htmlFor="cover-upload"
                        className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-md cursor-pointer border-muted-foreground/25 hover:border-muted-foreground/50"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground">Click to upload</p>
                        </div>
                      </label>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="coverUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Or enter image URL (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://example.com/book-cover.jpg" 
                              {...field} 
                              disabled={!!coverFile}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div>
                    <p className="mb-2 text-sm font-medium">Preview</p>
                    <div className="relative aspect-[3/4] bg-muted rounded-md overflow-hidden">
                      {previewUrl ? (
                        <>
                          <img 
                            src={previewUrl} 
                            alt="Cover preview" 
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={clearCoverImage}
                            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate("/profile")}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-book-brown hover:bg-book-brown/90">
                  Add Book
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
};

export default AddBook;
