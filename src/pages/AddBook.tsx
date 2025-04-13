
import React from "react";
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

  const onSubmit = (values: BookFormValues) => {
    addBook(values);
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
              
              <FormField
                control={form.control}
                name="coverUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Book Cover Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/book-cover.jpg" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Enter a URL for the book cover image. You can use image hosting services 
                      like Unsplash or Imgur.
                    </p>
                  </FormItem>
                )}
              />
              
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
