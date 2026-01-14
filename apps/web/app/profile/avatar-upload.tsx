/**
 * Avatar Upload Component
 * 
 * Allows users to upload and manage their profile avatar.
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { Avatar, Button } from '@/components/ui';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/design-system';
import { profileService } from '@/lib/services/profile.service';
import { useAuthStore } from '@/lib/stores';

interface AvatarUploadProps {
    currentAvatar?: string | null;
    displayName?: string;
    username: string;
    onUploadSuccess?: (avatarUrl: string) => void;
    onDeleteSuccess?: () => void;
    className?: string;
}

export function AvatarUpload({
    currentAvatar,
    displayName,
    username,
    onUploadSuccess,
    onDeleteSuccess,
    className,
}: AvatarUploadProps) {
    const { updateUser } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            setError('Please select a valid image (JPEG, PNG, WebP, or GIF)');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be less than 5MB');
            return;
        }

        // Create preview
        const preview = URL.createObjectURL(file);
        setPreviewUrl(preview);
        setError(null);

        try {
            setIsUploading(true);
            const result = await profileService.uploadAvatar(file);

            // Update auth store
            updateUser({ avatarUrl: result.avatarUrl });

            onUploadSuccess?.(result.avatarUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload avatar');
            setPreviewUrl(null);
        } finally {
            setIsUploading(false);
            // Clean up preview URL
            URL.revokeObjectURL(preview);
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [updateUser, onUploadSuccess]);

    const handleDelete = useCallback(async () => {
        if (!currentAvatar) return;

        try {
            setIsDeleting(true);
            setError(null);
            await profileService.deleteAvatar();

            // Update auth store
            updateUser({ avatarUrl: null });

            onDeleteSuccess?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete avatar');
        } finally {
            setIsDeleting(false);
        }
    }, [currentAvatar, updateUser, onDeleteSuccess]);

    const displayAvatar = previewUrl || currentAvatar;

    return (
        <div className={cn('space-y-3', className)}>
            <div className="flex items-center gap-4">
                {/* Avatar Preview */}
                <div className="relative group">
                    <Avatar
                        src={displayAvatar ?? undefined}
                        fallback={displayName || username}
                        size="xl"
                        className="w-20 h-20"
                    />

                    {/* Upload Overlay */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className={cn(
                            'absolute inset-0 flex items-center justify-center',
                            'rounded-full bg-black/60 opacity-0 group-hover:opacity-100',
                            'transition-opacity cursor-pointer',
                            isUploading && 'opacity-100'
                        )}
                    >
                        {isUploading ? (
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                        ) : (
                            <Camera className="h-6 w-6 text-white" />
                        )}
                    </button>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || isDeleting}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Camera className="h-4 w-4 mr-1.5" />
                                {currentAvatar ? 'Change Photo' : 'Upload Photo'}
                            </>
                        )}
                    </Button>

                    {currentAvatar && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isUploading || isDeleting}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                    Removing...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-1.5" />
                                    Remove Photo
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Error Message */}
            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Help Text */}
            <p className="text-xs text-muted-foreground">
                Recommended: Square image, at least 200x200px. Max 5MB.
            </p>
        </div>
    );
}
