import { MainLayout, PageContainer } from '@/components/ui';
import { ProfileContent } from './profile-content';

// Mock user for now
const mockUser = {
    id: 'current-user',
    username: 'alex_m',
    displayName: 'Alex Martinez',
    avatarUrl: undefined,
};

export default function ProfilePage() {
    return (
        <MainLayout user={mockUser} headerTitle="Profile" showFAB={false}>
            <PageContainer maxWidth="lg">
                <ProfileContent />
            </PageContainer>
        </MainLayout>
    );
}
