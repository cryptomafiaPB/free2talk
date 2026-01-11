'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Card,
    Button,
    Input,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    Separator,
} from '@/components/ui';
import { cn } from '@/lib/design-system';

export function AuthContent() {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage(null);
        setIsLoading(true);
        try {
            // Basic client-side validation
            const form = e.currentTarget;
            const formData = new FormData(form);
            const email = String(formData.get('email') || '').trim();
            const password = String(formData.get('password') || '').trim();

            if (!email || !password) {
                throw new Error('Please fill in all required fields.');
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Please enter a valid email address.');
            }

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1200));
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
            setErrorMessage(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md space-y-6">
            {/* Logo */}
            <div className="text-center">
                <Link href="/" className="inline-flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">F2T</span>
                    </div>
                    <span className="text-2xl font-bold text-text-primary">Free2Talk</span>
                </Link>
                <p className="mt-4 text-text-secondary">
                    Join the community and start practicing
                </p>
            </div>

            {/* Auth Card */}
            <Card padding="lg">
                <Tabs defaultValue="login" className="w-full">
                    <TabsList className="w-full grid grid-cols-2 mb-6">
                        <TabsTrigger value="login">Sign In</TabsTrigger>
                        <TabsTrigger value="register">Sign Up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            <Input
                                label="Email"
                                type="email"
                                placeholder="you@example.com"
                                name="email"
                                required
                            />
                            <Input
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                name="password"
                                required
                            />
                            <div className="flex items-center justify-end">
                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-primary-400 hover:text-primary-300"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            {errorMessage && (
                                <p role="alert" aria-live="polite" className="text-sm text-status-error">
                                    {errorMessage}
                                </p>
                            )}
                            <Button type="submit" isLoading={isLoading}>
                                Sign In
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="register">
                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            <Input
                                label="Username"
                                placeholder="johndoe"
                                required
                            />
                            <Input
                                label="Email"
                                type="email"
                                placeholder="you@example.com"
                                name="email"
                                required
                            />
                            <Input
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                helperText="At least 8 characters"
                                name="password"
                                required
                            />
                            {errorMessage && (
                                <p role="alert" aria-live="polite" className="text-sm text-status-error">
                                    {errorMessage}
                                </p>
                            )}
                            <Button type="submit" fullWidth isLoading={isLoading}>
                                Create Account
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <Separator />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-2 bg-surface-default text-text-tertiary">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <Button variant="secondary">
                            <GoogleIcon className="h-5 w-5 mr-2" />
                            Google
                        </Button>
                        <Button variant="secondary">
                            <GitHubIcon className="h-5 w-5 mr-2" />
                            GitHub
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Footer */}
            <p className="text-center text-xs text-text-tertiary">
                By continuing, you agree to our{' '}
                <Link href="/terms" className="text-text-secondary hover:text-text-primary">
                    Terms
                </Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-text-secondary hover:text-text-primary">
                    Privacy Policy
                </Link>
            </p>

            {/* Skip for now - direct to rooms */}
            <div className="text-center">
                <Link
                    href="/"
                    className="text-sm text-text-secondary hover:text-primary-400 transition-colors"
                >
                    Browse rooms without signing in →
                </Link>
            </div>
        </div>
    );
}

function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

function GitHubIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
    );
}
