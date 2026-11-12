import prisma from '@/lib/prisma';

export async function getEsiFormEnabled() {
  const [setting] = await prisma.$queryRaw`
    SELECT [IsEnabled]
    FROM [dbo].[EsiFormSettings]
    WHERE [SettingId] = 1
  `;
  if (!setting) {
    throw new Error('ESI form setting is missing from the database.');
  }
  return setting.IsEnabled;
}
