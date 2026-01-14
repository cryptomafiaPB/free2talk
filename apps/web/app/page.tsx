import { MainLayout, PageContainer } from '@/components/ui';
import { HallwayContent } from '@/components/hallway';

export default function Home() {
  return (
    <MainLayout headerTitle="Voice Rooms">
      <PageContainer>
        <HallwayContent />
      </PageContainer>
    </MainLayout>
  );
}
