import {PrismaClient} from '@prisma/client';
const g=globalThis as unknown as {prisma?:PrismaClient};
export const db=g.prisma??new PrismaClient({datasources:{db:{url:process.env.DATABASE_URL||'file:./dev.db'}}});
if(process.env.NODE_ENV!=='production')g.prisma=db;
