import { MainLayout, PageContainer } from '@/components/ui';
import { RoomsContent } from './rooms-content';

// Mock user for now - this would come from auth context
const mockUser = null; // or set to a user object when logged in

export default function Home() {
  return (
    <MainLayout user={mockUser} headerTitle="Voice Rooms">
      <PageContainer>
        <RoomsContent />
      </PageContainer>
    </MainLayout>
  );
}
