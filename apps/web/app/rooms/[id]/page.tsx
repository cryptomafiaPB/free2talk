import { MainLayout } from '@/components/ui';
import { RoomContent } from './room-content';

interface RoomPageProps {
    params: Promise<{ id: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
    const { id } = await params;

    return (
        <MainLayout
            showHeader={false}
            showSidebar={false}
            showMobileNav={false}
            showFAB={false}
        >
            <RoomContent roomId={id} />
        </MainLayout>
    );
}
