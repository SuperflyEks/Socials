/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { GetStaticPaths, GetStaticPropsContext, InferGetServerSidePropsType, NextPage } from "next";
import { ssgHelper } from "~/server/api/ssgHelper";
import Head from "next/head";
import { api } from "~/utils/api";
import ErrorPage from "next/error";
import Link from "next/link";
import { IconHoverEffect } from "~/components/IconHoverEffect";
import { VscArrowLeft } from "react-icons/vsc";
import { ProfileImage } from "~/components/ProfileImage";
import { InfiniteChirpList } from "~/components/InfiniteChirpList";
import { Button } from "~/components/Button";
import { useSession } from "next-auth/react";

const ProfilePage: NextPage<InferGetServerSidePropsType<typeof getStaticProps>> = ({ id, }) => {
    const { data: profile } = api.profile.getById.useQuery({id});
    const chirps = api.chirp.infiniteProfileFeed.useInfiniteQuery(
                                            { userId: id },
                                            { getNextPageParam: (lastPage) => lastPage.nextCursor }
    );                         
    const trpcUtils = api.useContext();
    const toggleFollow = api.profile.toggleFollow.useMutation({ onSuccess: ({ addedFollow }) => {
                                                                trpcUtils.profile.getById.setData({id}, oldData => {
                                                                    if(oldData == null) return

                                                                    const countModifier = addedFollow ? 1 : -1
                                                                    return {
                                                                        ...oldData,
                                                                        isFollowing: addedFollow,
                                                                        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                                                                        followersCount: oldData.followersCount + countModifier,
                                                                    }
                                                                })
                                                            }}
    )
    if (profile == null || profile.name == null) {
        return <ErrorPage statusCode={404}/>
    }

    return ( 
        <>
            <Head>
                <title>{`Chirper - ${profile.name}`}</title>
            </Head>
            <header className="sticky top-0 z-10 flex items-center border-b bg-white px-4 py-2">
                <Link href=".." className="mr-2">
                    <IconHoverEffect>
                        <VscArrowLeft className="h-6 w-6"/>
                    </IconHoverEffect>
                </Link>
                <ProfileImage src={profile.image} className="flex-shrink-0"/>
                <div className="ml-2 flex-grow">
                    <h1 className="text-lg font-bold">
                        {profile.name}
                    </h1>
                    <div className="text-gray-500">
                        {profile.chirpsCount}{" "}
                        {getPlural(profile.chirpsCount, "Chirp", "Chirps")} -{" "}
                        {profile.followersCount}{" "}
                        {getPlural(profile.followersCount, "Follower", "Followers")} -{" "}
                        {profile.followsCount} Following
                    </div>
                </div>
                <FollowButton 
                    isFollowing={profile.isFollowing} 
                    isLoading={toggleFollow.isLoading}
                    userId={id} 
                    onClick={() => toggleFollow.mutate({ userId: id })}
                />
            </header>
            <main>
                <InfiniteChirpList 
                    chirps = {chirps.data?.pages.flatMap((page) => page.chirps)}
                    isError = {chirps.isError}
                    isLoading = {chirps.isLoading}
                    hasMore = {chirps.hasNextPage}
                    fetchNewChirps = {chirps.fetchNextPage}
                />
            </main>
        </>
    )
}

function FollowButton({ userId, isFollowing, isLoading, onClick }: { userId: string; isFollowing: boolean; isLoading: boolean; onClick: () => void; }) {
    const session = useSession();

    if (session.status !== "authenticated" || session.data.user.id === userId ) {
        return null;
    }
    
    return (
        <>
            <Button disabled={isLoading} onClick={onClick} small gray={isFollowing}>
                {isFollowing ? "Unfollow" : "Follow"}
            </Button>
        </>
    )
}

const pluralRules = new Intl.PluralRules()
function getPlural(number: number, singular: string, plural: string) {
    return pluralRules.select(number) === "one" ? singular : plural
}

export const getStaticPaths: GetStaticPaths = () => {
    return {
        paths: [],
        fallback: "blocking"
    }
}

export async function getStaticProps(context: GetStaticPropsContext<{ id: string }>) {
    const id = context.params?.id;

    if (id == null) {
        return {
            redirect: {
                destination: "/"
            }
        }
    }

    const ssg = ssgHelper()
    await ssg.profile.getById.prefetch({ id })

    return {
        props: {
            trpcState: ssg.dehydrate(),
            id
        }
    }
}

export default ProfilePage;