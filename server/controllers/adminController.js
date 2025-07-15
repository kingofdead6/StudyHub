import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: { notIn: ['admin'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    res.json(users);
  } catch (err) {
    console.error('Error in getUsers:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    await prisma.$disconnect();
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid or missing user ID' });
    }

    const user = await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ message: 'User deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    console.error('Error in deleteUser:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    await prisma.$disconnect();
  }
};