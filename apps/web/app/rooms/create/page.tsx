import { MainLayout, PageContainer } from '@/components/ui';
import { SimpleHeader } from '@/components/ui/header';
import { CreateRoomContent } from './create-room-content';

const mockUser = {
    id: 'current-user',
    username: 'alex_m',
    displayName: 'Alex Martinez',
};

export default function CreateRoomPage() {
    return (
        <MainLayout
            user={mockUser}
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
