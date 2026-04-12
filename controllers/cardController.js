import { and, desc, eq } from "drizzle-orm";
import { boardMembers, boards, cards, lists } from "../models/schema.js";
import { AppError } from "../Utils/AppError.js";
import { catchAsync } from "../Utils/catchAsync.js";
import { db } from "../db/db.js";

export const createCard = catchAsync(async (req, res, next) => {
  // 1. check card title
  const { listId } = req.params;
  const { title } = req.body;
  const { id } = req.user;

  if (!title) return next(new AppError("Card title is required.", 400));

  // 3. get boardId
  const [list] = await db
    .select()
    .from(lists)
    .where(eq(lists.id, listId))
    .limit(1);
  if (!list) return next(new AppError("No list found with that listID", 404));

  // 2. check if user is part of board
  const boardId = list.boardId;
  const [member] = await db
    .select()
    .from(boardMembers)
    .where(and(eq(boardMembers.userId, id), eq(boardMembers.boardId, boardId)))
    .limit(1);
  if (!member)
    return next(
      new AppError("Only board members can create cards in a board.", 403),
    );

  // calculate position
  const lastCard = await db
    .select()
    .from(cards)
    .where(eq(cards.listId, listId))
    .orderBy(desc(cards.position))
    .limit(1);

  const newPosition = lastCard.length ? lastCard[0].position + 1 : 1;

  // 3. insert into cards
  const [card] = await db
    .insert(cards)
    .values({
      listId: listId,
      title: title,
      position: newPosition,
    })
    .returning();
  res.status(201).json({
    status: "success",
    message: "Card created successfully.",
    data: card,
  });
});

export const deleteCard = catchAsync(async (req, res, next) => {
  // 1. check list title
  const { cardId } = req.params;
  const { id } = req.user;

  // get card
  const [card] = await db
    .select()
    .from(cards)
    .where(eq(cards.id, cardId))
    .limit(1);

  if (!card) return next(new AppError("Card not found", 404));

  const [list] = await db
    .select()
    .from(lists)
    .where(eq(lists.id, card.listId))
    .limit(1);
  if (!list) return next(new AppError("List not found", 404));

  const boardId = list.boardId;

  // cehck membership
  const [member] = await db
    .select()
    .from(boardMembers)
    .where(and(eq(boardMembers.userId, id), eq(boardMembers.boardId, boardId)))
    .limit(1);

  if (!member)
    return next(new AppError("Not authorized to delete this card", 403));

  // delete
  const deletedCard = await db.delete(cards).where(eq(cards.id, cardId));

  res.status(200).json({
    status: "success",
    message: "Card deleted successfully.",
  });
});

export const getCards = catchAsync(async (req, res, next) => {
  // 1. get the boardId
  const { listId } = req.params;
  const { id } = req.user;

  // check if board exists
  const [list] = await db
    .select()
    .from(lists)
    .where(eq(lists.id, listId))
    .limit(1);

  if (!list) return next(new AppError("List not found", 404));

  // check if is a member
  const boardId = list.boardId;
  const [member] = await db
    .select()
    .from(boardMembers)
    .where(and(eq(boardMembers.userId, id), eq(boardMembers.boardId, boardId)))
    .limit(1);

  if (!member)
    return next(new AppError("Not authorized to access these cards.", 403));

  // 3. get all lists
  const allCards = await db
    .select()
    .from(cards)
    .where(eq(cards.listId, listId))
    .orderBy(cards.position);

  res.status(200).json({
    status: "success",
    results: allCards.length,
    data: allCards,
  });
});
