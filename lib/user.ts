import { prisma } from "./prisma";

export async function getDefaultUser() {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "trader@algodeploy.in",
        name: "Pro Algo Trader",
        role: "LEADER",
      },
    });
  }
  return user;
}
