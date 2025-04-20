// import { useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
// import { Input } from '@/components/ui/input';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import { useToast } from '@/hooks/use-toast';
// import { apiRequest } from '@/lib/queryClient';
// import { Link, useLocation } from 'wouter';

// const formSchema = z.object({
//   username: z.string().email({ message: 'Please enter a valid email address' }),
//   password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
//   confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
// }).refine((data) => data.password === data.confirmPassword, {
//   message: "Passwords don't match",
//   path: ["confirmPassword"],
// });

// export default function AdminSignup() {
//   const [, setLocation] = useLocation();
//   const [isLoading, setIsLoading] = useState(false);
//   const { toast } = useToast();

//   const form = useForm<z.infer<typeof formSchema>>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       username: '',
//       password: '',
//       confirmPassword: '',
//     },
//   });

//   async function onSubmit(values: z.infer<typeof formSchema>) {
//     setIsLoading(true);
//     try {
//       const response = await fetch('/api/auth/signup', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           username: values.username,
//           password: values.password,
//           isAdmin: true, // Set as admin
//         }),
//       });

//       if (response.ok) {
//         toast({
//           title: 'Account created successfully',
//           description: 'You can now log in with your credentials',
//         });
//         setLocation('/admin/login');
//       } else {
//         const data = await response.json();
//         throw new Error(data.message || 'Something went wrong');
//       }
//     } catch (error: any) {
//       toast({
//         variant: 'destructive',
//         title: 'Registration failed',
//         description: error.message || 'Could not create account. Please try again.',
//       });
//       console.error('Signup error:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   }

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-muted/40">
//       <Card className="w-full max-w-md">
//         <CardHeader className="space-y-1">
//           <CardTitle className="text-3xl font-bold">Admin Signup</CardTitle>
//           <CardDescription>
//             Create an admin account to manage the calendar
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//               <FormField
//                 control={form.control}
//                 name="username"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Email</FormLabel>
//                     <FormControl>
//                       <Input placeholder="admin@example.com" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="password"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Password</FormLabel>
//                     <FormControl>
//                       <Input type="password" placeholder="••••••" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="confirmPassword"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Confirm Password</FormLabel>
//                     <FormControl>
//                       <Input type="password" placeholder="••••••" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <Button type="submit" className="w-full" disabled={isLoading}>
//                 {isLoading ? 'Creating account...' : 'Sign Up'}
//               </Button>
//             </form>
//           </Form>
//         </CardContent>
//         <CardFooter className="flex justify-center border-t p-4">
//           <p className="text-sm text-muted-foreground">
//             Already have an account?{' '}
//             <Link href="/admin/login">
//               <a className="font-medium text-primary hover:underline">Login</a>
//             </Link>
//           </p>
//         </CardFooter>
//       </Card>
//     </div>
//   );
// }

// src/pages/FunnySignupAttempt.tsx
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Link } from 'wouter';
import { Ban } from 'lucide-react'; // Optional: Add an icon

export default function AdminSignup() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
            <Ban className="h-8 w-8 text-destructive" /> Halt! <Ban className="h-8 w-8 text-destructive" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg font-semibold">🚫 Admin Signups Disabled 🚫</p>
          <p>Looks like you tried to sneak in through the admin signup portal!</p>
          <p>We've sealed this entrance tighter than a pickle jar. No new admins getting minted here!</p>
          <p>If you're supposed to be an admin, you should already have an account.</p>
           {/* Optional: Add a funny image/gif */}
        </CardContent>
         <CardFooter className="flex justify-center border-t p-4">
           <p className="text-sm text-muted-foreground">
            Lost? Try the{' '}
            <Link href="/admin/login">
              <a className="font-medium text-primary hover:underline">Admin Login</a>
            </Link>
             {' '}page instead.
           </p>
         </CardFooter>
      </Card>
    </div>
  );
}