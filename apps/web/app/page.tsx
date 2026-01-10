

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Free2Talk</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Practice languages with native speakers through voice rooms
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
          >
            Get Started
          </a>
          <a
            href="/hallway"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition"
          >
            Browse Rooms
          </a>
        </div>
      </div>
    </main>
  );
}
