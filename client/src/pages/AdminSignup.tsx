import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Link } from 'wouter';
import { Ban } from 'lucide-react';

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