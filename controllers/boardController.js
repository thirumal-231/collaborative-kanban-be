import { and, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { boardMembers, boards, cards, lists, users } from "../models/schema.js";
import { AppError } from "../Utils/AppError.js";
import { catchAsync } from "../Utils/catchAsync.js";

export const createBoard = catchAsync(async (req, res, next) => {
  // 1. check for board title
  const { title } = req.body;
  if (!title) return next(new AppError("Title can't be empty", 400));
  const { id } = req.user;
  const result = await db.transaction(async (tx) => {
    // 2. create a board and get the ID back
    const [newBoard] = await tx
      .insert(boards)
      .values({ title: title, ownerId: id })
      .returning();
    // 3. use that ID to link the user in the bridge table
    await tx.insert(boardMembers).values({ userId: id, boardId: newBoard.id });
    return newBoard;
  });
  if (!result) return next(new AppError("Board creation failed.", 500));
  // 4. return the board
  console.log("create board is creating.");
  res.status(201).json({
    status: "success",
    message: "Board created.",
    data: result,
  });
});

export const getBoards = catchAsync(async (req, res, next) => {
  const { id } = req.user;
  const userWithBoards = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, id),
    with: {
      boardMemberships: {
        with: {
          board: true,
        },
      },
    },
  });
  if (!userWithBoards) {
    return next(new AppError("User not found", 404));
  }
  const boards = userWithBoards.boardMemberships.map(
    (membership) => membership.board,
  );
  res.status(201).json({
    status: "success",
    results: boards.length,
    data: boards,
  });
});

export const inviteMember = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const { boardId } = req.params;

  // 1. Validate input
  if (!email) return next(new AppError("Please provide email.", 400));

  // 1.1 if inviter is not the owner throw error
  const [board] = await db
    .select()
    .from(boards)
    .where(eq(boards.id, boardId))
    .limit(1);

  if (board.ownerId !== req.user.id)
    return next(new AppError("Only owner can invite", 403));

  // 2. CHeck if user exists
  const [userToInvite] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!userToInvite)
    return next(new AppError("User with that email not found.", 404));

  if (userToInvite.id === req.user.id)
    return next(new AppError("You are already in the board", 400));

  // 3. check if already a member;
  const [existingUser] = await db
    .select()
    .from(boardMembers)
    .where(
      and(
        eq(boardMembers.userId, userToInvite.id),
        eq(boardMembers.boardId, boardId),
      ),
    )
    .limit(1);

  if (existingUser) return next(new AppError("User already a member", 409));

  // 4. Add to board
  await db.insert(boardMembers).values({
    userId: userToInvite.id,
    boardId,
  });
  res.status(200).json({
    status: "success",
    message: "User invited successfully",
  });
});

export const getFullBoard = catchAsync(async (req, res, next) => {
  const { boardId } = req.params;
  const { id } = req.user;

  // 1. check if board exists
  const [board] = await db
    .select()
    .from(boards)
    .where(eq(boards.id, boardId))
    .limit(1);

  if (!board) {
    return next(new AppError("Board not found", 404));
  }

  // 2. check member or not
  const [member] = await db
    .select()
    .from(boardMembers)
    .where(and(eq(boardMembers.userId, id), eq(boardMembers.boardId, boardId)))
    .limit(1);
  if (!member)
    return next(new AppError("Not authorized to access this board.", 403));

  // 3. get full board
  const fullBoard = await db.query.boards.findFirst({
    where: (boards, { eq }) => eq(boards.id, boardId),
    with: {
      lists: {
        orderBy: (lists, { asc }) => asc(lists.position),
        with: {
          cards: {
            orderBy: (cards, { asc }) => asc(cards.position),
          },
        },
      },
    },
  });

  res.status(200).json({
    status: "success",
    data: fullBoard,
  });
});
