import { MainLayout, PageContainer } from '@/components/ui';
import { RandomMatchContent } from './random-content';

export default function RandomMatchPage() {
    return (
        <MainLayout headerTitle="Random Match" showFAB={false}>
            <PageContainer maxWidth="md">
                <RandomMatchContent />
            </PageContainer>
        </MainLayout>
    );
}
