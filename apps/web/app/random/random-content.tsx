'use client';

import { useState } from 'react';
import {
    Card,
    Button,
    LanguageBadge,
    Avatar,
} from '@/components/ui';
import {
    Users,
    Globe,
    Phone,
    RefreshCw,
    Mic,
} from '@/components/ui/icons';
import { cn } from '@/lib/design-system';

type MatchState = 'idle' | 'searching' | 'found' | 'connected';

export function RandomMatchContent() {
    const [matchState, setMatchState] = useState<MatchState>('idle');
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);

    const languages = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Korean', 'Chinese'];

    const toggleLanguage = (lang: string) => {
        if (selectedLanguages.includes(lang)) {
            if (selectedLanguages.length > 1) {
                setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
            }
        } else {
            setSelectedLanguages([...selectedLanguages, lang]);
        }
    };

    const startSearching = () => {
        setMatchState('searching');
        // Simulate finding a match after 3 seconds
        setTimeout(() => {
            setMatchState('found');
        }, 3000);
    };

    const cancelSearch = () => {
        setMatchState('idle');
    };

    return (
        <div className="space-y-6 py-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-500/10 mb-4">
                    <Users className="h-8 w-8 text-primary-400" />
                </div>
                <h1 className="text-2xl font-bold text-text-primary">Find a Partner</h1>
                <p className="text-text-secondary max-w-sm mx-auto">
                    Get matched with someone who speaks your target language
                </p>
            </div>

            {/* Language Selection */}
            <Card>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary-400" />
                        <h3 className="font-medium text-text-primary">Practice Languages</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {languages.map((lang) => (
                            <button
                                key={lang}
                                onClick={() => toggleLanguage(lang)}
                                disabled={matchState !== 'idle'}
                                className={cn(
                                    'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                                    selectedLanguages.includes(lang)
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-surface-hover text-text-secondary hover:text-text-primary',
                                    matchState !== 'idle' && 'opacity-50 cursor-not-allowed'
                                )}
                            >
                                {lang}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Match State Display */}
            <div className="min-h-[300px] flex items-center justify-center">
                {matchState === 'idle' && (
                    <div className="text-center space-y-6">
                        <div className="relative">
                            <div className="h-32 w-32 rounded-full bg-surface-default border-2 border-dashed border-surface-border flex items-center justify-center mx-auto">
                                <Users className="h-12 w-12 text-text-tertiary" />
                            </div>
                        </div>
                        <Button size="lg" onClick={startSearching} className="px-8">
                            <Phone className="h-5 w-5" />
                            Start Matching
                        </Button>
                    </div>
                )}

                {matchState === 'searching' && (
                    <div className="text-center space-y-6">
                        <div className="relative">
                            {/* Pulsing circles */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-32 w-32 rounded-full bg-primary-500/20 animate-ping" />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-24 w-24 rounded-full bg-primary-500/30 animate-ping animation-delay-200" />
                            </div>
                            <div className="relative h-32 w-32 rounded-full bg-primary-500/10 border-2 border-primary-500/50 flex items-center justify-center mx-auto">
                                <RefreshCw className="h-10 w-10 text-primary-400 animate-spin" />
                            </div>
                        </div>
                        <div>
                            <p className="text-lg text-text-primary">Looking for a partner...</p>
                            <p className="text-sm text-text-secondary mt-1">
                                Practicing: {selectedLanguages.join(', ')}
                            </p>
                        </div>
                        <Button variant="ghost" onClick={cancelSearch}>
                            Cancel
                        </Button>
                    </div>
                )}

                {matchState === 'found' && (
                    <div className="text-center space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-36 w-36 rounded-full bg-status-success/10 animate-pulse" />
                            </div>
                            <Avatar
                                fallback="Maria"
                                size="3xl"
                                className="mx-auto relative border-4 border-status-success"
                            />
                        </div>
                        <div>
                            <p className="text-xl font-semibold text-text-primary">Maria</p>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <LanguageBadge language="Spanish" size="sm" />
                                <LanguageBadge language="English" size="sm" />
                            </div>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <Button
                                size="lg"
                                onClick={() => setMatchState('connected')}
                            >
                                <Mic className="h-5 w-5" />
                                Connect
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setMatchState('searching')}
                            >
                                Skip
                            </Button>
                        </div>
                    </div>
                )}

                {matchState === 'connected' && (
                    <Card className="w-full max-w-sm mx-auto text-center p-8">
                        <Avatar
                            fallback="Maria"
                            size="2xl"
                            status="speaking"
                            showStatus
                            className="mx-auto mb-4"
                        />
                        <p className="text-lg font-semibold text-text-primary">Connected with Maria</p>
                        <p className="text-sm text-text-secondary mt-1">Call in progress...</p>
                        <div className="flex justify-center gap-4 mt-6">
                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full">
                                <Mic className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="danger"
                                size="icon"
                                className="h-12 w-12 rounded-full"
                                onClick={() => setMatchState('idle')}
                            >
                                <Phone className="h-5 w-5" />
                            </Button>
                        </div>
                    </Card>
                )}
            </div>

            {/* Tips */}
            {matchState === 'idle' && (
                <Card variant="ghost" className="bg-surface-default/50 text-center py-6">
                    <p className="text-sm text-text-secondary">
                        💡 Select multiple languages to find more partners
                    </p>
                </Card>
            )}
        </div>
    );
}
