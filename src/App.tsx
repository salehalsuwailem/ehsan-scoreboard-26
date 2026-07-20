import { BottomNav, Footer, Navbar } from "@/components/layout";
import { Home } from "@/pages/Home";
import { GroupDetails } from "@/pages/GroupDetails";
import { Statistics } from "@/pages/Statistics";
import { NotFound } from "@/pages/NotFound";
import { RouterProvider, matchGroup, usePath } from "@/router";

function Routes() {
  const path = usePath();
  const groupId = matchGroup(path);

  if (path === "/") return <Home />;
  if (path === "/statistics") return <Statistics />;
  if (groupId) return <GroupDetails id={groupId} />;
  return <NotFound />;
}

export default function App() {
  return (
    <RouterProvider>
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main className="flex-1 pb-24 md:pb-0">
          <Routes />
        </main>
        <Footer />
        <BottomNav />
      </div>
    </RouterProvider>
  );
}
