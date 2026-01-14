import { MainLayout, PageContainer } from '@/components/ui';
import { ProfileContent } from './profile-content';

export default function ProfilePage() {
    return (
        <MainLayout headerTitle="Profile" showFAB={false}>
            <PageContainer maxWidth="lg">
                <ProfileContent />
            </PageContainer>
        </MainLayout>
    );
}
