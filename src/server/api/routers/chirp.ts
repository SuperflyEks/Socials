import { TypeOf, z } from "zod";
import { InfiniteChirpList } from "~/components/InfiniteChirpList";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const chirpRouter = createTRPCRouter({
  infiniteFeed: publicProcedure.input(
    z.object({
      limit: z.number().optional(),
      cursor: z.object({ id:z.string(), createdAt: z.date() }).optional(),
    })
  ).query(async ({ input: { limit = 10, cursor }, ctx }) => {
      const currenUserId = ctx.session?.user.id

      const data = await ctx.prisma.chirp.findMany({
        take: limit + 1,
        cursor: cursor ? { createdAt_id: cursor } : undefined,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          content: true,
          createdAt: true,
          _count: { select: { likes: true } },
          likes: currenUserId == null ? false : { where: { userId: currenUserId}},
          user: { select: { name: true, id: true, image: true } }
        }
      })
      let nextCursor: typeof cursor | undefined
      if (data.length > limit) {
        const nextItem = data.pop()
        if (nextItem != null) {
          nextCursor = { id: nextItem.id, createdAt: nextItem.createdAt }
        }
      }

      return {chirps: data.map(chirp => {
        return {
          id: chirp.id,
          content: chirp.content,
          createdAt: chirp.createdAt,
          likeCount: chirp._count.likes,
          user: chirp.user,
          likedByMe: chirp.likes?.length > 0,
        };
      }), nextCursor}
    }),
  create: protectedProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ input: { content }, ctx}) => {
      const chirp = await ctx.prisma.chirp.create({ 
        data: { content, userId: ctx.session.user.id},
      })
      return chirp;
    })
});
