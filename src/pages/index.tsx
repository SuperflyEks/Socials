import { type NextPage } from "next";
import { NewChirpForm } from "../components/NewChirpForm";
import { InfiniteChirpList } from "../components/InfiniteChirpList";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";
import { useState } from "react";

const TABS = ["Recent", "Following"] as const

const Home: NextPage = () => {
  const [selectedTab, setSelectedTab] = useState<(typeof TABS)[number]>("Recent");
  const session = useSession();

  return (
    <>
      <header className="sticky top-0 z-10 border-b bg-white pt-2">
        <h1 className="mb-2 px-4 text-lg font-bold">Home</h1>
        {session.status === "authenticated" && (
          <div className="flex">
            {TABS.map((tab) => {
              return (
                <>
                  <button key={tab} className={`flex-grow p-2 hover:bg-gray-200
                    focus-visible:bg-gray-200 ${
                      tab === selectedTab
                        ? "border-b-4 border-b-blue-500 font-bold"
                        : ""
                      }
                  `}
                    onClick={() => setSelectedTab(tab)}
                  >
                    {tab}
                  </button>
                </>
              )
            })}
          </div>
        )}
      </header>
      <NewChirpForm/>
      {selectedTab === "Recent" ? <RecentChirp/> : <FollowingChirp/>}
    </>
  );
};

function RecentChirp() {
  const chirps = api.chirp.infiniteFeed.useInfiniteQuery(
    {},
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  return (
    <InfiniteChirpList 
      chirps = {chirps.data?.pages.flatMap((page) => page.chirps)}
      isError = {chirps.isError}
      isLoading = {chirps.isLoading}
      hasMore = {chirps.hasNextPage}
      fetchNewChirps = {chirps.fetchNextPage}
    />
  );
}

function FollowingChirp() {
  const chirps = api.chirp.infiniteFeed.useInfiniteQuery(
    { onlyFollowing: true },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  return (
    <InfiniteChirpList 
      chirps = {chirps.data?.pages.flatMap((page) => page.chirps)}
      isError = {chirps.isError}
      isLoading = {chirps.isLoading}
      hasMore = {chirps.hasNextPage}
      fetchNewChirps = {chirps.fetchNextPage}
    />
  );
}


export default Home;
