import { prisma } from "./prisma";

let cachedUser: any = null;

export async function getDefaultUser() {
  if (cachedUser) {
    return cachedUser;
  }

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
  cachedUser = user;
  return user;
}

