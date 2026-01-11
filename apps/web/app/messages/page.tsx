import { MainLayout, PageContainer, EmptyState, Button } from '@/components/ui';
import { MessageCircle } from '@/components/ui/icons';
import Link from 'next/link';

const mockUser = null;

export default function MessagesPage() {
    return (
        <MainLayout user={mockUser} headerTitle="Messages" showFAB={false}>
            <PageContainer maxWidth="lg">
                <div className="py-12">
                    <EmptyState
                        icon={<MessageCircle className="h-16 w-16" />}
                        title="No messages yet"
                        description="Connect with people in voice rooms and start conversations"
                        action={
                            <Button asChild>
                                <Link href="/">Browse Rooms</Link>
                            </Button>
                        }
                    />
                </div>
            </PageContainer>
        </MainLayout>
    );
}
