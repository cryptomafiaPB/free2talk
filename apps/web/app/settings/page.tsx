/**
 * Settings Page
 * 
 * User settings and preferences.
 */

import { MainLayout, PageContainer } from '@/components/ui';
import { Card, CardContent } from '@/components/ui';
import { Construction } from 'lucide-react';

export default function SettingsPage() {
    return (
        <MainLayout headerTitle="Settings" showFAB={false}>
            <PageContainer maxWidth="lg">
                <Card className="border-0 bg-card/50">
                    <CardContent className="py-16 text-center">
                        <Construction className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                            Settings Coming Soon
                        </h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            We&apos;re working on building out the settings page.
                            For now, you can edit your profile from the Profile page.
                        </p>
                    </CardContent>
                </Card>
            </PageContainer>
        </MainLayout>
    );
}
