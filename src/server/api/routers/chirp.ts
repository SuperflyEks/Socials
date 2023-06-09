/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type Prisma } from "@prisma/client";
import { type inferAsyncReturnType } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  type createTRPCContext,
} from "~/server/api/trpc";

export const chirpRouter = createTRPCRouter({
  infiniteProfileFeed: publicProcedure.input(
    z.object({
      userId: z.string(),
      limit: z.number().optional(),
      cursor: z.object({ id:z.string(), createdAt: z.date() }).optional(),
    })).query(async ({ input: { limit = 10, userId ,cursor }, ctx }) => {
      return await getInfiniteChirps({ 
        limit, 
        ctx, 
        cursor, 
        whereClause: { userId },
      });
    }),
  infiniteFeed: publicProcedure.input(
    z.object({
      onlyFollowing: z.boolean().optional(),
      limit: z.number().optional(),
      cursor: z.object({ id:z.string(), createdAt: z.date() }).optional(),
    })
  ).query(async ({ input: { limit = 10, onlyFollowing = false ,cursor }, ctx }) => {
    const currenUserId = ctx.session?.user.id;

    return await getInfiniteChirps({ 
      limit, 
      ctx, 
      cursor, 
      whereClause: currenUserId == null || !onlyFollowing 
        ? undefined 
        : {
            user: {
              followers: { some: { id: currenUserId } },
            },
          }, 
    });
  }),
  create: protectedProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ input: { content }, ctx}) => {
      const chirp = await ctx.prisma.chirp.create({ 
        data: { content, userId: ctx.session.user.id},
      })
      void ctx.revalidateSSG?.(`/profiles/${ctx.session.user.id}`)

      return chirp;
    }),
  toggleLike: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input: {id}, ctx }) => {
      const data = { chirpId: id, userId: ctx.session.user.id };

      const existingLike = await ctx.prisma.like.findUnique({
        where: { userId_chirpId: data } 
      })

      if (existingLike == null) {
        await ctx.prisma.like.create({ data })
        return { addedLike: true }
      } else {
        await ctx.prisma.like.delete({ where: { userId_chirpId: data }})
        return { addedLike: false }
      }
    })
});


async function getInfiniteChirps({
  whereClause,
  ctx, limit, cursor
} : {
  whereClause?: Prisma.ChirpWhereInput;
  limit: number;
  cursor: { id: string; createdAt: Date } | undefined;
  ctx: inferAsyncReturnType<typeof createTRPCContext>;
}) {
  const currenUserId = ctx.session?.user.id

  const data = await ctx.prisma.chirp.findMany({
    take: limit + 1,
    cursor: cursor ? { createdAt_id: cursor } : undefined,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    where: whereClause,
    select: {
      id: true,
      content: true,
      createdAt: true,
      _count: { select: { likes: true } },
      likes: currenUserId == null ? false : { where: { userId: currenUserId}},
      user: { select: { name: true, id: true, image: true } }
    }
  })
  let nextCursor: typeof cursor | undefined;
  if (data.length > limit) {
    const nextItem = data.pop();
    if (nextItem != null) {
      nextCursor = { id: nextItem.id, createdAt: nextItem.createdAt }
    }
  }

  return {chirps: data.map((chirp) => {
    return {
      id: chirp.id,
      content: chirp.content,
      createdAt: chirp.createdAt,
      likeCount: chirp._count.likes,
      user: chirp.user,
      likedByMe: chirp.likes?.length > 0,
    };
  }), nextCursor}
}