'use client';

import Link from 'next/link';
import { RegisterForm, GuestRoute } from '@/components/auth';

export function RegisterContent() {
    return (
        <GuestRoute>
            <div className="w-full max-w-md space-y-6">
                {/* Logo */}
                <div className="text-center">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                            <span className="text-white font-bold text-xl">F2T</span>
                        </div>
                        <span className="text-2xl font-bold text-foreground">Free2Talk</span>
                    </Link>
                </div>

                {/* Register Form */}
                <RegisterForm />

                {/* Skip for now */}
                <div className="text-center">
                    <Link
                        href="/"
                        className="text-sm text-muted-foreground hover:text-primary-400 transition-colors"
                    >
                        Browse rooms without signing in →
                    </Link>
                </div>
            </div>
        </GuestRoute>
    );
}
