import { MainLayout, PageContainer } from '@/components/ui';
import { RandomMatchContent } from './random-content';

const mockUser = null;

export default function RandomMatchPage() {
    return (
        <MainLayout user={mockUser} headerTitle="Random Match" showFAB={false}>
            <PageContainer maxWidth="md">
                <RandomMatchContent />
            </PageContainer>
        </MainLayout>
    );
}
