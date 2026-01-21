
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="w-20 h-20 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🚧</span>
        </div>
        
        <h1 className="text-4xl font-bold text-[var(--text)] font-heading">{title}</h1>
        
        <p className="text-[var(--text)]/70 text-lg">
          We're currently building this page. It will be ready very soon as part of our full launch.
        </p>

        <div className="pt-8">
            <Link href="/">
                <Button className="gap-2">
                    <ArrowLeft size={16} />
                    Return Home
                </Button>
            </Link>
        </div>
      </div>
    </div>
  );
}
