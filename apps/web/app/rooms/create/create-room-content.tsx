'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Card,
    Button,
    Input,
    LanguageBadge,
} from '@/components/ui';
import {
    Globe,
    Users,
    Mic,
    ChevronDown,
} from '@/components/ui/icons';
import { cn } from '@/lib/design-system';

const availableLanguages = [
    'English', 'Spanish', 'French', 'German', 'Japanese',
    'Korean', 'Chinese', 'Portuguese', 'Russian', 'Italian',
    'Arabic', 'Hindi', 'Dutch', 'Swedish', 'Polish',
];

const participantOptions = [2, 4, 6, 8, 10, 12];

export function CreateRoomContent() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        topic: '',
        languages: ['English'] as string[],
        maxParticipants: 8,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const toggleLanguage = (lang: string) => {
        if (formData.languages.includes(lang)) {
            if (formData.languages.length > 1) {
                setFormData({
                    ...formData,
                    languages: formData.languages.filter(l => l !== lang),
                });
            }
        } else if (formData.languages.length < 5) {
            setFormData({
                ...formData,
                languages: [...formData.languages, lang],
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Room name is required';
        } else if (formData.name.length < 3) {
            newErrors.name = 'Room name must be at least 3 characters';
        } else if (formData.name.length > 100) {
            newErrors.name = 'Room name must be less than 100 characters';
        }

        if (formData.topic && formData.topic.length > 200) {
            newErrors.topic = 'Topic must be less than 200 characters';
        }

        if (formData.languages.length === 0) {
            newErrors.languages = 'Select at least one language';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Redirect to the room (mock ID for now)
        router.push('/rooms/new-room-id');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {/* Room Name */}
            <Card>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Mic className="h-5 w-5 text-primary-400" />
                        <h3 className="font-medium text-text-primary">Room Details</h3>
                    </div>

                    <Input
                        label="Room Name"
                        placeholder="Give your room a name..."
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        error={errors.name}
                        maxLength={100}
                    />

                    <Input
                        label="Topic (optional)"
                        placeholder="What will you be discussing?"
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        error={errors.topic}
                        helperText={`${formData.topic.length}/200`}
                        maxLength={200}
                    />
                </div>
            </Card>

            {/* Languages */}
            <Card>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-primary-400" />
                            <h3 className="font-medium text-text-primary">Languages</h3>
                        </div>
                        <span className="text-xs text-text-tertiary">
                            {formData.languages.length}/5 selected
                        </span>
                    </div>

                    {errors.languages && (
                        <p className="text-sm text-status-error">{errors.languages}</p>
                    )}

                    <div className="flex flex-wrap gap-2">
                        {availableLanguages.map((lang) => {
                            const isSelected = formData.languages.includes(lang);
                            const isDisabled = !isSelected && formData.languages.length >= 5;

                            return (
                                <button
                                    key={lang}
                                    type="button"
                                    onClick={() => toggleLanguage(lang)}
                                    disabled={isDisabled}
                                    className={cn(
                                        'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                                        isSelected
                                            ? 'bg-primary-500 text-white'
                                            : 'bg-surface-hover text-text-secondary hover:text-text-primary',
                                        isDisabled && 'opacity-50 cursor-not-allowed'
                                    )}
                                >
                                    {lang}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </Card>

            {/* Max Participants */}
            <Card>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary-400" />
                        <h3 className="font-medium text-text-primary">Room Size</h3>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {participantOptions.map((num) => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => setFormData({ ...formData, maxParticipants: num })}
                                className={cn(
                                    'py-3 rounded-xl text-sm font-medium transition-all duration-200',
                                    formData.maxParticipants === num
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-surface-hover text-text-secondary hover:text-text-primary'
                                )}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-text-tertiary text-center">
                        Maximum {formData.maxParticipants} people can join
                    </p>
                </div>
            </Card>

            {/* Preview */}
            <Card variant="gradient">
                <h4 className="text-sm font-medium text-text-secondary mb-3">Preview</h4>
                <div className="space-y-2">
                    <p className="text-lg font-semibold text-text-primary">
                        {formData.name || 'Your Room Name'}
                    </p>
                    {formData.topic && (
                        <p className="text-sm text-text-secondary">{formData.topic}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                        {formData.languages.map((lang) => (
                            <LanguageBadge key={lang} language={lang} size="sm" />
                        ))}
                    </div>
                </div>
            </Card>

            {/* Submit */}
            <Button
                type="submit"

                size="lg"
                isLoading={isSubmitting}
            >
                <Mic className="h-5 w-5" />
                Create Room
            </Button>
        </form>
    );
}
