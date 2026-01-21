/**
 * Edit Profile Modal
 * 
 * Modal for editing user profile information including
 * display name, bio, avatar, and language preferences.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Button,
    Input,
    Label,
    Textarea,
    Badge,
} from '@/components/ui';
import { X, Plus, Loader2, Check, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/stores';
import { profileService } from '@/lib/services/profile.service';
import { AvatarUpload } from './avatar-upload';

// ----------------------- Constants 

const AVAILABLE_LANGUAGES = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
    'Russian', 'Japanese', 'Korean', 'Chinese', 'Arabic', 'Hindi',
    'Turkish', 'Vietnamese', 'Thai', 'Dutch', 'Polish', 'Swedish',
    'Norwegian', 'Danish', 'Finnish', 'Greek', 'Czech', 'Romanian',
    'Hungarian', 'Ukrainian', 'Indonesian', 'Malay', 'Tagalog', 'Hebrew',
];

const LANGUAGE_FLAGS: Record<string, string> = {
    english: '🇺🇸',
    spanish: '🇪🇸',
    french: '🇫🇷',
    german: '🇩🇪',
    italian: '🇮🇹',
    portuguese: '🇵🇹',
    russian: '🇷🇺',
    japanese: '🇯🇵',
    korean: '🇰🇷',
    chinese: '🇨🇳',
    arabic: '🇸🇦',
    hindi: '🇮🇳',
    turkish: '🇹🇷',
    vietnamese: '🇻🇳',
    thai: '🇹🇭',
    dutch: '🇳🇱',
    polish: '🇵🇱',
    swedish: '🇸🇪',
    norwegian: '🇳🇴',
    danish: '🇩🇰',
    finnish: '🇫🇮',
    greek: '🇬🇷',
    czech: '🇨🇿',
    romanian: '🇷🇴',
    hungarian: '🇭🇺',
    ukrainian: '🇺🇦',
    indonesian: '🇮🇩',
    malay: '🇲🇾',
    tagalog: '🇵🇭',
    hebrew: '🇮🇱',
};

function getLanguageFlag(language: string): string {
    const key = language.toLowerCase().trim();
    return LANGUAGE_FLAGS[key] || '🌐';
}

// -------------------- Types 

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface FormData {
    displayName: string;
    bio: string;
    nativeLanguages: string[];
    learningLanguages: string[];
}

// ------------------- Main Component 

export function EditProfileModal({ isOpen, onClose, onSuccess }: EditProfileModalProps) {
    const { user, updateUser } = useAuthStore();

    const [formData, setFormData] = useState<FormData>({
        displayName: '',
        bio: '',
        nativeLanguages: [],
        learningLanguages: [],
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Initialize form with user data
    useEffect(() => {
        if (user && isOpen) {
            setFormData({
                displayName: user.displayName || '',
                bio: user.bio || '',
                nativeLanguages: user.nativeLanguages || [],
                learningLanguages: user.learningLanguages || [],
            });
            setError(null);
            setSuccess(false);
        }
    }, [user, isOpen]);

    const handleInputChange = useCallback((field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    }, []);

    const toggleLanguage = useCallback((type: 'native' | 'learning', language: string) => {
        const key = type === 'native' ? 'nativeLanguages' : 'learningLanguages';
        setFormData(prev => {
            const current = prev[key];
            const isSelected = current.includes(language);

            if (isSelected) {
                return { ...prev, [key]: current.filter(l => l !== language) };
            } else {
                // Limit to 5 languages per category
                if (current.length >= 5) return prev;
                return { ...prev, [key]: [...current, language] };
            }
        });
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!formData.displayName.trim()) {
            setError('Display name is required');
            return;
        }

        if (formData.displayName.length > 50) {
            setError('Display name must be 50 characters or less');
            return;
        }

        if (formData.bio.length > 500) {
            setError('Bio must be 500 characters or less');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await profileService.updateProfile({
                displayName: formData.displayName.trim(),
                bio: formData.bio.trim() || undefined,
                nativeLanguages: formData.nativeLanguages,
                learningLanguages: formData.learningLanguages,
            });

            // Update auth store with new user data
            updateUser(response);

            setSuccess(true);

            // Close modal after brief success state
            setTimeout(() => {
                onClose();
                onSuccess?.();
            }, 800);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    }, [formData, updateUser, onClose, onSuccess]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Avatar Upload */}
                    {user && (
                        <div className="space-y-2">
                            <Label>Profile Photo</Label>
                            <AvatarUpload
                                currentAvatar={user.avatarUrl}
                                displayName={user.displayName || undefined}
                                username={user.username}
                            />
                        </div>
                    )}

                    {/* Display Name */}
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name *</Label>
                        <Input
                            id="displayName"
                            value={formData.displayName}
                            onChange={(e) => handleInputChange('displayName', e.target.value)}
                            placeholder="Your display name"
                            maxLength={50}
                        />
                        <p className="text-xs text-muted-foreground">
                            {formData.displayName.length}/50 characters
                        </p>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            value={formData.bio}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            placeholder="Tell others about yourself..."
                            rows={3}
                            maxLength={500}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            {formData.bio.length}/500 characters
                        </p>
                    </div>

                    {/* Native Languages */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Native Languages</Label>
                            <span className="text-xs text-muted-foreground">
                                {formData.nativeLanguages.length}/5 selected
                            </span>
                        </div>

                        {/* Selected Languages */}
                        {formData.nativeLanguages.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {formData.nativeLanguages.map((lang) => (
                                    <Badge
                                        key={lang}
                                        variant="secondary"
                                        className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
                                        onClick={() => toggleLanguage('native', lang)}
                                    >
                                        {getLanguageFlag(lang)} {lang}
                                        <X className="h-3 w-3 ml-1" />
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Language Picker */}
                        <LanguagePicker
                            selected={formData.nativeLanguages}
                            excluded={formData.learningLanguages}
                            onSelect={(lang) => toggleLanguage('native', lang)}
                            disabled={formData.nativeLanguages.length >= 5}
                        />
                    </div>

                    {/* Learning Languages */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Learning Languages</Label>
                            <span className="text-xs text-muted-foreground">
                                {formData.learningLanguages.length}/5 selected
                            </span>
                        </div>

                        {/* Selected Languages */}
                        {formData.learningLanguages.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {formData.learningLanguages.map((lang) => (
                                    <Badge
                                        key={lang}
                                        variant="outline"
                                        className="gap-1 pr-1 cursor-pointer hover:bg-muted"
                                        onClick={() => toggleLanguage('learning', lang)}
                                    >
                                        {getLanguageFlag(lang)} {lang}
                                        <X className="h-3 w-3 ml-1" />
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Language Picker */}
                        <LanguagePicker
                            selected={formData.learningLanguages}
                            excluded={formData.nativeLanguages}
                            onSelect={(lang) => toggleLanguage('learning', lang)}
                            disabled={formData.learningLanguages.length >= 5}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 p-3 rounded-lg">
                            <Check className="h-4 w-4 shrink-0" />
                            <span>Profile updated successfully!</span>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading || success}>
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : success ? (
                            <>
                                <Check className="h-4 w-4 mr-2" />
                                Saved!
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ------------------------ Language Picker 

interface LanguagePickerProps {
    selected: string[];
    excluded: string[];
    onSelect: (language: string) => void;
    disabled?: boolean;
}

function LanguagePicker({ selected, excluded, onSelect, disabled }: LanguagePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filteredLanguages = AVAILABLE_LANGUAGES.filter(lang => {
        const isAlreadySelected = selected.includes(lang);
        const isExcluded = excluded.includes(lang);
        const matchesSearch = lang.toLowerCase().includes(search.toLowerCase());
        return !isAlreadySelected && !isExcluded && matchesSearch;
    });

    const handleSelect = (language: string) => {
        onSelect(language);
        setSearch('');
    };

    if (!isOpen) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(true)}
                disabled={disabled}
                className="w-full justify-start text-muted-foreground"
            >
                <Plus className="h-4 w-4 mr-2" />
                {disabled ? 'Maximum languages selected' : 'Add language'}
            </Button>
        );
    }

    return (
        <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
            <div className="flex items-center gap-2">
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search languages..."
                    className="h-8 text-sm"
                    autoFocus
                />
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setIsOpen(false);
                        setSearch('');
                    }}
                    className="h-8 w-8 p-0"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {filteredLanguages.length > 0 ? (
                    filteredLanguages.map((lang) => (
                        <Badge
                            key={lang}
                            variant="ghost"
                            className="cursor-pointer hover:bg-primary/10 transition-colors"
                            onClick={() => handleSelect(lang)}
                        >
                            {getLanguageFlag(lang)} {lang}
                        </Badge>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground py-2">
                        {search ? 'No matching languages' : 'All languages selected'}
                    </p>
                )}
            </div>
        </div>
    );
}
