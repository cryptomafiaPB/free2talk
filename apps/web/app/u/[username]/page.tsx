/**
 * Public Profile Page
 * 
 * View other users' public profiles by username.
 */

import { MainLayout, PageContainer } from '@/components/ui';
import { PublicProfileContent } from './public-profile-content';
// import { PublicProfileContent } from './public-profile-content';

interface PublicProfilePageProps {
    params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
    const { username } = await params;

    return (
        <MainLayout headerTitle="Profile" showFAB={false}>
            <PageContainer maxWidth="lg">
                <PublicProfileContent username={username} />
            </PageContainer>
        </MainLayout>
    );
}
