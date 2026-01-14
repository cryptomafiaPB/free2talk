'use client';

import { useState, useCallback, memo, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Loader2, AlertCircle, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { useAuth } from '../../lib/hooks';
import { GoogleSignInButton } from './google-signin-button';
import type { RegisterInput } from '@free2talk/shared';

interface FormState {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
}

interface FormErrors {
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
}

// Password strength requirements
const passwordRequirements = [
    { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { id: 'uppercase', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { id: 'lowercase', label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
    { id: 'number', label: 'One number', test: (p: string) => /\d/.test(p) },
];

// Memoized password strength indicator
const PasswordStrength = memo(function PasswordStrength({ password }: { password: string }) {
    if (!password) return null;

    const strength = passwordRequirements.filter((req) => req.test(password)).length;
    const strengthPercent = (strength / passwordRequirements.length) * 100;

    let strengthColor = 'bg-danger-500';
    let strengthLabel = 'Weak';

    if (strength >= 4) {
        strengthColor = 'bg-success-500';
        strengthLabel = 'Strong';
    } else if (strength >= 3) {
        strengthColor = 'bg-warning-500';
        strengthLabel = 'Good';
    } else if (strength >= 2) {
        strengthColor = 'bg-warning-500';
        strengthLabel = 'Fair';
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Password strength</span>
                <span className={strengthLabel === 'Strong' ? 'text-success-500' : 'text-muted-foreground'}>
                    {strengthLabel}
                </span>
            </div>
            <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                <motion.div
                    className={`h-full ${strengthColor} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${strengthPercent}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>
            <div className="grid grid-cols-2 gap-1">
                {passwordRequirements.map((req) => {
                    const passed = req.test(password);
                    return (
                        <div
                            key={req.id}
                            className={`flex items-center gap-1.5 text-xs ${passed ? 'text-success-500' : 'text-muted-foreground'}`}
                        >
                            {passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            {req.label}
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

// Memoized form field component
const FormField = memo(function FormField({
    id,
    label,
    type,
    value,
    onChange,
    error,
    icon: Icon,
    placeholder,
    autoComplete,
    showPasswordToggle,
    onTogglePassword,
    showPassword,
    disabled,
}: {
    id: string;
    label: string;
    type: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    icon: typeof Mail;
    placeholder: string;
    autoComplete?: string;
    showPasswordToggle?: boolean;
    onTogglePassword?: () => void;
    showPassword?: boolean;
    disabled?: boolean;
}) {
    return (
        <div className="space-y-2">
            <label htmlFor={id} className="block text-sm font-medium text-foreground">
                {label}
            </label>
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Icon className="h-5 w-5" />
                </div>
                <Input
                    id={id}
                    name={id}
                    type={showPasswordToggle ? (showPassword ? 'text' : 'password') : type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    disabled={disabled}
                    className={`pl-10 ${showPasswordToggle ? 'pr-10' : ''} ${error ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                />
                {showPasswordToggle && (
                    <button
                        type="button"
                        onClick={onTogglePassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                )}
            </div>
            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-sm text-danger-500 flex items-center gap-1"
                    >
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
});

export function RegisterForm() {
    const router = useRouter();
    const { register, isLoading, error: authError, clearError } = useAuth();

    const [formState, setFormState] = useState<FormState>({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    // Validate form
    const validateForm = useCallback((): boolean => {
        const newErrors: FormErrors = {};

        if (!formState.email) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
            newErrors.email = 'Invalid email address';
        }

        if (!formState.username) {
            newErrors.username = 'Username is required';
        } else if (formState.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        } else if (!/^[a-zA-Z0-9_-]+$/.test(formState.username)) {
            newErrors.username = 'Username can only contain letters, numbers, hyphens, and underscores';
        }

        if (!formState.password) {
            newErrors.password = 'Password is required';
        } else if (formState.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (!formState.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formState.password !== formState.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formState]);

    // Handle input change
    const handleChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target;
            setFormState((prev) => ({ ...prev, [name]: value }));
            // Clear field error on change
            if (errors[name as keyof FormErrors]) {
                setErrors((prev) => ({ ...prev, [name]: undefined }));
            }
            // Clear auth error on change
            if (authError) {
                clearError();
            }
        },
        [errors, authError, clearError]
    );

    // Handle form submit
    const handleSubmit = useCallback(
        async (e: FormEvent) => {
            e.preventDefault();

            if (!validateForm()) return;

            if (!acceptedTerms) {
                setErrors((prev) => ({ ...prev, general: 'Please accept the terms and conditions' }));
                return;
            }

            try {
                const registerData: RegisterInput = {
                    email: formState.email,
                    username: formState.username,
                    password: formState.password,
                };

                await register(registerData);
                router.push('/');
            } catch (err) {
                console.error('Registration error:', err);
            }
        },
        [formState, validateForm, acceptedTerms, register, router]
    );

    return (
        <Card className="w-full max-w-md p-8 bg-surface-elevated border-surface-border">
            <div className="space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
                    <p className="text-muted-foreground">Join Free2Talk and start learning</p>
                </div>

                {/* Error Alert */}
                <AnimatePresence>
                    {(authError || errors.general) && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="p-4 rounded-lg bg-danger-500/10 border border-danger-500/20 flex items-center gap-3"
                        >
                            <AlertCircle className="h-5 w-5 text-danger-500 flex-shrink-0" />
                            <p className="text-sm text-danger-500">{authError || errors.general}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField
                        id="email"
                        label="Email"
                        type="email"
                        value={formState.email}
                        onChange={handleChange}
                        error={errors.email}
                        icon={Mail}
                        placeholder="you@example.com"
                        autoComplete="email"
                        disabled={isLoading}
                    />

                    <FormField
                        id="username"
                        label="Username"
                        type="text"
                        value={formState.username}
                        onChange={handleChange}
                        error={errors.username}
                        icon={User}
                        placeholder="johndoe"
                        autoComplete="username"
                        disabled={isLoading}
                    />

                    <FormField
                        id="password"
                        label="Password"
                        type="password"
                        value={formState.password}
                        onChange={handleChange}
                        error={errors.password}
                        icon={Lock}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        showPasswordToggle
                        showPassword={showPassword}
                        onTogglePassword={() => setShowPassword((p) => !p)}
                        disabled={isLoading}
                    />

                    <PasswordStrength password={formState.password} />

                    <FormField
                        id="confirmPassword"
                        label="Confirm Password"
                        type="password"
                        value={formState.confirmPassword}
                        onChange={handleChange}
                        error={errors.confirmPassword}
                        icon={Lock}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        showPasswordToggle
                        showPassword={showConfirmPassword}
                        onTogglePassword={() => setShowConfirmPassword((p) => !p)}
                        disabled={isLoading}
                    />

                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            className="mt-1 rounded border-surface-border bg-surface text-primary-500 focus:ring-primary-500"
                        />
                        <span className="text-sm text-muted-foreground">
                            I agree to the{' '}
                            <Link href="/terms" className="text-primary-500 hover:text-primary-400 transition-colors">
                                Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link href="/privacy" className="text-primary-500 hover:text-primary-400 transition-colors">
                                Privacy Policy
                            </Link>
                        </span>
                    </label>

                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        disabled={isLoading || !acceptedTerms}
                        className="h-12"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Creating account...</span>
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </Button>
                </form>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-surface-border" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-surface-elevated text-muted-foreground">or</span>
                    </div>
                </div>

                {/* Social Sign Up */}
                <div className="space-y-3">
                    <GoogleSignInButton mode="signup" />
                </div>

                {/* Sign In Link */}
                <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary-500 hover:text-primary-400 font-medium transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </Card>
    );
}

export default RegisterForm;
