
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Layout from "../components/Layout";
import { useBookExchange } from "../context/BookExchangeContext";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { loginUser } = useBookExchange();
  const navigate = useNavigate();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    const success = loginUser(values.email, values.password);
    if (success) {
      navigate("/profile");
    }
  };

  return (
    <Layout>
      <div className="page-container max-w-md mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold text-center mb-6 text-book-charcoal">Sign In</h1>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input placeholder="******" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full bg-book-brown hover:bg-book-brown/90">
                Sign In
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Don't have an account yet?{" "}
              <Link to="/register" className="text-book-brown hover:underline font-medium">
                Create an account
              </Link>
            </p>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p>Demo accounts:</p>
              <p>
                <strong>Book Owner:</strong> john@example.com / password123
              </p>
              <p>
                <strong>Book Seeker:</strong> jane@example.com / password123
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
