import { RegisterContent } from './register-content';

export const metadata = {
    title: 'Create Account | Free2Talk',
    description: 'Join Free2Talk and start practicing languages with native speakers',
};

export default function RegisterPage() {
    return (
        <main className="min-h-screen flex items-center justify-center p-4 bg-background">
            <RegisterContent />
        </main>
    );
}
