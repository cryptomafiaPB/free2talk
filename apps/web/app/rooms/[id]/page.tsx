import { MainLayout } from '@/components/ui';
import { RoomContent } from './room-content';

interface RoomPageProps {
    params: Promise<{ id: string }>;
}

const mockUser = {
    id: 'current-user',
    username: 'alex_m',
    displayName: 'Alex Martinez',
};

export default async function RoomPage({ params }: RoomPageProps) {
    const { id } = await params;

    return (
        <MainLayout
            user={mockUser}
            showHeader={false}
            showSidebar={false}
            showMobileNav={false}
            showFAB={false}
        >
            <RoomContent roomId={id} />
        </MainLayout>
    );
}
