import { and, desc, eq } from "drizzle-orm";
import { boardMembers, boards, lists } from "../models/schema.js";
import { AppError } from "../Utils/AppError.js";
import { catchAsync } from "../Utils/catchAsync.js";
import { db } from "../db/db.js";

export const createList = catchAsync(async (req, res, next) => {
  // 1. check list title
  const { title } = req.body;
  const { boardId } = req.params;
  const { id } = req.user;
  if (!title) return next(new AppError("List title is required.", 400));

  // 3. get boardId
  const [board] = await db
    .select()
    .from(boards)
    .where(eq(boards.id, boardId))
    .limit(1);
  if (!board)
    return next(new AppError("No board found with that BoardID", 404));

  // 2. check if user is part of board
  const [member] = await db
    .select()
    .from(boardMembers)
    .where(and(eq(boardMembers.userId, id), eq(boardMembers.boardId, boardId)))
    .limit(1);
  if (!member)
    return next(
      new AppError("Only board members can create lists in a board.", 409),
    );

  // calculate position
  const lastList = await db
    .select()
    .from(lists)
    .where(eq(lists.boardId, boardId))
    .orderBy(desc(lists.position))
    .limit(1);

  const newPosition = lastList.length ? lastList[0].position + 1 : 1;

  // 3. insert into lists table
  const [list] = await db
    .insert(lists)
    .values({
      boardId: boardId,
      title: title,
      position: newPosition,
    })
    .returning();
  res.status(201).json({
    status: "success",
    message: "list created successfully.",
    data: list,
  });
});
