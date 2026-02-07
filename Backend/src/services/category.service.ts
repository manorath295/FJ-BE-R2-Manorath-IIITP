import prisma from "../lib/db.js";
type CategoryType = "INCOME" | "EXPENSE";

export async function getUserCategories(userId: string) {
  return await prisma.category.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

export async function createCategory(
  userId: string,
  data: {
    name: string;
    type: CategoryType;
    icon?: string;
    color?: string;
  },
) {
  const existing = await prisma.category.findFirst({
    where: {
      userId,
      name: data.name,
      type: data.type,
    },
  });

  if (existing) {
    throw new Error("Category with this name already exists");
  }

  return await prisma.category.create({
    data: {
      userId,
      ...data,
    },
  });
}

export async function updateCategory(
  categoryId: string,
  userId: string,
  data: Partial<{
    name: string;
    icon: string;
    color: string;
  }>,
) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  if (category.isDefault) {
    throw new Error("Cannot modify default categories");
  }

  return await prisma.category.update({
    where: { id: categoryId },
    data,
  });
}


export async function deleteCategory(categoryId: string, userId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  if (category.isDefault) {
    throw new Error("Cannot delete default categories");
  }
  await prisma.category.delete({
    where: { id: categoryId },
  });

  return { message: "Category deleted successfully" };
}
