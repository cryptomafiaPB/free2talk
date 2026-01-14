import { MainLayout, PageContainer } from '@/components/ui';
import { SimpleHeader } from '@/components/ui/header';
import { CreateRoomContent } from './create-room-content';

export default function CreateRoomPage() {
    return (
        <MainLayout
            showHeader={false}
            showFAB={false}
        >
            <SimpleHeader title="Create Room" backHref="/" />
            <PageContainer maxWidth="md">
                <CreateRoomContent />
            </PageContainer>
        </MainLayout>
    );
}
