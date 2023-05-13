import { type NextPage } from "next";
import { NewChirpForm } from "../components/NewChirpForm";
import { InfiniteChirpList } from "../components/InfiniteChirpList";
import { api } from "~/utils/api";


const Home: NextPage = () => {
  return (
    <>
      <header className="sticky top-0 z-10 border-b bg-white pt-2">
        <h1 className="mb-2 px-4 text-lg font-bold">Home</h1>
      </header>
      <NewChirpForm/>
      <RecentChirp/>
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

export default Home;
