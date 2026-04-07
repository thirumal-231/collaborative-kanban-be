import { db } from "../db/db.js";
import { boardMembers, boards } from "../models/schema.js";
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
      .values({ title: title })
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
