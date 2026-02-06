'use client';

import Link from 'next/link';
import { RegisterForm, GuestRoute } from '@/components/auth';
import Image from 'next/image';

export function RegisterContent() {
    return (
        <GuestRoute>
            <div className="w-full max-w-md space-y-6">
                {/* Logo */}
                <div className="text-center">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                            {/* <span className="text-white font-bold text-xl">F2T</span> */}
                            <Image
                                src="/white-logo.png"
                                alt="Free2Talk Logo"
                                width={74}
                                height={74}
                            // className="h-6 w-6"
                            />
                        </div>
                        <span className="text-2xl font-bold text-foreground">Free2Talk</span>
                    </Link>
                </div>

                {/* Register Form */}
                <RegisterForm />

                {/* Skip for now */}
                {/* <div className="text-center">
                    <Link
                        href="/"
                        className="text-sm text-muted-foreground hover:text-primary-400 transition-colors"
                    >
                        Browse rooms without signing in →
                    </Link>
                </div> */}
            </div>
        </GuestRoute>
    );
}
