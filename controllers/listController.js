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
      new AppError("Only board members can create lists in a board.", 403),
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

export const deleteList = catchAsync(async (req, res, next) => {
  // 1. check list title
  const { listId } = req.params;
  const { id } = req.user;

  // get list
  const [list] = await db
    .select()
    .from(lists)
    .where(eq(lists.id, listId))
    .limit(1);

  if (!list) return next(new AppError("List not found", 404));

  // cehck membership
  const [member] = await db
    .select()
    .from(boardMembers)
    .where(
      and(eq(boardMembers.userId, id), eq(boardMembers.boardId, list.boardId)),
    )
    .limit(1);

  if (!member)
    return next(new AppError("Not authorized to delete this list", 403));

  // delete
  const deletedList = await db.delete(lists).where(eq(lists.id, listId));

  res.status(200).json({
    status: "success",
    message: "list deleted successfully.",
  });
});

export const getLists = catchAsync(async (req, res, next) => {
  // 1. get the boardId
  const { boardId } = req.params;
  const { id } = req.user;

  // check if board exists
  const [board] = await db
    .select()
    .from(boards)
    .where(eq(boards.id, boardId))
    .limit(1);

  if (!board) return next(new AppError("Board not found", 404));

  // check if is a member
  const [member] = await db
    .select()
    .from(boardMembers)
    .where(and(eq(boardMembers.userId, id), eq(boardMembers.boardId, boardId)))
    .limit(1);

  if (!member)
    return next(new AppError("Not authorized to access this board.", 403));

  // 3. get all lists
  const allLists = await db
    .select()
    .from(lists)
    .where(eq(lists.boardId, boardId))
    .orderBy(lists.position);

  res.status(200).json({
    status: "success",
    results: allLists.length,
    data: allLists,
  });
});
